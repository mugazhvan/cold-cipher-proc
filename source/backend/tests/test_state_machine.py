import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.future import select
from app.models.users import UserRole, User
from app.models.entities import Farmer, Centre, Crop
from app.models.booking import Booking, Slot, BookingStatus
from app.models.queue import QueueToken, QueueStatus
from app.models.operations import Procurement, ProcurementStatus
from app.core.security import create_access_token, create_signed_qr_payload
from app.core.database import AsyncSessionLocal
from datetime import datetime, time, timezone
import jwt
from app.core.config import settings

pytestmark = pytest.mark.asyncio

async def setup_test_data(db):
    # User and Farmer
    phone_f = str(uuid.uuid4().int)[:10]
    farmer_user = User(phone=phone_f, role=UserRole.FARMER, is_active=True)
    db.add(farmer_user)
    
    # Operator
    phone_o = str(uuid.uuid4().int)[:10]
    operator_user = User(phone=phone_o, role=UserRole.CENTRE_OPERATOR, is_active=True)
    db.add(operator_user)
    
    await db.flush()
    
    farmer = Farmer(user_id=farmer_user.id, name="Test Farmer SM")
    db.add(farmer)
    
    # Centre & Crop
    res_c = await db.execute(select(Centre).limit(1))
    centre = res_c.scalars().first()
    res_crop = await db.execute(select(Crop).limit(1))
    crop = res_crop.scalars().first()
    
    from app.models.entities import Officer
    officer = Officer(user_id=operator_user.id, centre_id=centre.id, name="Test Officer")
    db.add(officer)
    
    # Slot
    slot = Slot(
        centre_id=centre.id,
        crop_id=crop.id,
        slot_date=datetime.utcnow().date(),
        start_time=time(8,0),
        end_time=time(10,0),
        capacity=100,
        booked_count=1,
        status="OPEN"
    )
    db.add(slot)
    await db.flush()
    
    # Booking
    ref = f"KF-TEST-SM-{str(uuid.uuid4().int)[:6]}"
    booking = Booking(
        farmer_id=farmer.id,
        centre_id=centre.id,
        slot_id=slot.id,
        crop_id=crop.id,
        quantity=50.0,
        status=BookingStatus.CONFIRMED,
        booking_reference=ref
    )
    db.add(booking)
    await db.commit()
    
    return {
        "farmer_user": farmer_user,
        "operator_user": operator_user,
        "farmer": farmer,
        "centre": centre,
        "crop": crop,
        "slot": slot,
        "booking": booking
    }

