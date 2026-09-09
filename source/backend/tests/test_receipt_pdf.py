import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.future import select
from app.models.users import UserRole, User
from app.models.entities import Farmer, Centre, Crop
from app.models.booking import Booking, Slot, BookingStatus
from app.models.operations import Procurement, ProcurementStatus, Payment, PaymentStatus
from app.core.security import create_access_token
from app.core.database import AsyncSessionLocal
from datetime import datetime, timezone

pytestmark = pytest.mark.asyncio

async def test_download_receipt_pdf_exhaustive(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        phone_a = str(uuid.uuid4().int)[:10]
        farmer_a_user = User(phone=phone_a, role=UserRole.FARMER, is_active=True)
        db.add(farmer_a_user)
        
        # Setup Farmer B
        phone_b = str(uuid.uuid4().int)[:10]
        farmer_b_user = User(phone=phone_b, role=UserRole.FARMER, is_active=True)
        db.add(farmer_b_user)
        
        await db.flush()
        
        farmer_a = Farmer(user_id=farmer_a_user.id, name="Farmer A")
        farmer_b = Farmer(user_id=farmer_b_user.id, name="Farmer B")
        db.add_all([farmer_a, farmer_b])
        
        # Get existing centre and crop (assuming seed data exists)
        res_c = await db.execute(select(Centre).limit(1))
        centre = res_c.scalars().first()
        
        res_crop = await db.execute(select(Crop).limit(1))
        crop = res_crop.scalars().first()
        
        res_slot = await db.execute(select(Slot).limit(1))
        slot = res_slot.scalars().first()
        
        ref_a = f"KF-TEST-A-{str(uuid.uuid4().int)[:6]}"
        booking_a = Booking(
            farmer_id=farmer_a.id,
            centre_id=centre.id,
            slot_id=slot.id,
            crop_id=crop.id,
            quantity=50.0,
            status=BookingStatus.COMPLETED,
            booking_reference=ref_a
        )
        db.add(booking_a)
        
        # Create Booking for Farmer B (Incomplete procurement)
        ref_b = f"KF-TEST-B-{str(uuid.uuid4().int)[:6]}"
        booking_b = Booking(
            farmer_id=farmer_b.id,
            centre_id=centre.id,
            slot_id=slot.id,
            crop_id=crop.id,
            quantity=30.0,
            status=BookingStatus.ARRIVED,
            booking_reference=ref_b
        )
        db.add(booking_b)
        
        await db.commit()
        await db.refresh(booking_a)
        await db.refresh(booking_b)

        # Procurement for A (Completed)
        procurement_a = Procurement(
            booking_id=booking_a.id,
            centre_id=centre.id,
            status=ProcurementStatus.PROCUREMENT_COMPLETED,
            procurement_completed_at=datetime.utcnow(),
            gross_weight=5000,
            tare_weight=100,
            net_weight=4900
        )
        db.add(procurement_a)

        # Procurement for B (Not completed)
        procurement_b = Procurement(
            booking_id=booking_b.id,
            centre_id=centre.id,
            status=ProcurementStatus.QUALITY_CHECK
        )
        db.add(procurement_b)

        await db.flush()

        payment_a = Payment(
            procurement_id=procurement_a.id,
            amount=100000.00,
            status=PaymentStatus.PENDING
        )
        db.add(payment_a)

        await db.commit()
        
        token_a = create_access_token(farmer_a_user.id)
        token_b = create_access_token(farmer_b_user.id)
        booking_a_ref = booking_a.booking_reference
        booking_b_ref = booking_b.booking_reference

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    # 1. Unauthenticated request -> DENIED (403)
    res_unauth = await client.get("/api/v1/bookings/receipt/KF-TEST-INVALID")
    assert res_unauth.status_code == 403
    
    # 2. Authenticated but invalid booking reference -> rejected (404)
    res_not_found = await client.get("/api/v1/bookings/receipt/KF-INVALID-999", headers=headers_a)
    assert res_not_found.status_code == 404
    
    # 3. Farmer A attempts Farmer A booking (Completed) -> ALLOWED (200)
    res_allowed = await client.get(f"/api/v1/bookings/receipt/{booking_a_ref}", headers=headers_a)
    assert res_allowed.status_code == 200
    assert res_allowed.headers["content-type"] == "application/pdf"
    assert "KisanFlow_Receipt" in res_allowed.headers["content-disposition"]
    assert res_allowed.content.startswith(b"%PDF-")
    
    # 4. Farmer A attempts Farmer B booking -> DENIED (403)
    res_denied = await client.get(f"/api/v1/bookings/receipt/{booking_b_ref}", headers=headers_a)
    assert res_denied.status_code == 403
    assert "Not authorized" in res_denied.text

    # 5. Farmer B attempts Farmer B booking (Not Completed) -> DENIED (400)
    res_not_completed = await client.get(f"/api/v1/bookings/receipt/{booking_b_ref}", headers=headers_b)
    assert res_not_completed.status_code == 400
    assert "Procurement is not yet completed" in res_not_completed.text
