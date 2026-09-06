import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud import crud_centre
from app.schemas.auth import StandardResponse
from app.schemas.centre import CentreResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=StandardResponse)
async def read_centres(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    district: Optional[str] = None,
    state: Optional[str] = None,
    # skip auth for centres if we want to allow public browsing, but per contract let's require it or make it optional. Contract doesn't explicitly restrict, but let's check auth.
    current_user = Depends(get_current_user)
) -> Any:
    skip = (page - 1) * limit
    items, total = await crud_centre.get_centres(db, skip=skip, limit=limit, district=district, state=state)
    
    # Normally we'd calculate current_load and estimated_wait_minutes here using prediction layer
    
    return {
        "success": True,
        "data": {
            "items": [CentreResponse.model_validate(c).model_dump() for c in items],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "has_next": (skip + limit) < total
            }
        },
        "message": "Centres returned."
    }

@router.get("/{centre_id}", response_model=StandardResponse)
async def read_centre(
    centre_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    centre = await crud_centre.get_centre(db, centre_id=centre_id)
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
        
    return {
        "success": True,
        "data": CentreResponse.model_validate(centre).model_dump(),
        "message": "Centre returned."
    }
