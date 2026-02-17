"""
Application configuration using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Application
    APP_NAME: str = "Virtual Try-On API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # AWS S3
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_S3_BUCKET: str
    AWS_REGION: str = "us-east-1"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Rate Limiting
    RATE_LIMIT_FREE_PER_MINUTE: int = 1
    RATE_LIMIT_FREE_PER_DAY: int = 5
    RATE_LIMIT_PRO_PER_MINUTE: int = 3
    RATE_LIMIT_PRO_PER_DAY: int = 50
    
    # Quotas
    FREE_CREDITS_DEFAULT: int = 5
    FREE_DAILY_LIMIT: int = 5
    FREE_MONTHLY_LIMIT: int = 20
    PRO_DAILY_LIMIT: int = 50
    PRO_MONTHLY_LIMIT: int = 500
    
    # Image Processing
    MAX_IMAGE_SIZE_MB: int = 10
    ALLOWED_IMAGE_FORMATS: list = ["JPEG", "PNG", "WEBP"]
    MIN_IMAGE_RESOLUTION: tuple = (512, 512)
    MAX_IMAGE_RESOLUTION: tuple = (2048, 2048)
    
    # Job Settings
    JOB_TIMEOUT_SECONDS: int = 120
    JOB_POLL_INTERVAL_SECONDS: int = 2
    
    # CORS
    # Include all local dev origins; override via .env as a JSON array
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:3002",
        "http://localhost:8081",
    ]
    
    # Sentry (optional)
    SENTRY_DSN: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
