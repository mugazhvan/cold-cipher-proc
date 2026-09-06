import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, String

from app.core.database import get_db
from app.models.users import User, UserRole
from app.models.booking import Booking, Slot, BookingStatus
from app.models.queue import QueueToken, QueueStatus
from app.models.operations import Procurement, Payment, ProcurementStatus, PaymentStatus
from app.models.entities import Officer
from datetime import time
from sqlalchemy.orm import selectinload
from app.schemas.auth import StandardResponse
from app.schemas.slot import SlotCreate, SlotResponse, SlotUpdate, BatchSlotCreate
from app.schemas.procurement import ProcurementBase, ProcurementResponse, ProcurementUpdate
from app.schemas.payment import PaymentResponse, PaymentBase
from app.api.deps import RoleChecker

router = APIRouter()

async def verify_centre_access(db: AsyncSession, current_user: User, target_centre_id: uuid.UUID):
    if current_user.role == UserRole.ADMIN:
        return
    result = await db.execute(select(Officer).where(Officer.user_id == current_user.id))
    officer = result.scalars().first()
    if not officer or officer.centre_id != target_centre_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this centre")

# ----------------- SLOTS -----------------

@router.post("/centres/{centre_id}/slots", response_model=StandardResponse, status_code=201)
async def create_slot(
    centre_id: uuid.UUID,
    slot_in: SlotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_MANAGER, UserRole.CENTRE_OPERATOR, UserRole.ADMIN]))
) -> Any:
    await verify_centre_access(db, current_user, centre_id)
    slot = Slot(
        centre_id=centre_id,
        crop_id=slot_in.crop_id,
        slot_date=slot_in.get_date(),
        start_time=slot_in.start_time,
        end_time=slot_in.end_time,
        capacity=slot_in.get_capacity(),
        booked_count=0,
        status=slot_in.status
    )
    db.add(slot)
    await db.commit()
    
    # Reload with crop relation
    res = await db.execute(select(Slot).where(Slot.id == slot.id).options(selectinload(Slot.crop)))
    loaded_slot = res.scalars().first()
    
    return {
        "success": True,
        "data": SlotResponse.from_slot(loaded_slot).model_dump(),
        "message": "Slot created."
    }

@router.post("/centres/{centre_id}/slots/batch", response_model=StandardResponse, status_code=201)
async def create_batch_slots(
    centre_id: uuid.UUID,
    batch_in: BatchSlotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_MANAGER, UserRole.CENTRE_OPERATOR, UserRole.ADMIN]))
) -> Any:
    await verify_centre_access(db, current_user, centre_id)
    # 5 standard 2-hour windows
    standard_windows = [
        (time(8, 0), time(10, 0)),
        (time(10, 0), time(12, 0)),
        (time(12, 0), time(14, 0)),
        (time(14, 0), time(16, 0)),
        (time(16, 0), time(18, 0)),
    ]
    
    created_slots = []
    for start_t, end_t in standard_windows:
        # Check if identical slot already exists
        existing = await db.execute(
            select(Slot)
            .where(Slot.centre_id == centre_id)
            .where(Slot.crop_id == batch_in.crop_id)
            .where(Slot.slot_date == batch_in.slot_date)
            .where(Slot.start_time == start_t)
        )
        if not existing.scalars().first():
            s = Slot(
                centre_id=centre_id,
                crop_id=batch_in.crop_id,
                slot_date=batch_in.slot_date,
                start_time=start_t,
                end_time=end_t,
                capacity=batch_in.capacity,
                booked_count=0,
                status="OPEN"
            )
            db.add(s)
            created_slots.append(s)
            
    await db.commit()
    
    # Reload all slots for this centre, crop and date
    result = await db.execute(
        select(Slot)
        .where(Slot.centre_id == centre_id)
        .where(Slot.crop_id == batch_in.crop_id)
        .where(Slot.slot_date == batch_in.slot_date)
        .options(selectinload(Slot.crop))
        .order_by(Slot.start_time)
    )
    all_slots = result.scalars().all()
    
    return {
        "success": True,
        "data": [SlotResponse.from_slot(s).model_dump() for s in all_slots],
        "message": f"Daily schedule generated with {len(created_slots)} new slots."
    }

@router.get("/centres/{centre_id}/slots", response_model=StandardResponse)
async def get_slots(
    centre_id: uuid.UUID,
    date: Optional[str] = Query(None),
    crop_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_MANAGER, UserRole.CENTRE_OPERATOR, UserRole.ADMIN]))
) -> Any:
    await verify_centre_access(db, current_user, centre_id)
    stmt = select(Slot).where(Slot.centre_id == centre_id).options(selectinload(Slot.crop))
    if date:
        stmt = stmt.where(func.cast(Slot.slot_date, String) == str(date))
    if crop_id:
        stmt = stmt.where(Slot.crop_id == crop_id)
        
    stmt = stmt.order_by(Slot.slot_date.desc(), Slot.start_time)
    result = await db.execute(stmt)
    slots = result.scalars().all()
    
    return {
        "success": True,
        "data": [SlotResponse.from_slot(s).model_dump() for s in slots],
        "message": "Slots returned."
    }

