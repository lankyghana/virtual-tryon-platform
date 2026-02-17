"""
Quota database model for tracking usage limits
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class Quota(Base):
    """User quota tracking model"""
    __tablename__ = "quotas"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # Limits
    daily_limit = Column(Integer, default=5, nullable=False)
    monthly_limit = Column(Integer, default=20, nullable=False)
    
    # Usage counters
    daily_used = Column(Integer, default=0, nullable=False)
    monthly_used = Column(Integer, default=0, nullable=False)
    
    # Reset timestamps
    last_daily_reset = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_monthly_reset = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Quota user_id={self.user_id}>"
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "user_id": str(self.user_id),
            "daily": {
                "used": self.daily_used,
                "limit": self.daily_limit,
                "remaining": max(0, self.daily_limit - self.daily_used)
            },
            "monthly": {
                "used": self.monthly_used,
                "limit": self.monthly_limit,
                "remaining": max(0, self.monthly_limit - self.monthly_used)
            },
            "last_daily_reset": self.last_daily_reset.isoformat() if self.last_daily_reset else None,
            "last_monthly_reset": self.last_monthly_reset.isoformat() if self.last_monthly_reset else None
        }
