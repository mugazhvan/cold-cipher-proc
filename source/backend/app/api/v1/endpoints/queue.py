import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.crud import crud_queue, crud_farmer
from app.schemas.auth import StandardResponse
from app.schemas.queue import TokenResponse, QueueStatusResponse
from app.models.queue import QueueToken, QueueStatus
from app.api.deps import get_current_user, RoleChecker
from app.models.users import User, UserRole

router = APIRouter()

@router.post("/bookings/{booking_id}/token", response_model=StandardResponse, status_code=201)
async def get_token_for_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    # MVP assumption: farmer can only get token for their own booking
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    token = await crud_queue.generate_token(db, booking_id=booking_id, farmer_id=farmer.id)
    
    return {
        "success": True,
        "data": TokenResponse.model_validate(token).model_dump(),
        "message": "Token generated."
    }

@router.get("/bookings/{booking_id}/token", response_model=StandardResponse)
async def view_token(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    token = await crud_queue.get_token_by_booking(db, booking_id=booking_id, farmer_id=farmer.id)
    if not token:
        raise HTTPException(status_code=404, detail="Token not found for this booking")
        
    return {
        "success": True,
        "data": TokenResponse.model_validate(token).model_dump(),
        "message": "Token returned."
    }

@router.post("/tokens/{token_id}/check-in", response_model=StandardResponse)
async def check_in_token(
    token_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    token = await crud_queue.check_in(db, token_id=token_id, farmer_id=farmer.id)
    
    return {
        "success": True,
        "data": TokenResponse.model_validate(token).model_dump(),
        "message": "Check-in successful."
    }

@router.get("/centres/{centre_id}/live-status", response_model=StandardResponse)
async def live_queue_status(
    centre_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Count waiting tokens
    waiting_result = await db.execute(
        select(func.count()).where(QueueToken.centre_id == centre_id).where(QueueToken.status == QueueStatus.WAITING)
    )
    total_waiting = waiting_result.scalar_one()
    
    # Get currently serving token
    serving_result = await db.execute(
        select(QueueToken.token_number).where(QueueToken.centre_id == centre_id).where(QueueToken.status == QueueStatus.CALLED)
    )
    current_serving = serving_result.scalars().first()
    
    return {
        "success": True,
        "data": {
            "centre_id": str(centre_id),
            "current_serving_token": current_serving,
            "total_waiting": total_waiting,
            "average_wait_time_minutes": 15 # Static baseline for MVP
        },
        "message": "Queue status returned."
    }
