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
from app.models.entities import Officer, Farmer, Centre
from datetime import time, datetime
from sqlalchemy.orm import selectinload
from app.schemas.auth import StandardResponse
from app.schemas.slot import SlotCreate, SlotResponse, SlotUpdate, BatchSlotCreate
from app.schemas.booking import BookingResponse, QRVerifyRequest, ReassignBookingRequest
from app.schemas.procurement import ProcurementBase, ProcurementResponse, ProcurementUpdate, QualityTestRequest, CompleteWeighmentRequest
from app.schemas.payment import PaymentResponse, PaymentBase
from app.api.deps import RoleChecker, verify_centre_access
from app.core.security import verify_signed_qr_payload

router = APIRouter()

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

    from datetime import datetime, timedelta
    start_h = batch_in.start_time.hour if batch_in.start_time else 8
    start_m = batch_in.start_time.minute if batch_in.start_time else 0
    end_h = batch_in.end_time.hour if batch_in.end_time else 16
    end_m = batch_in.end_time.minute if batch_in.end_time else 0
    duration_mins = batch_in.slot_duration_minutes if (batch_in.slot_duration_minutes and batch_in.slot_duration_minutes > 0) else 60

    b_start_h = batch_in.break_start_time.hour if batch_in.break_start_time else 12
    b_end_h = batch_in.break_end_time.hour if batch_in.break_end_time else 13

    windows = []
    curr = datetime(2000, 1, 1, start_h, start_m)
    limit = datetime(2000, 1, 1, end_h, end_m)
    while curr < limit:
        nxt = curr + timedelta(minutes=duration_mins)
        if nxt > limit:
            break
        # Skip interval if it overlaps with break interval
        is_break = False
        if batch_in.break_start_time is not None or batch_in.break_end_time is not None or (b_start_h < b_end_h):
            if curr.hour >= b_start_h and curr.hour < b_end_h:
                is_break = True
        if not is_break:
            windows.append((curr.time(), nxt.time()))
        curr = nxt

    if not windows:
        # Fallback to standard 2-hour windows if configured range was invalid
        windows = [
            (time(8, 0), time(9, 0)),
            (time(9, 0), time(10, 0)),
            (time(10, 0), time(11, 0)),
            (time(11, 0), time(12, 0)),
            (time(13, 0), time(14, 0)),
            (time(14, 0), time(15, 0)),
            (time(15, 0), time(16, 0)),
        ]

    created_slots = []
    for start_t, end_t in windows:
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

    # Reload newly created slots with crop relation
    created_ids = [s.id for s in created_slots]
    if created_ids:
        result = await db.execute(
            select(Slot)
            .where(Slot.id.in_(created_ids))
            .options(selectinload(Slot.crop))
            .order_by(Slot.start_time)
        )
        loaded_created = result.scalars().all()
    else:
        loaded_created = []

    msg = (
        f"Daily routine generated: {len(loaded_created)} new slots created in database."
        if loaded_created
        else "Today's slots already exist in database. No duplicate slots created."
    )

    return {
        "success": True,
        "data": [SlotResponse.from_slot(s).model_dump() for s in loaded_created],
        "message": msg
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

@router.patch("/slots/{slot_id}", response_model=StandardResponse)
async def update_slot(
    slot_id: uuid.UUID,
    slot_in: SlotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_MANAGER, UserRole.CENTRE_OPERATOR, UserRole.ADMIN]))
) -> Any:
    result = await db.execute(select(Slot).where(Slot.id == slot_id).with_for_update())
    slot = result.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
        
    await verify_centre_access(db, current_user, slot.centre_id)
    
    if slot_in.capacity is not None:
        if slot_in.capacity < slot.booked_count:
            raise HTTPException(status_code=400, detail="Capacity cannot be less than already booked count")
        slot.capacity = slot_in.capacity
        if slot.capacity > slot.booked_count and slot.status == "FULL":
            slot.status = "OPEN"
        elif slot.capacity == slot.booked_count:
            slot.status = "FULL"
            
    if slot_in.status is not None:
        slot.status = slot_in.status

    db.add(slot)
    await db.commit()
    
    res = await db.execute(select(Slot).where(Slot.id == slot.id).options(selectinload(Slot.crop)))
    loaded_slot = res.scalars().first()
    
    return {
        "success": True,
        "data": SlotResponse.from_slot(loaded_slot).model_dump(),
        "message": "Slot updated successfully."
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

# ----------------- QUEUE & ARRIVAL MANAGEMENT -----------------

async def verify_farmer_arrival(
    db: AsyncSession,
    booking: Booking,
    current_user: User,
    notes: str = "Gate entry verified"
) -> QueueToken:
    # 1. Verify Operator Authorization for this centre
    await verify_centre_access(db, current_user, booking.centre_id)

    # 2. Check status
    if booking.status == BookingStatus.ARRIVED:
        raise HTTPException(status_code=409, detail="This farmer has already been checked in.")
    if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW]:
        stat_name = booking.status if isinstance(booking.status, str) else getattr(booking.status, 'value', str(booking.status))
        raise HTTPException(status_code=409, detail=f"This booking cannot be checked in right now (status: {stat_name}).")

    # 3. Obtain slot date
    slot_res = await db.execute(select(Slot).where(Slot.id == booking.slot_id))
    slot = slot_res.scalars().first()
    queue_d = slot.slot_date if slot else booking.created_at.date()

    # 4. Fetch or create QueueToken with lock
    token_result = await db.execute(select(QueueToken).where(QueueToken.booking_id == booking.id).with_for_update())
    queue_token = token_result.scalars().first()

    if not queue_token:
        max_token_res = await db.execute(
            select(func.max(QueueToken.token_number))
            .where(QueueToken.centre_id == booking.centre_id)
            .where(QueueToken.queue_date == queue_d)
        )
        max_num = max_token_res.scalar() or 0
        queue_token = QueueToken(
            booking_id=booking.id,
            centre_id=booking.centre_id,
            token_number=max_num + 1,
            queue_date=queue_d,
            status=QueueStatus.WAITING,
            check_in_at=datetime.utcnow()
        )
        db.add(queue_token)
        await db.flush()
    else:
        queue_token.check_in_at = queue_token.check_in_at or datetime.utcnow()
        queue_token.status = QueueStatus.WAITING
        db.add(queue_token)

    # 5. Update states
    from app.models.queue import QueueEvent
    old_status = queue_token.status if isinstance(queue_token.status, str) else queue_token.status.value

    booking.status = BookingStatus.ARRIVED
    booking.check_in_at = booking.check_in_at or datetime.utcnow()

    db.add(booking)
    db.add(queue_token)
    db.add(
        QueueEvent(
            token_id=queue_token.id,
            event_type="GATE_VERIFIED",
            old_status=old_status,
            new_status=QueueStatus.WAITING.value,
            event_time=datetime.utcnow(),
            performed_by=current_user.id,
            notes=notes,
        )
    )
    await db.commit()
    await db.refresh(queue_token)
    await db.refresh(booking)
    return queue_token


