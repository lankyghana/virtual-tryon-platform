"""
Job service for managing virtual try-on jobs
"""
from sqlalchemy.orm import Session
from app.models import Job, JobStatus, User, Result, Quota
from app.config import settings
from datetime import datetime, timedelta, timezone
import redis
import json
import uuid

# Redis client for job queue
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


class JobService:
    """Service for job management"""

    @staticmethod
    def _to_utc(dt: datetime) -> datetime:
        """Normalize datetime to timezone-aware UTC."""
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    
    @staticmethod
    def check_quota(db: Session, user: User) -> tuple[bool, str]:
        """
        Check if user has available quota
        
        Returns:
            (has_quota, message)
        """
        quota = db.query(Quota).filter(Quota.user_id == user.id).first()
        
        if not quota:
            # Create initial quota
            quota = Quota(
                user_id=user.id,
                daily_limit=settings.FREE_DAILY_LIMIT,
                monthly_limit=settings.FREE_MONTHLY_LIMIT
            )
            db.add(quota)
            db.commit()
        
        # Check if quota needs reset
        now = datetime.now(timezone.utc)
        daily_reset_at = JobService._to_utc(quota.last_daily_reset)
        monthly_reset_at = JobService._to_utc(quota.last_monthly_reset)
        
        # Daily reset
        if (now - daily_reset_at).days >= 1:
            quota.daily_used = 0
            quota.last_daily_reset = now
        
        # Monthly reset
        if (now - monthly_reset_at).days >= 30:
            quota.monthly_used = 0
            quota.last_monthly_reset = now
        
        db.commit()
        
        # Check limits
        if quota.daily_used >= quota.daily_limit:
            return False, f"Daily limit reached ({quota.daily_limit}). Resets at midnight UTC."
        
        if quota.monthly_used >= quota.monthly_limit:
            return False, f"Monthly limit reached ({quota.monthly_limit}). Upgrade to Pro for more."
        
        return True, "Quota available"
    
    @staticmethod
    def create_job(
        db: Session,
        user: User,
        user_image_url: str,
        garment_image_url: str
    ) -> Job:
        """
        Create a new try-on job
        
        Args:
            db: Database session
            user: User object
            user_image_url: S3 URL of user image
            garment_image_url: S3 URL of garment image
        
        Returns:
            Created Job object
        """
        job = Job(
            user_id=user.id,
            status=JobStatus.PENDING,
            user_image_url=user_image_url,
            garment_image_url=garment_image_url
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Increment quota
        quota = db.query(Quota).filter(Quota.user_id == user.id).first()
        if quota:
            quota.daily_used += 1
            quota.monthly_used += 1
            db.commit()
        
        return job
    
    @staticmethod
    def enqueue_job(job_id: str) -> bool:
        """
        Add job to Redis queue for processing
        
        Args:
            job_id: Job UUID
        
        Returns:
            True if successful
        """
        job_data = {
            "job_id": str(job_id),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            redis_client.lpush("job_queue", json.dumps(job_data))
            return True
        except Exception:
            return False
    
    @staticmethod
    def update_job_status(
        db: Session,
        job_id: str,
        status: JobStatus,
        result_url: str = None,
        error_message: str = None,
        processing_time_ms: int = None
    ) -> Job:
        """
        Update job status
        
        Args:
            db: Database session
            job_id: Job UUID
            status: New status
            result_url: Optional result URL
            error_message: Optional error message
            processing_time_ms: Optional processing time
        
        Returns:
            Updated Job object
        """
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            raise ValueError(f"Job {job_id} not found")
        
        job.status = status
        
        if status == JobStatus.PROCESSING and not job.started_at:
            job.started_at = datetime.utcnow()
        
        if status in [JobStatus.COMPLETED, JobStatus.FAILED]:
            job.completed_at = datetime.utcnow()
        
        if result_url:
            job.result_image_url = result_url
        
        if error_message:
            job.error_message = error_message
        
        if processing_time_ms:
            job.processing_time_ms = processing_time_ms
        
        db.commit()
        db.refresh(job)
        
        # Create result entry if completed
        if status == JobStatus.COMPLETED and result_url:
            result = Result(
                job_id=job.id,
                user_id=job.user_id,
                image_url=result_url
            )
            db.add(result)
            db.commit()
        
        return job
    
    @staticmethod
    def get_job(db: Session, job_id: str, user: User = None) -> Job:
        """
        Get job by ID
        
        Args:
            db: Database session
            job_id: Job UUID
            user: Optional user for authorization check
        
        Returns:
            Job object
        """
        query = db.query(Job).filter(Job.id == job_id)
        
        if user:
            query = query.filter(Job.user_id == user.id)
        
        job = query.first()
        
        if not job:
            raise ValueError("Job not found")
        
        return job
    
    @staticmethod
    def list_user_jobs(
        db: Session,
        user: User,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[list, int]:
        """
        List user's jobs with pagination
        
        Returns:
            (jobs, total_count)
        """
        query = db.query(Job).filter(Job.user_id == user.id).order_by(Job.created_at.desc())
        
        total = query.count()
        jobs = query.offset((page - 1) * page_size).limit(page_size).all()
        
        return jobs, total
    
    @staticmethod
    def delete_job(db: Session, job_id: str, user: User) -> bool:
        """
        Delete a job (soft delete by setting status to CANCELLED)
        
        Returns:
            True if successful
        """
        job = db.query(Job).filter(
            Job.id == job_id,
            Job.user_id == user.id
        ).first()
        
        if not job:
            raise ValueError("Job not found")
        
        if job.status in [JobStatus.PENDING, JobStatus.PROCESSING]:
            job.status = JobStatus.CANCELLED
            db.commit()
        
        return True
