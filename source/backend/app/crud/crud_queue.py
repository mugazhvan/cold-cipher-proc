import uuid
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.booking import Booking, BookingStatus
from app.models.queue import QueueToken, QueueStatus

async def generate_token(db: AsyncSession, booking_id: uuid.UUID, farmer_id: uuid.UUID) -> QueueToken:
    # 1. Verify booking
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.farmer_id != farmer_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this booking")
        
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=409, detail="Booking is not confirmed")
        
    # 2. Check if token already exists
    token_result = await db.execute(select(QueueToken).where(QueueToken.booking_id == booking_id))
    existing_token = token_result.scalars().first()
    if existing_token:
        return existing_token
        
    # 3. Generate token number (simple auto-increment logic per centre/day)
    # For MVP, simply getting max token + 1
    max_token_result = await db.execute(
        select(func.max(QueueToken.token_number)).where(QueueToken.centre_id == booking.centre_id)
    )
    max_token = max_token_result.scalar() or 0
    next_token = max_token + 1
    
    from datetime import datetime
    token = QueueToken(
        booking_id=booking.id,
        centre_id=booking.centre_id,
        token_number=next_token,
        status=QueueStatus.WAITING,
        queue_date=datetime.utcnow().date()
    )
    
    db.add(token)
    await db.commit()
    await db.refresh(token)
    
    return token

async def get_token_by_booking(db: AsyncSession, booking_id: uuid.UUID, farmer_id: uuid.UUID) -> Optional[QueueToken]:
    # Ensure the booking belongs to the farmer
    booking_result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = booking_result.scalars().first()
    if not booking or booking.farmer_id != farmer_id:
        return None
        
    result = await db.execute(select(QueueToken).where(QueueToken.booking_id == booking_id))
    return result.scalars().first()

async def check_in(db: AsyncSession, token_id: uuid.UUID, farmer_id: uuid.UUID) -> QueueToken:
    result = await db.execute(select(QueueToken).where(QueueToken.id == token_id))
    token = result.scalars().first()
    
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
        
    booking_result = await db.execute(select(Booking).where(Booking.id == token.booking_id))
    booking = booking_result.scalars().first()
    
    if not booking or booking.farmer_id != farmer_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this token")
        
    if token.status != QueueStatus.WAITING:
        raise HTTPException(status_code=409, detail="Token not in WAITING state")
        
    # Mark booking as arrived
    booking.status = BookingStatus.ARRIVED
    db.add(booking)
        
    # In some logic, check-in implies they are physically there but still waiting, 
    # or they are CALLED. Let's keep token in WAITING until called by management.
    await db.commit()
    await db.refresh(token)
    
    return token
