"""
Rate limiting utilities using Redis
"""
import redis
from app.config import settings
from typing import Optional

# Redis client
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


def check_rate_limit(user_id: str, limit_type: str = "per_minute") -> bool:
    """
    Check if user has exceeded rate limit
    
    Args:
        user_id: User UUID
        limit_type: Type of limit ("per_minute", "per_day")
    
    Returns:
        True if allowed, False if rate limit exceeded
    """
    key = f"rate_limit:{user_id}:{limit_type}"
    
    current = redis_client.get(key)
    
    if limit_type == "per_minute":
        limit = settings.RATE_LIMIT_FREE_PER_MINUTE
        expiry = 60
    elif limit_type == "per_day":
        limit = settings.RATE_LIMIT_FREE_PER_DAY
        expiry = 86400
    else:
        return True
    
    if current is None:
        redis_client.setex(key, expiry, 1)
        return True
    
    if int(current) >= limit:
        return False
    
    redis_client.incr(key)
    return True


def reset_rate_limit(user_id: str, limit_type: str = "per_minute"):
    """Reset rate limit for a user"""
    key = f"rate_limit:{user_id}:{limit_type}"
    redis_client.delete(key)


def get_rate_limit_status(user_id: str, limit_type: str = "per_minute") -> dict:
    """
    Get current rate limit status
    
    Returns:
        Dict with 'used', 'limit', 'remaining'
    """
    key = f"rate_limit:{user_id}:{limit_type}"
    current = redis_client.get(key)
    
    if limit_type == "per_minute":
        limit = settings.RATE_LIMIT_FREE_PER_MINUTE
    elif limit_type == "per_day":
        limit = settings.RATE_LIMIT_FREE_PER_DAY
    else:
        limit = 0
    
    used = int(current) if current else 0
    
    return {
        "used": used,
        "limit": limit,
        "remaining": max(0, limit - used)
    }