@router.post("/queue/{token_id}/call", response_model=StandardResponse)
async def call_token(
    token_id: uuid.UUID,
    bay_name: Optional[str] = Query("Weighbridge Bay 2 (North)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    # 1. Search by token id
    result = await db.execute(select(QueueToken).where(QueueToken.id == token_id).with_for_update())
    token = result.scalars().first()

    # 2. If not found by token ID, search by booking id
    if not token:
        result = await db.execute(select(QueueToken).where(QueueToken.booking_id == token_id).with_for_update())
        token = result.scalars().first()

    # 3. If token does not exist yet but booking exists, create queue token
    if not token:
        b_res = await db.execute(select(Booking).where(Booking.id == token_id).with_for_update())
        booking = b_res.scalars().first()
        if not booking:
            raise HTTPException(status_code=404, detail="Token or booking not found")
        await verify_centre_access(db, current_user, booking.centre_id)

        slot_res = await db.execute(select(Slot).where(Slot.id == booking.slot_id))
        slot = slot_res.scalars().first()
        queue_d = slot.slot_date if slot else booking.created_at.date()

        max_res = await db.execute(
            select(func.max(QueueToken.token_number))
            .where(QueueToken.centre_id == booking.centre_id)
            .where(QueueToken.queue_date == queue_d)
        )
        max_num = max_res.scalar() or 0
        token = QueueToken(
            booking_id=booking.id,
            centre_id=booking.centre_id,
            token_number=max_num + 1,
            queue_date=queue_d,
            status=QueueStatus.WAITING,
            check_in_at=datetime.utcnow()
        )
        booking.status = BookingStatus.ARRIVED
        db.add(booking)
        db.add(token)
        await db.flush()

    await verify_centre_access(db, current_user, token.centre_id)

    curr_status = token.status if isinstance(token.status, str) else token.status.value
    if curr_status != "WAITING":
        raise HTTPException(
            status_code=409,
            detail=f"Token #{token.token_number} is already in status {curr_status} and cannot be called."
        )

    token.status = QueueStatus.CALLED
    token.called_at = datetime.utcnow()
    db.add(token)

    from app.models.queue import QueueEvent
    db.add(
        QueueEvent(
            token_id=token.id,
            event_type="TOKEN_CALLED",
            new_status=QueueStatus.CALLED.value,
            event_time=datetime.utcnow(),
            performed_by=current_user.id,
            notes=f"Dispatched to {bay_name}",
        )
    )
    await db.commit()
    await db.refresh(token)

    return {
        "success": True,
        "data": {
            "token_number": token.token_number,
            "status": token.status if isinstance(token.status, str) else getattr(token.status, 'value', str(token.status)),
            "assigned_bay": bay_name
        },
        "message": f"Token #{token.token_number} called to {bay_name}."
    }


@router.post("/qr/verify", response_model=StandardResponse)
async def verify_epass_qr(
    request: QRVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    raw_payload = (request.payload or request.qr_data or "").strip()
    if not raw_payload:
        raise HTTPException(status_code=401, detail="Empty QR payload")

    qr_data = {}
    if raw_payload.startswith("kf-pass:v1:"):
        try:
            qr_data = verify_signed_qr_payload(raw_payload)
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))
    elif raw_payload.upper().startswith("KISANFLOW://TOKEN/"):
        parts = raw_payload.split("/")
        token_part = parts[3].strip() if len(parts) >= 4 else raw_payload
        qr_data = {"booking_ref": token_part}
    elif "KF-" in raw_payload.upper() or raw_payload.startswith("token-") or raw_payload.isdigit():
        booking_ref_norm = raw_payload
        if raw_payload.isdigit() and len(raw_payload) <= 4:
            booking_ref_norm = f"KF-2026-{raw_payload}"
        qr_data = {"booking_ref": booking_ref_norm}
    else:
        try:
            qr_data = verify_signed_qr_payload(raw_payload)
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))

    booking_ref = qr_data.get("booking_ref")
    if not booking_ref:
        raise HTTPException(status_code=401, detail="Invalid QR payload data")

    parsed_booking_id = None
    try:
        parsed_booking_id = uuid.UUID(booking_ref)
    except ValueError:
        pass

    if parsed_booking_id:
        result = await db.execute(select(Booking).where(Booking.id == parsed_booking_id).with_for_update())
    else:
        result = await db.execute(select(Booking).where(Booking.booking_reference == booking_ref).with_for_update())

    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="No booking was found.")

    queue_token = await verify_farmer_arrival(
        db=db,
        booking=booking,
        current_user=current_user,
        notes="Gate entry verified via QR scan"
    )

    return {
        "success": True,
        "data": {
            "token_number": queue_token.token_number,
            "status": queue_token.status if isinstance(queue_token.status, str) else queue_token.status.value,
            "booking_id": str(booking.id),
            "booking_reference": booking.booking_reference
        },
        "message": f"e-Gate Pass {booking.booking_reference} verified. Token #{queue_token.token_number} issued."
    }


