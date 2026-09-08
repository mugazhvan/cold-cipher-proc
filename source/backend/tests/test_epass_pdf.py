import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.future import select
from app.models.users import UserRole, User
from app.models.entities import Farmer, Centre, Crop
from app.models.booking import Booking, Slot, BookingStatus
from app.core.security import create_access_token
from app.core.database import AsyncSessionLocal

pytestmark = pytest.mark.asyncio

async def test_download_epass_pdf_exhaustive(client: AsyncClient):
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
            status=BookingStatus.CONFIRMED,
            booking_reference=ref_a
        )
        db.add(booking_a)
        
        # Create Booking for Farmer B
        ref_b = f"KF-TEST-B-{str(uuid.uuid4().int)[:6]}"
        booking_b = Booking(
            farmer_id=farmer_b.id,
            centre_id=centre.id,
            slot_id=slot.id,
            crop_id=crop.id,
            quantity=30.0,
            status=BookingStatus.CONFIRMED,
            booking_reference=ref_b
        )
        db.add(booking_b)
        
        await db.commit()
        
        token_a = create_access_token(farmer_a_user.id)
        token_b = create_access_token(farmer_b_user.id)
        booking_a_ref = booking_a.booking_reference
        booking_b_ref = booking_b.booking_reference

    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    # 1. Unauthenticated request -> DENIED (401)
    res_unauth = await client.get("/api/v1/bookings/epass/KF-TEST-INVALID")
    assert res_unauth.status_code == 401
    
    # 2. Authenticated but invalid booking reference -> rejected (404)
    res_not_found = await client.get("/api/v1/bookings/epass/KF-INVALID-999", headers=headers_a)
    assert res_not_found.status_code == 404
    
    # 3. Farmer A attempts Farmer A booking -> ALLOWED (200)
    res_allowed = await client.get(f"/api/v1/bookings/epass/{booking_a_ref}", headers=headers_a)
    assert res_allowed.status_code == 200
    assert res_allowed.headers["content-type"] == "application/pdf"
    assert "KisanFlow_ePass" in res_allowed.headers["content-disposition"]
    assert res_allowed.content.startswith(b"%PDF-")
    
    # 4. Farmer A attempts Farmer B booking -> DENIED (403)
    res_denied = await client.get(f"/api/v1/bookings/epass/{booking_b_ref}", headers=headers_a)
    assert res_denied.status_code == 403
    assert "Not authorized" in res_denied.text
