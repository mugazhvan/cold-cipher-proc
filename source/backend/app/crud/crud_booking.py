import uuid
from typing import List, Optional, Tuple
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.models.booking import Booking, Slot, BookingStatus, SlotStatus
from app.models.entities import Farmer
from app.schemas.booking import BookingCreate

async def create_booking(db: AsyncSession, farmer_id: uuid.UUID, booking_in: BookingCreate) -> Booking:
    # 1. Start database transaction handled by db connection (AsyncSession default)
    # 2. Lock the requested slot row
    result = await db.execute(
        select(Slot).where(Slot.id == booking_in.slot_id).with_for_update()
    )
    slot = result.scalars().first()
    
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
        
    if slot.status != "OPEN":
        raise HTTPException(status_code=409, detail="SLOT_CLOSED")
        
    if slot.centre_id != booking_in.centre_id:
        raise HTTPException(status_code=400, detail="Centre mismatch")
        
    if slot.crop_id != booking_in.crop_id:
        raise HTTPException(status_code=400, detail="Crop mismatch")
        
    # 3. Check capacity
    remaining_capacity = slot.capacity - slot.booked_count
    if booking_in.quantity > remaining_capacity:
        raise HTTPException(status_code=409, detail="SLOT_FULL")
        
    from sqlalchemy.exc import IntegrityError

    # 4. Create booking
    booking_ref = f"BK-{uuid.uuid4().hex[:8].upper()}"
    booking = Booking(
        farmer_id=farmer_id,
        centre_id=booking_in.centre_id,
        slot_id=booking_in.slot_id,
        crop_id=booking_in.crop_id,
        quantity=booking_in.quantity,
        status=BookingStatus.CONFIRMED,
        booking_reference=booking_ref
    )
    db.add(booking)
    
    # 5. Increase booked quantity
    slot.booked_count += int(booking_in.quantity)
    if slot.booked_count >= slot.capacity:
        slot.status = SlotStatus.FULL
    db.add(slot)
    
    # 6. Commit
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig)
        if "check_booked_count_capacity" in error_msg:
            raise HTTPException(status_code=409, detail="SLOT_FULL")
        elif "idx_unique_active_booking_per_slot" in error_msg:
            raise HTTPException(status_code=409, detail="DUPLICATE_BOOKING")
        raise HTTPException(status_code=400, detail="Booking validation failed")
    
    from sqlalchemy.orm import selectinload
    stmt = select(Booking).where(Booking.id == booking.id).options(selectinload(Booking.crop))
    result = await db.execute(stmt)
    return result.scalars().first()

async def get_booking(db: AsyncSession, booking_id: uuid.UUID) -> Optional[Booking]:
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    return result.scalars().first()

from sqlalchemy.orm import selectinload

async def get_bookings_for_farmer(
    db: AsyncSession, farmer_id: uuid.UUID, skip: int = 0, limit: int = 20
) -> Tuple[List[Booking], int]:
    query = select(Booking).where(Booking.farmer_id == farmer_id)
    
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()
    
    query = query.options(selectinload(Booking.crop)).order_by(Booking.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    
    return result.scalars().all(), total

async def get_bookings_for_centre(
    db: AsyncSession, centre_id: uuid.UUID, skip: int = 0, limit: int = 20
) -> Tuple[List[Booking], int]:
    query = select(Booking).where(Booking.centre_id == centre_id)
    
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()
    
    query = query.options(
        selectinload(Booking.crop),
        selectinload(Booking.farmer).selectinload(Farmer.user),
        selectinload(Booking.slot),
        selectinload(Booking.centre),
    ).order_by(Booking.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    
    return result.scalars().all(), total

async def cancel_booking(db: AsyncSession, booking: Booking) -> Booking:
    if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
        raise HTTPException(status_code=409, detail="BOOKING_NOT_CANCELLABLE")
        
    # Must lock the slot to reduce capacity safely
    result = await db.execute(select(Slot).where(Slot.id == booking.slot_id).with_for_update())
    slot = result.scalars().first()
    
    if slot:
        slot.booked_count = max(0, slot.booked_count - int(booking.quantity))
        if slot.status == SlotStatus.FULL and slot.booked_count < slot.capacity:
            slot.status = SlotStatus.OPEN
        db.add(slot)
        
    booking.status = BookingStatus.CANCELLED
    db.add(booking)
    
    await db.commit()
    
    from sqlalchemy.orm import selectinload
    stmt = select(Booking).where(Booking.id == booking.id).options(selectinload(Booking.crop))
    result = await db.execute(stmt)
    return result.scalars().first()