@router.get("/bookings/lookup", response_model=StandardResponse)
async def lookup_booking(
    reference: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    ref_norm = reference.strip()
    parsed_uuid = None
    try:
        parsed_uuid = uuid.UUID(ref_norm)
    except ValueError:
        pass

    stmt = select(Booking).options(
        selectinload(Booking.crop),
        selectinload(Booking.farmer).selectinload(Farmer.user),
        selectinload(Booking.slot),
        selectinload(Booking.centre),
    )
    if parsed_uuid:
        stmt = stmt.where(Booking.id == parsed_uuid)
    else:
        stmt = stmt.where(Booking.booking_reference == ref_norm)

    res = await db.execute(stmt)
    booking = res.scalars().first()

    if not booking:
        # Check digit-only fallback
        if ref_norm.isdigit() and len(ref_norm) <= 4:
            alt_ref = f"KF-2026-{ref_norm}"
            stmt_alt = select(Booking).options(
                selectinload(Booking.crop),
                selectinload(Booking.farmer).selectinload(Farmer.user),
                selectinload(Booking.slot),
                selectinload(Booking.centre),
            ).where(Booking.booking_reference == alt_ref)
            res_alt = await db.execute(stmt_alt)
            booking = res_alt.scalars().first()

    if not booking:
        raise HTTPException(status_code=404, detail="No booking was found.")

    await verify_centre_access(db, current_user, booking.centre_id)

    f_name = booking.farmer.name if getattr(booking, 'farmer', None) else "Farmer"
    f_village = booking.farmer.village if getattr(booking, 'farmer', None) else "Local Village"
    f_phone = booking.farmer.user.phone if getattr(booking, 'farmer', None) and getattr(booking.farmer, 'user', None) else None
    c_name = booking.centre.name if getattr(booking, 'centre', None) else "Procurement Centre"
    cr_name = booking.crop.name if getattr(booking, 'crop', None) else "Wheat"
    s_date = str(booking.slot.slot_date) if getattr(booking, 'slot', None) else str(booking.created_at.date())
    s_time = (
        f"{booking.slot.start_time.strftime('%I:%M %p')} - {booking.slot.end_time.strftime('%I:%M %p')}"
        if getattr(booking, 'slot', None)
        else "09:00 AM - 10:00 AM"
    )
    b_stat = booking.status if isinstance(booking.status, str) else getattr(booking.status, 'value', str(booking.status))

    return {
        "success": True,
        "data": {
            "id": str(booking.id),
            "booking_reference": booking.booking_reference,
            "farmer_name": f_name,
            "village": f_village,
            "farmer_phone": f_phone,
            "centre_id": str(booking.centre_id),
            "centre_name": c_name,
            "crop_name": cr_name,
            "slot_date": s_date,
            "slot_time": s_time,
            "quantity": float(booking.quantity),
            "status": b_stat,
        },
        "message": "Booking found."
    }


@router.post("/bookings/{booking_id}/verify-arrival", response_model=StandardResponse)
async def manual_verify_arrival(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    stmt = select(Booking).where(Booking.id == booking_id).with_for_update()
    res = await db.execute(stmt)
    booking = res.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="No booking was found.")

    queue_token = await verify_farmer_arrival(
        db=db,
        booking=booking,
        current_user=current_user,
        notes="Manual fallback verification performed"
    )

    return {
        "success": True,
        "data": {
            "token_number": queue_token.token_number,
            "status": queue_token.status if isinstance(queue_token.status, str) else queue_token.status.value,
            "booking_id": str(booking.id),
            "booking_reference": booking.booking_reference
        },
        "message": f"Farmer verified successfully. Token #{queue_token.token_number} issued."
    }


@router.get("/slots/{slot_id}/bookings", response_model=StandardResponse)
async def get_slot_bookings(
    slot_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    slot_res = await db.execute(select(Slot).where(Slot.id == slot_id))
    slot = slot_res.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    await verify_centre_access(db, current_user, slot.centre_id)

    stmt = select(Booking).where(Booking.slot_id == slot_id).options(
        selectinload(Booking.crop),
        selectinload(Booking.farmer).selectinload(Farmer.user),
        selectinload(Booking.slot),
        selectinload(Booking.centre),
    ).order_by(Booking.created_at.asc())
    b_res = await db.execute(stmt)
    bookings = b_res.scalars().all()

    return {
        "success": True,
        "data": [BookingResponse.from_booking(b).model_dump() for b in bookings],
        "message": f"{len(bookings)} bookings returned for slot."
    }


@router.post("/bookings/{booking_id}/reassign", response_model=StandardResponse)
async def reassign_booking(
    booking_id: uuid.UUID,
    reassign_in: ReassignBookingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    b_res = await db.execute(select(Booking).where(Booking.id == booking_id).with_for_update())
    booking = b_res.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    await verify_centre_access(db, current_user, booking.centre_id)

    if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
        stat_name = booking.status if isinstance(booking.status, str) else getattr(booking.status, 'value', str(booking.status))
        raise HTTPException(
            status_code=409,
            detail=f"This booking cannot be reassigned right now (status: {stat_name})."
        )

    if booking.slot_id == reassign_in.target_slot_id:
        raise HTTPException(status_code=400, detail="Farmer is already assigned to this slot.")

    # Sort slot IDs to lock deterministically
    slot_ids = sorted([booking.slot_id, reassign_in.target_slot_id])
    s_res = await db.execute(select(Slot).where(Slot.id.in_(slot_ids)).with_for_update())
    slots = {s.id: s for s in s_res.scalars().all()}

    old_slot = slots.get(booking.slot_id)
    target_slot = slots.get(reassign_in.target_slot_id)

    if not target_slot:
        raise HTTPException(status_code=404, detail="Destination slot not found")

    if target_slot.centre_id != booking.centre_id:
        raise HTTPException(status_code=400, detail="Destination slot is at a different procurement centre")

    if target_slot.crop_id != booking.crop_id:
        raise HTTPException(status_code=400, detail="Destination slot is assigned to a different crop")

    if target_slot.status != "OPEN":
        raise HTTPException(status_code=409, detail="Destination slot is closed or full")

    if target_slot.booked_count >= target_slot.capacity:
        raise HTTPException(status_code=409, detail="Destination slot has reached maximum capacity")

    # Atomic swap
    if old_slot:
        old_slot.booked_count = max(0, old_slot.booked_count - int(booking.quantity))
        if old_slot.status == "FULL" and old_slot.booked_count < old_slot.capacity:
            old_slot.status = "OPEN"
        db.add(old_slot)

    target_slot.booked_count += int(booking.quantity)
    if target_slot.booked_count >= target_slot.capacity:
        target_slot.status = "FULL"
    db.add(target_slot)

    booking.slot_id = target_slot.id
    db.add(booking)

    await db.commit()
    await db.refresh(booking)

    return {
        "success": True,
        "data": {
            "booking_id": str(booking.id),
            "new_slot_id": str(target_slot.id),
            "new_slot_time": f"{target_slot.start_time.strftime('%I:%M %p')} - {target_slot.end_time.strftime('%I:%M %p')}",
            "booked_count": target_slot.booked_count,
            "capacity": target_slot.capacity
        },
        "message": "Farmer slot reassigned successfully."
    }

# ----------------- PROCUREMENT & PAYMENT -----------------

from app.schemas.procurement import WeighingCreate, QualityCreate

@router.post("/procurement/{booking_id}/start-weighing", response_model=StandardResponse, status_code=201)
async def start_weighing(
    booking_id: uuid.UUID,
    weighing_in: WeighingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER]))
) -> Any:
    if weighing_in.gross_weight <= 0 or weighing_in.tare_weight <= 0:
        raise HTTPException(status_code=400, detail="Weights must be positive")
    if weighing_in.gross_weight <= weighing_in.tare_weight:
        raise HTTPException(status_code=400, detail="Gross weight must be strictly greater than tare weight")

    # Fetch QueueToken and Booking with locking
    qt_res = await db.execute(select(QueueToken).where(QueueToken.booking_id == booking_id).with_for_update())
    token = qt_res.scalars().first()
    if not token:
        raise HTTPException(status_code=404, detail="Queue token not found")

    await verify_centre_access(db, current_user, token.centre_id)

    if token.status != QueueStatus.CALLED:
        raise HTTPException(status_code=409, detail=f"Cannot start weighing, token is {token.status if isinstance(token.status, str) else getattr(token.status, 'value', str(token.status))}")

    b_res = await db.execute(select(Booking).where(Booking.id == booking_id).with_for_update())
    booking = b_res.scalars().first()
    if booking.status not in [BookingStatus.ARRIVED, BookingStatus.PROCESSING]:
        raise HTTPException(status_code=409, detail=f"Invalid booking status: {booking.status if isinstance(booking.status, str) else getattr(booking.status, 'value', str(booking.status))}")

    # Check if procurement exists
    p_res = await db.execute(select(Procurement).where(Procurement.booking_id == booking_id))
    proc = p_res.scalars().first()
    if proc:
        raise HTTPException(status_code=409, detail="Procurement already started for this booking")

    net_w = weighing_in.gross_weight - weighing_in.tare_weight

    proc = Procurement(
        booking_id=booking_id,
        centre_id=booking.centre_id,
        gross_weight=weighing_in.gross_weight,
        tare_weight=weighing_in.tare_weight,
        net_weight=net_w,
        status=ProcurementStatus.WEIGHING
    )
    db.add(proc)

    token.status = QueueStatus.PROCESSING
    db.add(token)

    booking.status = BookingStatus.PROCESSING
    db.add(booking)

    await db.commit()
    await db.refresh(proc)

    return {
        "success": True,
        "data": ProcurementResponse.model_validate(proc).model_dump(),
        "message": "Weighing started."
    }

