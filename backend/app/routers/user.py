"""
User API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Quota
from app.schemas.user import UserProfileResponse, QuotaResponse
from app.utils.auth import get_current_user

router = APIRouter()


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's profile information
    """
    # Get quota information
    quota = db.query(Quota).filter(Quota.user_id == current_user.id).first()
    
    if not quota:
        # Create default quota
        from app.config import settings
        quota = Quota(
            user_id=current_user.id,
            daily_limit=settings.FREE_DAILY_LIMIT,
            monthly_limit=settings.FREE_MONTHLY_LIMIT
        )
        db.add(quota)
        db.commit()
        db.refresh(quota)
    
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        profile_picture_url=current_user.profile_picture_url,
        plan=current_user.plan.value,
        credits_remaining=current_user.credits_remaining,
        quota=QuotaResponse(**quota.to_dict()),
        created_at=current_user.created_at
    )


@router.get("/quota", response_model=QuotaResponse)
async def get_quota(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's quota and usage information
    """
    quota = db.query(Quota).filter(Quota.user_id == current_user.id).first()
    
    if not quota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quota information not found"
        )
    
    return QuotaResponse(**quota.to_dict())
