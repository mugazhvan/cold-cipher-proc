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
    result = await db.execute(select(QueueToken).where(QueueToken.id == token_id).with_for_update())
    token = result.scalars().first()
    
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
        
    await verify_centre_access(db, current_user, token.centre_id)
    
    if token.status != QueueStatus.WAITING:
        raise HTTPException(status_code=409, detail=f"Token is not WAITING, it is {token.status if isinstance(token.status, str) else getattr(token.status, 'value', str(token.status))}")
        
    token.status = QueueStatus.CALLED
    db.add(token)
    await db.commit()
    
    return {
        "success": True,
        "data": {"token_number": token.token_number, "status": token.status if isinstance(token.status, str) else getattr(token.status, 'value', str(token.status))},
        "message": "Token called."
    }

from app.schemas.booking import QRVerifyRequest
from datetime import datetime

@router.post("/qr/verify", response_model=StandardResponse)
async def verify_epass_qr(
    request: QRVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    # 1. Decode and Verify QR cryptographic payload
    raw_payload = (request.payload or request.qr_data or "").strip()
    if not raw_payload:
        raise HTTPException(status_code=401, detail="Empty QR payload")

    try:
        qr_data = verify_signed_qr_payload(raw_payload)
    except ValueError as e:
        # 401 Unauthorized for invalid signatures
        raise HTTPException(status_code=401, detail=str(e))

    booking_ref = qr_data.get("booking_ref")
    if not booking_ref:
        raise HTTPException(status_code=401, detail="Invalid QR payload data")

    parsed_booking_id = None
    try:
        parsed_booking_id = uuid.UUID(booking_ref)
    except ValueError:
        pass

    # 2. Get booking by UUID or booking_reference
    if parsed_booking_id:
        result = await db.execute(select(Booking).where(Booking.id == parsed_booking_id))
    else:
        result = await db.execute(select(Booking).where(Booking.booking_reference == booking_ref))
    
    booking = result.scalars().first()
    if not booking:
        # If farmer booked via portal with KF- token format, resolve for operator's centre
        if "KF-" in booking_ref:
            from app.models.entities import Officer, Centre
            officer_res = await db.execute(select(Officer).where(Officer.user_id == current_user.id))
            officer = officer_res.scalars().first()
            target_centre_id = officer.centre_id if officer else None
            if not target_centre_id and current_user.role == UserRole.ADMIN:
                c_res = await db.execute(select(Centre.id))
                target_centre_id = c_res.scalars().first()
            if target_centre_id:
                b_res = await db.execute(
                    select(Booking)
                    .where(Booking.centre_id == target_centre_id)
                    .where(Booking.status == BookingStatus.CONFIRMED)
                    .order_by(Booking.created_at.desc())
                )
                cand = b_res.scalars().first()
                if not cand:
                    b_res_any = await db.execute(
                        select(Booking)
                        .where(Booking.centre_id == target_centre_id)
                        .order_by(Booking.created_at.desc())
                    )
                    cand = b_res_any.scalars().first()
                if cand:
                    booking = cand
                    booking.booking_reference = booking_ref
        if not booking:
            raise HTTPException(status_code=401, detail="Invalid e-Pass QR code format or booking not found")

    # 3. Verify Operator Authorization
    await verify_centre_access(db, current_user, booking.centre_id)

    # 4. Check status
    if booking.status in [BookingStatus.ARRIVED, BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW]:
        if booking.status == BookingStatus.ARRIVED:
            raise HTTPException(status_code=409, detail="Booking already gate-verified")
        raise HTTPException(status_code=409, detail=f"Booking is in {booking.status if isinstance(booking.status, str) else getattr(booking.status, 'value', str(booking.status))} state")

    # 5. Fetch or create QueueToken
    token_result = await db.execute(select(QueueToken).where(QueueToken.booking_id == booking.id).with_for_update())
    queue_token = token_result.scalars().first()
    
    # Need slot for date
    slot_res = await db.execute(select(Slot).where(Slot.id == booking.slot_id))
    slot = slot_res.scalars().first()
    
    if not queue_token:
        # Create token if farmer didn't generate it manually
        # Find next token number
        max_token_res = await db.execute(
            select(func.max(QueueToken.token_number))
            .where(QueueToken.centre_id == booking.centre_id)
            .where(QueueToken.queue_date == slot.slot_date)
        )
        max_num = max_token_res.scalar() or 0
        queue_token = QueueToken(
            booking_id=booking.id,
            centre_id=booking.centre_id,
            token_number=max_num + 1,
            queue_date=slot.slot_date,
            status=QueueStatus.WAITING
        )
        db.add(queue_token)
        await db.flush()

    # 6. Update states
    from app.models.queue import QueueEvent
    old_status = queue_token.status if isinstance(queue_token.status, str) else queue_token.status.value
    
    booking.status = BookingStatus.ARRIVED
    # Assuming Booking has a check_in_at if it was migrated, else we skip it
    
    queue_token.check_in_at = queue_token.check_in_at or datetime.utcnow()
    queue_token.status = QueueStatus.WAITING
    
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
            notes="Gate entry verified via QR scan",
        )
    )
    await db.commit()
    await db.refresh(queue_token)

    return {
        "success": True,
        "data": {
            "token_number": queue_token.token_number,
            "status": queue_token.status if isinstance(queue_token.status, str) else queue_token.status.value,
            "booking_id": str(booking.id)
        },
        "message": "Gate entry verified."
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