@router.post("/procurement/{procurement_id}/quality", response_model=StandardResponse)
async def submit_quality(
    procurement_id: uuid.UUID,
    quality_in: QualityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER]))
) -> Any:
    p_res = await db.execute(select(Procurement).where(Procurement.id == procurement_id).with_for_update())
    proc = p_res.scalars().first()
    if not proc:
        raise HTTPException(status_code=404, detail="Procurement not found")

    await verify_centre_access(db, current_user, proc.centre_id)

    if proc.status != ProcurementStatus.WEIGHING:
        raise HTTPException(status_code=409, detail=f"Procurement is in {proc.status if isinstance(proc.status, str) else getattr(proc.status, 'value', str(proc.status))}, expected WEIGHING")

    proc.quality_status = quality_in.quality_status
    proc.quality_remarks = quality_in.quality_remarks
    proc.status = ProcurementStatus.ACCEPTED
    
    db.add(proc)
    await db.commit()
    await db.refresh(proc)

    return {
        "success": True,
        "data": ProcurementResponse.model_validate(proc).model_dump(),
        "message": "Quality submitted and accepted."
    }

@router.post("/procurement/{procurement_id}/complete", response_model=StandardResponse)
async def complete_procurement(
    procurement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER]))
) -> Any:
    p_res = await db.execute(select(Procurement).where(Procurement.id == procurement_id).with_for_update())
    proc = p_res.scalars().first()
    if not proc:
        raise HTTPException(status_code=404, detail="Procurement not found")

    await verify_centre_access(db, current_user, proc.centre_id)

    if proc.status != ProcurementStatus.ACCEPTED:
        raise HTTPException(status_code=409, detail=f"Procurement is in {proc.status if isinstance(proc.status, str) else getattr(proc.status, 'value', str(proc.status))}, expected ACCEPTED")

    b_res = await db.execute(select(Booking).where(Booking.id == proc.booking_id).with_for_update())
    booking = b_res.scalars().first()

    qt_res = await db.execute(select(QueueToken).where(QueueToken.booking_id == proc.booking_id).with_for_update())
    token = qt_res.scalars().first()

    proc.status = ProcurementStatus.PROCUREMENT_COMPLETED
    proc.procurement_completed_at = datetime.utcnow()
    db.add(proc)

    if booking:
        booking.status = BookingStatus.COMPLETED
        db.add(booking)
    
    if token:
        token.status = QueueStatus.COMPLETED
        db.add(token)

    await db.commit()
    await db.refresh(proc)

    return {
        "success": True,
        "data": ProcurementResponse.model_validate(proc).model_dump(),
        "message": "Procurement completed."
    }


