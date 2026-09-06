import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.crud import crud_booking, crud_farmer
from app.schemas.auth import StandardResponse
from app.schemas.booking import BookingCreate, BookingResponse
from app.api.deps import get_current_user, RoleChecker
from app.models.users import User, UserRole

router = APIRouter()

@router.post("", response_model=StandardResponse, status_code=201)
async def create_booking(
    booking_in: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    try:
        booking = await crud_booking.create_booking(db, farmer_id=farmer.id, booking_in=booking_in)
    except HTTPException as e:
        raise e
        
    return {
        "success": True,
        "data": BookingResponse.model_validate(booking).model_dump(),
        "message": "Booking created."
    }

@router.get("", response_model=StandardResponse)
async def get_bookings(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    bookings, total = await crud_booking.get_bookings_for_farmer(db, farmer.id, skip=skip, limit=limit)
    
    return {
        "success": True,
        "data": {
            "items": [BookingResponse.model_validate(b).model_dump() for b in bookings],
            "total": total
        },
        "message": "Bookings returned."
    }

@router.delete("/{booking_id}", response_model=StandardResponse)
async def cancel_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    booking = await crud_booking.get_booking(db, booking_id)
    if not booking or booking.farmer_id != farmer.id:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    cancelled_booking = await crud_booking.cancel_booking(db, booking)
    
    return {
        "success": True,
        "data": BookingResponse.model_validate(cancelled_booking).model_dump(),
        "message": "Booking cancelled."
    }

@router.get("/{booking_id}", response_model=StandardResponse)
async def get_booking_details(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER, UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER]))
) -> Any:
    # Need to get booking and eagerly load crop.
    # Instead of full crud update, do a simple select
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(crud_booking.Booking)
        .where(crud_booking.Booking.id == booking_id)
        .options(selectinload(crud_booking.Booking.crop).selectinload(crud_booking.Crop.category))
    )
    booking = result.scalars().first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    # Get crop type from FarmerCrop
    from app.models.entities import FarmerCrop
    fc_result = await db.execute(
        select(FarmerCrop)
        .where(FarmerCrop.farmer_id == booking.farmer_id)
        .where(FarmerCrop.crop_id == booking.crop_id)
        .options(selectinload(FarmerCrop.crop_type))
    )
    farmer_crop = fc_result.scalars().first()
    
    resp_data = BookingResponse.model_validate(booking).model_dump()
    if farmer_crop and farmer_crop.crop_type:
        from app.schemas.crop import CropTypeResponse
        resp_data["crop_type"] = CropTypeResponse.model_validate(farmer_crop.crop_type).model_dump()
        
    return {
        "success": True,
        "data": resp_data,
        "message": "Booking details returned."
    }
