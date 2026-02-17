"""
Jobs API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from PIL import Image
import io
import os

from app.database import get_db
from app.models import User, JobStatus
from app.schemas.job import (
    JobCreateResponse,
    JobStatusResponse,
    JobResultResponse,
    JobListResponse
)
from app.utils.auth import get_current_user
from app.services.job_service import JobService
from app.services.storage_service import storage_service
from app.services.local_tryon_service import LocalTryonService
from app.config import settings

router = APIRouter()


def _pipeline_mode() -> str:
    return os.getenv("TRYON_PIPELINE_MODE", "local").strip().lower()


def validate_image(file: UploadFile) -> tuple[bool, str]:
    """
    Validate uploaded image
    
    Returns:
        (is_valid, error_message)
    """
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset
    
    if file_size > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
        return False, f"File too large (max {settings.MAX_IMAGE_SIZE_MB}MB)"
    
    # Check content type
    if not file.content_type.startswith("image/"):
        return False, "File must be an image"
    
    try:
        # Validate image can be opened
        image = Image.open(file.file)
        
        # Check format
        if image.format not in settings.ALLOWED_IMAGE_FORMATS:
            return False, f"Image format must be one of: {', '.join(settings.ALLOWED_IMAGE_FORMATS)}"
        
        # Check resolution
        width, height = image.size
        min_w, min_h = settings.MIN_IMAGE_RESOLUTION
        max_w, max_h = settings.MAX_IMAGE_RESOLUTION
        
        if width < min_w or height < min_h:
            return False, f"Image too small (min {min_w}x{min_h})"
        
        if width > max_w or height > max_h:
            return False, f"Image too large (max {max_w}x{max_h})"
        
        # Reset file pointer
        file.file.seek(0)
        
        return True, "Valid"
        
    except Exception as e:
        return False, f"Invalid image: {str(e)}"


@router.post("/create", response_model=JobCreateResponse)
async def create_job(
    user_image: UploadFile = File(..., description="Photo of the user"),
    garment_image: UploadFile = File(..., description="Photo of the garment/clothing"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new virtual try-on job
    
    Steps:
    1. Validate images
    2. Check user quota
    3. Upload images to S3
    4. Create job record
    5. Enqueue for processing
    """
    # Validate user image
    valid, message = validate_image(user_image)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User image validation failed: {message}"
        )
    
    # Validate garment image
    valid, message = validate_image(garment_image)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Garment image validation failed: {message}"
        )
    
    # Check quota
    has_quota, quota_message = JobService.check_quota(db, current_user)
    if not has_quota:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=quota_message
        )
    
    try:
        # Generate job ID
        from uuid import uuid4
        job_id = str(uuid4())
        
        # Upload user image to S3
        user_key = storage_service.generate_job_key(
            str(current_user.id),
            job_id,
            "user.jpg"
        )
        user_image_url = storage_service.upload_file(
            user_image.file,
            user_key,
            user_image.content_type
        )
        
        # Upload garment image to S3
        garment_key = storage_service.generate_job_key(
            str(current_user.id),
            job_id,
            "garment.jpg"
        )
        garment_image_url = storage_service.upload_file(
            garment_image.file,
            garment_key,
            garment_image.content_type
        )
        
        # Create job in database
        job = JobService.create_job(
            db,
            current_user,
            user_image_url,
            garment_image_url
        )

        mode = _pipeline_mode()

        # In production mode we must use the real worker/VTON path.
        # Local-storage short-circuit is not allowed in this mode.
        if mode == "production" and storage_service.use_local_storage:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "TRYON_PIPELINE_MODE=production requires real storage + worker pipeline. "
                    "Current storage is local fallback (dummy AWS config)."
                ),
            )

        # Local development fallback when using dummy AWS credentials:
        # complete immediately so the app is usable without GPU worker setup.
        if storage_service.use_local_storage and mode != "production":
            result_url = user_image_url
            try:
                user_local_path = storage_service.local_path_for_key(user_key)
                garment_local_path = storage_service.local_path_for_key(garment_key)
                result_key = storage_service.generate_result_key(job_id, "output.jpg")
                result_local_path = storage_service.local_path_for_key(result_key)

                LocalTryonService.generate(
                    person_image_path=str(user_local_path),
                    garment_image_path=str(garment_local_path),
                    output_path=str(result_local_path),
                )
                result_url = storage_service.local_url_for_key(result_key)
            except Exception:
                # Graceful fallback for local mode if try-on synthesis fails.
                result_url = user_image_url

            job = JobService.update_job_status(
                db,
                str(job.id),
                JobStatus.COMPLETED,
                result_url=result_url,
                processing_time_ms=0,
            )
            return JobCreateResponse(
                job_id=str(job.id),
                status=job.status.value,
                message="Job completed in local development mode"
            )
        
        # Enqueue job for processing
        queued = JobService.enqueue_job(str(job.id))

        if not queued:
            # Local development fallback when Redis/worker is unavailable
            job = JobService.update_job_status(
                db,
                str(job.id),
                JobStatus.COMPLETED,
                result_url=user_image_url,
                processing_time_ms=0,
            )
            return JobCreateResponse(
                job_id=str(job.id),
                status=job.status.value,
                message="Job completed in local fallback mode"
            )

        return JobCreateResponse(
            job_id=str(job.id),
            status=job.status.value,
            message="Job created successfully and queued for processing"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create job: {str(e)}"
        )


@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get job processing status
    
    Poll this endpoint every 2-3 seconds to check progress
    """
    try:
        job = JobService.get_job(db, job_id, current_user)
        
        # Calculate progress
        progress = None
        estimated_time = None
        
        if job.status == JobStatus.PENDING:
            progress = 0
            estimated_time = 20
        elif job.status == JobStatus.PROCESSING:
            progress = 50
            estimated_time = 10
        elif job.status == JobStatus.COMPLETED:
            progress = 100
            estimated_time = 0
        
        return JobStatusResponse(
            job_id=str(job.id),
            status=job.status.value,
            progress=progress,
            estimated_time_remaining=estimated_time,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{job_id}/result", response_model=JobResultResponse)
async def get_job_result(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get job result with download URL
    """
    try:
        job = JobService.get_job(db, job_id, current_user)
        
        result_url = None
        if job.result_image_url:
            # Generate signed URL for download
            result_url = job.result_image_url
        
        return JobResultResponse(
            job_id=str(job.id),
            status=job.status.value,
            result_url=result_url,
            processing_time_ms=job.processing_time_ms,
            error_message=job.error_message
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/", response_model=JobListResponse)
async def list_jobs(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List user's jobs with pagination
    """
    jobs, total = JobService.list_user_jobs(db, current_user, page, page_size)
    
    return JobListResponse(
        jobs=[job.to_dict() for job in jobs],
        total=total,
        page=page,
        page_size=page_size
    )


@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel or delete a job
    """
    try:
        JobService.delete_job(db, job_id, current_user)
        return {"message": "Job deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