@router.patch("/slots/{slot_id}/toggle", response_model=StandardResponse)
async def toggle_slot_status(
    slot_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_MANAGER, UserRole.CENTRE_OPERATOR, UserRole.ADMIN]))
) -> Any:
    result = await db.execute(select(Slot).where(Slot.id == slot_id).options(selectinload(Slot.crop)))
    slot = result.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
        
    await verify_centre_access(db, current_user, slot.centre_id)
        
    slot.status = "CLOSED" if slot.status == "OPEN" else "OPEN"
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    
    return {
        "success": True,
        "data": SlotResponse.from_slot(slot).model_dump(),
        "message": f"Slot is now {slot.status}."
    }

# ----------------- QUEUE MANAGEMENT -----------------

@router.post("/queue/{token_id}/call", response_model=StandardResponse)
async def call_token(
    token_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER]))
) -> Any:
    result = await db.execute(select(QueueToken).where(QueueToken.id == token_id))
    token = result.scalars().first()
    
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
        
    await verify_centre_access(db, current_user, token.centre_id)
        
    token.status = QueueStatus.CALLED
    db.add(token)
    await db.commit()
    
    return {
        "success": True,
        "data": {"token_number": token.token_number, "status": token.status.value},
        "message": "Token called."
    }

@router.post("/queue/{token_id}/complete", response_model=StandardResponse)
async def complete_token(
    token_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER]))
) -> Any:
    result = await db.execute(select(QueueToken).where(QueueToken.id == token_id))
    token = result.scalars().first()
    
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
        
    await verify_centre_access(db, current_user, token.centre_id)
        
    token.status = QueueStatus.COMPLETED
    db.add(token)
    await db.commit()
    
    return {
        "success": True,
        "data": {"token_number": token.token_number, "status": token.status.value},
        "message": "Token completed."
    }

# ----------------- PROCUREMENT & PAYMENT -----------------

@router.post("/bookings/{booking_id}/procurement", response_model=StandardResponse, status_code=201)
async def create_procurement(
    booking_id: uuid.UUID,
    proc_in: ProcurementBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER]))
) -> Any:
    # We need to get the booking to know the centre_id
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    await verify_centre_access(db, current_user, booking.centre_id)

    proc = Procurement(
        booking_id=booking_id,
        centre_id=booking.centre_id,
        gross_weight=proc_in.gross_weight,
        tare_weight=proc_in.tare_weight,
        net_weight=proc_in.net_weight,
        quality_status=proc_in.quality_status,
        quality_remarks=proc_in.quality_remarks,
        status=ProcurementStatus[proc_in.status.upper()]
    )
        
    db.add(proc)
    
    # Update booking status
    booking.status = BookingStatus.PROCESSING
    db.add(booking)
        
    await db.commit()
    await db.refresh(proc)
    
    return {
        "success": True,
        "data": ProcurementResponse.model_validate(proc).model_dump(),
        "message": "Procurement created."
    }

@router.post("/procurement/{procurement_id}/payment", response_model=StandardResponse, status_code=201)
async def initiate_payment(
    procurement_id: uuid.UUID,
    payment_in: PaymentBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    proc_result = await db.execute(select(Procurement).where(Procurement.id == procurement_id))
    proc = proc_result.scalars().first()
    if not proc:
        raise HTTPException(status_code=404, detail="Procurement not found")
        
    await verify_centre_access(db, current_user, proc.centre_id)
        
    payment = Payment(
        procurement_id=procurement_id,
        amount=payment_in.amount,
        status=PaymentStatus[payment_in.status.upper()],
        payment_reference=payment_in.payment_reference,
        failure_reason=payment_in.failure_reason
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    
    return {
        "success": True,
        "data": PaymentResponse.model_validate(payment).model_dump(),
        "message": "Payment initiated."
    }

# ----------------- DASHBOARD -----------------

@router.get("/dashboard/summary", response_model=StandardResponse)
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    centre_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_MANAGER, UserRole.CENTRE_OPERATOR, UserRole.ADMIN]))
) -> Any:
    # Baseline dashboard stats
    stats = {
        "today_bookings": 0,
        "completed_procurements": 0,
        "waiting_farmers": 0,
        "total_procured_kg": 0
    }
    
    query_b = select(func.count()).select_from(Booking)
    query_w = select(func.count()).select_from(QueueToken).where(QueueToken.status == QueueStatus.WAITING)
    
    if centre_id:
        await verify_centre_access(db, current_user, centre_id)
        query_b = query_b.where(Booking.centre_id == centre_id)
        query_w = query_w.where(QueueToken.centre_id == centre_id)
    else:
        # If no centre_id provided, default to user's assigned centre if they are not admin
        if current_user.role != UserRole.ADMIN:
            officer_result = await db.execute(select(Officer).where(Officer.user_id == current_user.id))
            officer = officer_result.scalars().first()
            if officer and officer.centre_id:
                query_b = query_b.where(Booking.centre_id == officer.centre_id)
                query_w = query_w.where(QueueToken.centre_id == officer.centre_id)
        
    stats["today_bookings"] = (await db.execute(query_b)).scalar_one()
    stats["waiting_farmers"] = (await db.execute(query_w)).scalar_one()
    
    return {
        "success": True,
        "data": stats,
        "message": "Dashboard stats returned."
    }
