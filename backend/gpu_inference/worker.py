"""
GPU Worker - Consumes jobs from Redis queue and processes them
"""
import redis
import json
import time
import os
import sys
from datetime import datetime
import requests
from io import BytesIO
from PIL import Image
import tempfile

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from production_pipeline import ProductionTryonPipeline
from app.services.local_tryon_service import LocalTryonService
import boto3
from dotenv import load_dotenv

# Load environment variables
backend_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=backend_env_path)

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DATABASE_URL = os.getenv("DATABASE_URL")
TRYON_PIPELINE_MODE = os.getenv("TRYON_PIPELINE_MODE", "local").lower()

# Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

# Initialize AI pipeline
print("🚀 Initializing AI pipeline...")
if TRYON_PIPELINE_MODE == "production":
    print("[PIPELINE] TRYON_PIPELINE_MODE=production")
    print("[PIPELINE] Using PRODUCTION pipeline (SCHP + pose + real VTON)")
    try:
        pipeline = ProductionTryonPipeline()
        print("✅ Production pipeline ready")
    except Exception as exc:
        print(f"[PIPELINE][ERROR] Production pipeline misconfigured: {exc}")
        raise
else:
    print(f"[PIPELINE][WARNING] TRYON_PIPELINE_MODE={TRYON_PIPELINE_MODE}")
    print("[PIPELINE][WARNING] Using LOCAL fallback generator (not production VTON)")
    pipeline = None
    print("✅ Local fallback pipeline ready")
print("✅ Pipeline ready\n")


def download_image_from_s3(s3_url: str, local_path: str):
    """Download image from S3 URL to local file"""
    # Extract key from S3 URL
    # Format: https://bucket.s3.region.amazonaws.com/key
    parts = s3_url.split('.s3.')
    if len(parts) < 2:
        # Try alternative format
        parts = s3_url.split('/')
        key = '/'.join(parts[3:])
    else:
        key = parts[1].split('/', 1)[1]
    
    # Download from S3
    s3_client.download_file(AWS_S3_BUCKET, key, local_path)
    print(f"  📥 Downloaded: {key}")


def upload_result_to_s3(local_path: str, job_id: str) -> str:
    """Upload result image to S3 and return URL"""
    timestamp = datetime.now().strftime("%Y%m%d")
    key = f"results/{timestamp}/{job_id}/output.png"
    
    s3_client.upload_file(
        local_path,
        AWS_S3_BUCKET,
        key,
        ExtraArgs={'ContentType': 'image/png'}
    )
    
    url = f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
    print(f"  📤 Uploaded result: {key}")
    return url


def update_job_status(job_id: str, status: str, result_url: str = None, error: str = None, processing_time_ms: int = None):
    """Update job status in database via API"""
    # In production, this would call the backend API
    # For now, we'll use direct database access
    
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        from app.models import Job, JobStatus
        
        job = session.query(Job).filter(Job.id == job_id).first()
        
        if job:
            job.status = JobStatus[status.upper()]
            
            if status.upper() == "PROCESSING" and not job.started_at:
                job.started_at = datetime.utcnow()
            
            if status.upper() in ["COMPLETED", "FAILED"]:
                job.completed_at = datetime.utcnow()
            
            if result_url:
                job.result_image_url = result_url
            
            if error:
                job.error_message = error
            
            if processing_time_ms:
                job.processing_time_ms = processing_time_ms
            
            session.commit()
            print(f"  ✅ Job {job_id} status updated: {status}")
        else:
            print(f"  ⚠️  Job {job_id} not found in database")
    
    except Exception as e:
        print(f"  ❌ Failed to update job status: {e}")
        session.rollback()
    finally:
        session.close()


def process_job(job_data: dict):
    """
    Process a single try-on job
    
    Args:
        job_data: Dict with 'job_id' and other metadata
    """
    job_id = job_data['job_id']
    print(f"\n{'='*60}")
    print(f"🎬 Processing job: {job_id}")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        # Update status to PROCESSING
        update_job_status(job_id, "PROCESSING")
        
        # Get job details from database
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        from app.models import Job
        job = session.query(Job).filter(Job.id == job_id).first()
        session.close()
        
        if not job:
            raise Exception("Job not found in database")
        
        print(f"📋 User image: {job.user_image_url[:50]}...")
        print(f"📋 Garment image: {job.garment_image_url[:50]}...")
        
        # Download images from S3
        print("\n📥 Downloading images from S3...")
        temp_dir = tempfile.gettempdir()
        user_img_path = os.path.join(temp_dir, f"{job_id}_user.jpg")
        garment_img_path = os.path.join(temp_dir, f"{job_id}_garment.jpg")
        
        download_image_from_s3(job.user_image_url, user_img_path)
        download_image_from_s3(job.garment_image_url, garment_img_path)
        
        # Run AI pipeline
        print("\n🎨 Running AI pipeline...")
        result_path = os.path.join(temp_dir, f"{job_id}_result.png")

        if TRYON_PIPELINE_MODE == "production":
            pipeline.run(
                person_image_path=user_img_path,
                garment_image_path=garment_img_path,
                output_path=result_path,
            )
        else:
            LocalTryonService.generate(
                person_image_path=user_img_path,
                garment_image_path=garment_img_path,
                output_path=result_path,
            )
        
        # Upload result to S3
        print("\n📤 Uploading result to S3...")
        result_url = upload_result_to_s3(result_path, job_id)
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Update job status to COMPLETED
        update_job_status(
            job_id,
            "COMPLETED",
            result_url=result_url,
            processing_time_ms=processing_time_ms
        )
        
        # Cleanup temporary files
        for path in [user_img_path, garment_img_path, result_path]:
            if os.path.exists(path):
                os.remove(path)
        
        print(f"\n✅ Job completed successfully!")
        print(f"⏱️  Total time: {processing_time_ms}ms ({processing_time_ms/1000:.1f}s)")
        print(f"🖼️  Result URL: {result_url}")
        
    except Exception as e:
        print(f"\n❌ Job failed: {str(e)}")
        
        # Update job status to FAILED
        processing_time_ms = int((time.time() - start_time) * 1000)
        update_job_status(
            job_id,
            "FAILED",
            error=str(e),
            processing_time_ms=processing_time_ms
        )


def main():
    """Main worker loop"""
    print("=" * 60)
    print("🤖 GPU Worker Started")
    print("=" * 60)
    print(f"Redis: {REDIS_URL}")
    print(f"S3 Bucket: {AWS_S3_BUCKET}")
    print(f"Database: {DATABASE_URL[:30]}...")
    print("=" * 60)
    print("\n👀 Watching for jobs...\n")
    
    while True:
        try:
            # Blocking pop from Redis queue (timeout 5 seconds)
            job_data = redis_client.brpop("job_queue", timeout=5)
            
            if job_data:
                # job_data is tuple: (queue_name, value)
                queue_name, job_json = job_data
                job_dict = json.loads(job_json)
                
                # Process the job
                process_job(job_dict)
            else:
                # No jobs in queue
                print("⏳ Waiting for jobs...", end='\r')
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n\n👋 Worker shutting down...")
            break
        except Exception as e:
            print(f"\n❌ Worker error: {e}")
            time.sleep(5)  # Wait before retrying


if __name__ == "__main__":
    main()
