"""
Authentication Pydantic schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class GoogleLoginRequest(BaseModel):
    """Request schema for Google OAuth login"""
    credential: str = Field(..., description="Google OAuth credential token")


class RegisterRequest(BaseModel):
    """Request schema for email/password registration"""
    name: Optional[str] = Field(None, description="User display name")
    email: EmailStr
    password: str = Field(..., min_length=8)


class EmailLoginRequest(BaseModel):
    """Request schema for email/password login"""
    email: EmailStr
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshTokenRequest(BaseModel):
    """Request schema for refreshing JWT token"""
    refresh_token: str


class UserResponse(BaseModel):
    """User information response"""
    id: str
    email: str
    name: Optional[str]
    profile_picture_url: Optional[str]
    plan: str
    credits_remaining: int
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True