@router.post("/procurement/{booking_id}/quality-test", response_model=StandardResponse)
async def submit_quality_test_by_booking(
    booking_id: uuid.UUID,
    test_in: QualityTestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    # 1. Fetch booking with locking
    b_res = await db.execute(select(Booking).where(Booking.id == booking_id).with_for_update())
    booking = b_res.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    await verify_centre_access(db, current_user, booking.centre_id)

    # 2. Fetch or create procurement
    p_res = await db.execute(select(Procurement).where(Procurement.booking_id == booking_id).with_for_update())
    proc = p_res.scalars().first()
    if not proc:
        proc = Procurement(
            booking_id=booking_id,
            centre_id=booking.centre_id,
            status=ProcurementStatus.QUALITY_CHECK
        )
        db.add(proc)
        await db.flush()

    is_passed = bool(test_in.passed)
    proc.quality_status = "PASSED" if is_passed else "REJECTED"
    proc.quality_remarks = f"Moisture: {test_in.moisture_percentage}%, Foreign Matter: {test_in.foreign_matter_percentage}%, Broken: {test_in.broken_grain_percentage}%. Grade: {test_in.grade}. {test_in.notes or ''}".strip()
    proc.status = ProcurementStatus.ACCEPTED if is_passed else ProcurementStatus.REJECTED
    db.add(proc)

    # 3. Update booking status to PROCESSING
    if is_passed:
        booking.status = BookingStatus.PROCESSING
    db.add(booking)

    # 4. Update QueueToken if present
    qt_res = await db.execute(select(QueueToken).where(QueueToken.booking_id == booking_id).with_for_update())
    token = qt_res.scalars().first()
    if token and is_passed:
        token.status = QueueStatus.PROCESSING
        db.add(token)

    await db.commit()
    await db.refresh(proc)

    return {
        "success": True,
        "data": ProcurementResponse.model_validate(proc).model_dump(),
        "message": f"Quality inspection recorded: {proc.quality_status}."
    }


@router.post("/procurement/{booking_id}/complete-and-payout", response_model=StandardResponse)
async def complete_weighment_and_payout(
    booking_id: uuid.UUID,
    weigh_in: CompleteWeighmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    if weigh_in.gross_weight_kg <= 0 or weigh_in.tare_weight_kg <= 0:
        raise HTTPException(status_code=400, detail="Gross and tare weights must be positive")
    if weigh_in.gross_weight_kg <= weigh_in.tare_weight_kg:
        raise HTTPException(status_code=400, detail="Gross weight must be strictly greater than tare weight")

    # 1. Fetch booking with crop loaded
    b_res = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(selectinload(Booking.crop))
        .with_for_update()
    )
    booking = b_res.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    await verify_centre_access(db, current_user, booking.centre_id)

    # 2. Fetch or create procurement
    p_res = await db.execute(select(Procurement).where(Procurement.booking_id == booking_id).with_for_update())
    proc = p_res.scalars().first()
    net_w = round(weigh_in.gross_weight_kg - weigh_in.tare_weight_kg, 2)

    if not proc:
        proc = Procurement(
            booking_id=booking_id,
            centre_id=booking.centre_id,
            gross_weight=weigh_in.gross_weight_kg,
            tare_weight=weigh_in.tare_weight_kg,
            net_weight=net_w,
            status=ProcurementStatus.PROCUREMENT_COMPLETED,
            procurement_completed_at=datetime.utcnow()
        )
        db.add(proc)
        await db.flush()
    else:
        proc.gross_weight = weigh_in.gross_weight_kg
        proc.tare_weight = weigh_in.tare_weight_kg
        proc.net_weight = net_w
        proc.status = ProcurementStatus.PROCUREMENT_COMPLETED
        proc.procurement_completed_at = datetime.utcnow()
        db.add(proc)

    # 3. Create or update payment
    pay_res = await db.execute(select(Payment).where(Payment.procurement_id == proc.id).with_for_update())
    payment = pay_res.scalars().first()

    rate_per_kg = 22.75
    amount = round(net_w * rate_per_kg, 2)

    if not payment:
        payment = Payment(
            procurement_id=proc.id,
            amount=amount,
            status=PaymentStatus.COMPLETED,
            payment_reference=f"DBT-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            completed_at=datetime.utcnow()
        )
        db.add(payment)
    else:
        payment.amount = amount
        payment.status = PaymentStatus.COMPLETED
        payment.completed_at = datetime.utcnow()
        db.add(payment)

    # 4. Update Booking and QueueToken to COMPLETED
    booking.status = BookingStatus.COMPLETED
    db.add(booking)

    qt_res = await db.execute(select(QueueToken).where(QueueToken.booking_id == booking_id).with_for_update())
    token = qt_res.scalars().first()
    if token:
        token.status = QueueStatus.COMPLETED
        db.add(token)

    await db.commit()
    await db.refresh(proc)
    await db.refresh(payment)

    return {
        "success": True,
        "data": {
            "procurement": ProcurementResponse.model_validate(proc).model_dump(),
            "payment": PaymentResponse.model_validate(payment).model_dump(),
            "booking_status": "COMPLETED",
            "net_weight_kg": net_w,
            "payout_amount": amount
        },
        "message": "Weighment recorded, procurement completed, and DBT payment disbursed."
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

# ----------------- MANUAL BOOKING & CENTRE MANAGEMENT -----------------

from app.crud import crud_farmer
from app.schemas.farmer import FarmerResponse
from app.schemas.booking import BookingCreate, BookingResponse
from app.crud import crud_booking

@router.get("/farmers/search", response_model=StandardResponse)
async def search_farmers(
    phone_query: str = Query(..., min_length=3),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_MANAGER, UserRole.CENTRE_OPERATOR, UserRole.ADMIN]))
) -> Any:
    farmers = await crud_farmer.search_farmers(db, phone_query)
    
    # We will need to map to FarmerResponse
    data = []
    for f in farmers:
        f_dict = FarmerResponse.model_validate(f).model_dump()
        # Include user details
        if f.user:
            f_dict["user"] = {
                "id": str(f.user.id),
                "phone_number": f.user.phone_number,
                "full_name": f.user.full_name
            }
        data.append(f_dict)

    return {
        "success": True,
        "data": data,
        "message": "Farmers found."
    }

