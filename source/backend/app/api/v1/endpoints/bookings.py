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

from app.core.security import create_signed_qr_payload
import time

router = APIRouter()

@router.get("/demo/generate-qr", response_model=StandardResponse)
async def generate_demo_qr(
    booking_reference: str,
    centre_id: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    # 24 hour expiry for demo
    expiry = int(time.time()) + 86400
    payload = create_signed_qr_payload(booking_reference, centre_id, expiry)
    return {
        "success": True,
        "data": {"qr_payload": payload},
        "message": "Demo signed QR payload generated"
    }


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

from fastapi.responses import StreamingResponse
from app.utils.pdf_generator import generate_epass_pdf
from app.models.entities import Centre, FarmerCrop
from app.models.queue import QueueToken
from app.models.booking import Slot
import io

@router.get("/epass/{booking_reference}")
async def download_epass_pdf(
    booking_reference: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER, UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> StreamingResponse:
    # Get booking with relations
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(crud_booking.Booking)
        .where(crud_booking.Booking.booking_reference == booking_reference)
        .options(selectinload(crud_booking.Booking.crop))
    )
    booking = result.scalars().first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    # Verify ownership
    if current_user.role == UserRole.FARMER:
        farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
        if not farmer or booking.farmer_id != farmer.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this booking")

    # Fetch extra data for PDF
    farmer_res = await db.execute(select(crud_farmer.Farmer).where(crud_farmer.Farmer.id == booking.farmer_id))
    farmer_profile = farmer_res.scalars().first()
    
    centre_res = await db.execute(select(Centre).where(Centre.id == booking.centre_id))
    centre = centre_res.scalars().first()
    
    slot_res = await db.execute(select(Slot).where(Slot.id == booking.slot_id))
    slot = slot_res.scalars().first()
    
    token_res = await db.execute(select(QueueToken).where(QueueToken.booking_id == booking.id))
    queue_token = token_res.scalars().first()
    
    fc_result = await db.execute(
        select(FarmerCrop)
        .where(FarmerCrop.farmer_id == booking.farmer_id)
        .where(FarmerCrop.crop_id == booking.crop_id)
        .options(selectinload(FarmerCrop.crop_type))
    )
    farmer_crop = fc_result.scalars().first()
    
    grade_type = farmer_crop.crop_type.name if (farmer_crop and farmer_crop.crop_type) else "Standard"
    
    slot_time_str = f"{slot.start_time.strftime('%I:%M %p')} - {slot.end_time.strftime('%I:%M %p')}" if slot else "N/A"
    
    pdf_bytes = generate_epass_pdf(
        booking_reference=booking.booking_reference,
        token_number=str(queue_token.token_number) if queue_token else "Pending Gate Entry",
        farmer_name=farmer_profile.name if farmer_profile else "N/A",
        crop_name=booking.crop.name if booking.crop else "N/A",
        grade_type=grade_type,
        quantity=f"{booking.quantity} Quintals",
        centre_name=centre.name if centre else "N/A",
        date=str(slot.slot_date) if slot else "N/A",
        slot=slot_time_str,
        vehicle_number="N/A",  # Vehicle is assigned at gate entry or registered later
        status=booking.status.value if hasattr(booking.status, 'value') else str(booking.status),
        validity="Valid only for the designated slot date/time",
        qr_payload=create_signed_qr_payload(
            booking.booking_reference, 
            str(booking.centre_id), 
            int(slot.start_time.hour * 3600 + time.time() + 86400) # Simple expiry for demo
        )
    )
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=KisanFlow_ePass_{booking.booking_reference}.pdf"
        }
    )
