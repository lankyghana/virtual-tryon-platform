"""
Job Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class JobCreateResponse(BaseModel):
    """Response after creating a job"""
    job_id: str
    status: str
    message: str = "Job created successfully"


class JobStatusResponse(BaseModel):
    """Job status polling response"""
    job_id: str
    status: str
    progress: Optional[int] = Field(None, description="Progress percentage (0-100)")
    estimated_time_remaining: Optional[int] = Field(None, description="Seconds remaining")
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class JobResultResponse(BaseModel):
    """Job result response"""
    job_id: str
    status: str
    result_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    processing_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    """List of jobs response"""
    jobs: list
    total: int
    page: int
    page_size: int