@router.post("/centres/{centre_id}/manual-booking", response_model=StandardResponse, status_code=201)
async def manual_booking(
    centre_id: uuid.UUID,
    farmer_id: uuid.UUID,
    booking_in: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_MANAGER, UserRole.CENTRE_OPERATOR, UserRole.ADMIN]))
) -> Any:
    await verify_centre_access(db, current_user, centre_id)
    
    # Verify farmer exists
    farmer_res = await db.execute(select(crud_farmer.Farmer).where(crud_farmer.Farmer.id == farmer_id))
    farmer = farmer_res.scalars().first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
        
    try:
        # We pass farmer.id, but booking_in already has the booking info.
        # crud_booking.create_booking checks for the slot.
        booking = await crud_booking.create_booking(db, farmer_id=farmer.id, booking_in=booking_in)
        # Verify it created for the correct centre. create_booking gets centre_id from slot.
        # We should ensure the selected slot belongs to this centre.
        slot_res = await db.execute(select(Slot).where(Slot.id == booking_in.slot_id))
        slot = slot_res.scalars().first()
        if slot.centre_id != centre_id:
            raise HTTPException(status_code=400, detail="Slot does not belong to this centre")
            
    except HTTPException as e:
        raise e
        
    return {
        "success": True,
        "data": BookingResponse.model_validate(booking).model_dump(),
        "message": "Manual booking created successfully."
    }
