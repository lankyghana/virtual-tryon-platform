"""
Authentication API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime
import bcrypt

from app.database import get_db
from app.models import User, PlanType
from app.schemas.auth import (
    GoogleLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    RegisterRequest,
    EmailLoginRequest,
)
from app.utils.jwt import create_access_token, create_refresh_token, verify_token
from app.config import settings

router = APIRouter()


@router.post("/google/login", response_model=TokenResponse)
async def google_login(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with Google OAuth
    
    Process:
    1. Verify Google credential token
    2. Extract user info
    3. Create or update user in database
    4. Generate JWT tokens
    """
    try:
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            payload.credential,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        # Extract user information
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name')
        picture = idinfo.get('picture')
        
        # Get or create user
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if user:
            # Update existing user
            user.last_login = datetime.utcnow()
            if name:
                user.name = name
            if picture:
                user.profile_picture_url = picture
        else:
            # Create new user
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                profile_picture_url=picture,
                plan=PlanType.FREE,
                credits_remaining=settings.FREE_CREDITS_DEFAULT
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        
        # Generate JWT tokens
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user.to_dict()
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a user with email/password.
    If a Google-only account exists for the email without a password, upgrade it.
    """
    email = payload.email.lower()

    existing = db.query(User).filter(User.email == email).first()
    if existing and existing.password_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    password_hash = bcrypt.hashpw(
        payload.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    if existing:
        # Upgrade Google-only account
        existing.password_hash = password_hash
        if payload.name:
            existing.name = payload.name
        user = existing
    else:
        user = User(
            email=email,
            name=payload.name,
            password_hash=password_hash,
            plan=PlanType.FREE,
            credits_remaining=settings.FREE_CREDITS_DEFAULT,
        )
        db.add(user)

    db.commit()
    db.refresh(user)

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user.to_dict(),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: EmailLoginRequest, db: Session = Depends(get_db)):
    """Login with email/password"""
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    is_valid = bcrypt.checkpw(
        payload.password.encode("utf-8"),
        user.password_hash.encode("utf-8")
    )

    if not is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user.to_dict(),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh JWT access token using refresh token
    """
    user_id = verify_token(payload.refresh_token, token_type="refresh")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Generate new tokens
    access_token = create_access_token(str(user.id))
    new_refresh_token = create_refresh_token(str(user.id))
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=user.to_dict()
    )


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client should discard tokens)
    """
    return {"message": "Logged out successfully"}
