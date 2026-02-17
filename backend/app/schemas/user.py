"""
User Pydantic schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class QuotaResponse(BaseModel):
    """User quota information"""
    daily: dict
    monthly: dict
    last_daily_reset: datetime
    last_monthly_reset: datetime


class UserProfileResponse(BaseModel):
    """User profile response"""
    id: str
    email: str
    name: Optional[str]
    profile_picture_url: Optional[str]
    plan: str
    credits_remaining: int
    quota: QuotaResponse
    created_at: datetime
