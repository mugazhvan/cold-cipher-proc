import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud import crud_centre, crud_booking
from app.schemas.auth import StandardResponse
from app.schemas.centre import CentreResponse
from app.schemas.booking import BookingResponse
from app.api.deps import get_current_user, RoleChecker, verify_centre_access
from app.models.users import UserRole, User

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

@router.get("/{centre_id}/bookings", response_model=StandardResponse)
async def read_centre_bookings(
    centre_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    # Verify the user has access to this centre
    await verify_centre_access(db, current_user, centre_id)
    
    bookings, total = await crud_booking.get_bookings_for_centre(db, centre_id=centre_id, skip=skip, limit=limit)
    
    return {
        "success": True,
        "data": {
            "items": [BookingResponse.model_validate(b).model_dump() for b in bookings],
            "total": total
        },
        "message": "Centre bookings returned."
    }
