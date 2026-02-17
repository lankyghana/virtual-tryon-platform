"""
Placeholder Results API routes to satisfy frontend calls.
These return empty responses but allow the UI to function without 404s
until a real results feature is implemented.
"""
from fastapi import APIRouter, Depends

from app.utils.auth import get_current_user


router = APIRouter(prefix="/results", tags=["Results"])


@router.get("")
async def list_results(page: int = 1, limit: int = 20, current_user=Depends(get_current_user)):
    """Return an empty results list (placeholder)."""
    return {"results": [], "page": page, "limit": limit, "total": 0}


@router.post("/{result_id}/favorite")
async def favorite_result(result_id: str, current_user=Depends(get_current_user)):
    """Acknowledge favorite action (placeholder)."""
    return {"result_id": result_id, "favorited": True}


@router.delete("/{result_id}")
async def delete_result(result_id: str, current_user=Depends(get_current_user)):
    """Acknowledge delete action (placeholder)."""
    return {"result_id": result_id, "deleted": True}