async def test_state_machine_happy_path(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        data = await setup_test_data(db)
        op_token = create_access_token(data["operator_user"].id)
        booking = data["booking"]
        booking_id = booking.id
        booking_ref = booking.booking_reference
        
        # 1. Generate QR Payload (simulate frontend)
        qr_payload = create_signed_qr_payload(
            booking_ref=booking_ref,
            centre_id=str(booking.centre_id),
            expiry_ts=int(datetime.now(timezone.utc).timestamp() + 3600)
        )
        
    headers = {"Authorization": f"Bearer {op_token}"}
    
    # 2. Gate Verify (QR) -> CONFIRMED to ARRIVED, queue WAITING
    res_qr = await client.post("/api/v1/management/qr/verify", json={"qr_data": qr_payload}, headers=headers)
    assert res_qr.status_code == 200, res_qr.text
    res_data = res_qr.json()["data"]
    assert res_data["status"] == "WAITING"
    
    async with AsyncSessionLocal() as db:
        qt_res = await db.execute(select(QueueToken).where(QueueToken.booking_id == booking_id))
        queue_token = qt_res.scalars().first()
        token_id = queue_token.id

    # 3. Call Token -> WAITING to CALLED
    res_call = await client.post(f"/api/v1/management/queue/{token_id}/call", headers=headers)
    assert res_call.status_code == 200, res_call.text
    assert res_call.json()["data"]["status"] == "CALLED"
    
    # 4. Start Weighing -> CALLED to PROCESSING, Procurement WEIGHING
    res_weigh = await client.post(
        f"/api/v1/management/procurement/{booking_id}/start-weighing",
        json={"gross_weight": 5000, "tare_weight": 100},
        headers=headers
    )
    assert res_weigh.status_code == 201, res_weigh.text
    procurement_id = res_weigh.json()["data"]["id"]
    assert res_weigh.json()["data"]["status"] == "WEIGHING"
    assert res_weigh.json()["data"]["net_weight"] == 4900
    
    # 5. Quality Submit -> WEIGHING to ACCEPTED
    res_qual = await client.post(
        f"/api/v1/management/procurement/{procurement_id}/quality",
        json={"quality_status": "GRADE_A", "quality_remarks": "Looks good"},
        headers=headers
    )
    assert res_qual.status_code == 200, res_qual.text
    assert res_qual.json()["data"]["status"] == "ACCEPTED"
    
    # 6. Complete Procurement -> ACCEPTED to PROCUREMENT_COMPLETED
    res_comp = await client.post(f"/api/v1/management/procurement/{procurement_id}/complete", headers=headers)
    assert res_comp.status_code == 200, res_comp.text
    assert res_comp.json()["data"]["status"] == "PROCUREMENT_COMPLETED"
    
    # Verify final statuses in DB
    async with AsyncSessionLocal() as db:
        b_res = await db.execute(select(Booking).where(Booking.id == booking_id))
        final_booking = b_res.scalars().first()
        assert final_booking.status == BookingStatus.COMPLETED
        
        qt_res = await db.execute(select(QueueToken).where(QueueToken.booking_id == booking_id))
        final_queue = qt_res.scalars().first()
        assert final_queue.status == QueueStatus.COMPLETED

async def test_state_machine_invalid_transitions(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        data = await setup_test_data(db)
        op_token = create_access_token(data["operator_user"].id)
        booking_id = data["booking"].id
        
    headers = {"Authorization": f"Bearer {op_token}"}
    
    # Try to start weighing without gate verify -> 404/409
    res_weigh = await client.post(
        f"/api/v1/management/procurement/{booking_id}/start-weighing",
        json={"gross_weight": 5000, "tare_weight": 100},
        headers=headers
    )
    assert res_weigh.status_code in [404, 409] # 404 because queue token not found
    
    # Try arbitrary quality endpoint on non-existent proc
    fake_id = str(uuid.uuid4())
    res_qual = await client.post(
        f"/api/v1/management/procurement/{fake_id}/quality",
        json={"quality_status": "GRADE_A"},
        headers=headers
    )
    assert res_qual.status_code == 404

async def test_weighing_invalid_weights(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        data = await setup_test_data(db)
        op_token = create_access_token(data["operator_user"].id)
        booking = data["booking"]
        booking_id = booking.id
        booking_ref = booking.booking_reference
        
        qr_payload = create_signed_qr_payload(
            booking_ref=booking_ref,
            centre_id=str(booking.centre_id),
            expiry_ts=int(datetime.now(timezone.utc).timestamp() + 3600)
        )
        
    headers = {"Authorization": f"Bearer {op_token}"}
    await client.post("/api/v1/management/qr/verify", json={"qr_data": qr_payload}, headers=headers)
    
    async with AsyncSessionLocal() as db:
        qt_res = await db.execute(select(QueueToken).where(QueueToken.booking_id == booking_id))
        token_id = qt_res.scalars().first().id
        
    await client.post(f"/api/v1/management/queue/{token_id}/call", headers=headers)
    
    # Try invalid weights
    res_weigh = await client.post(
        f"/api/v1/management/procurement/{booking_id}/start-weighing",
        json={"gross_weight": 100, "tare_weight": 5000},
        headers=headers
    )
    assert res_weigh.status_code == 400
    assert "strictly greater" in res_weigh.text
