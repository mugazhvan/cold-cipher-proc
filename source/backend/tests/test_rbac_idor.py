import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.future import select
from app.models.users import UserRole, User
from app.models.entities import Farmer, Centre, Crop, Officer
from app.models.booking import Booking, Slot, BookingStatus
from app.core.security import create_access_token
from app.core.database import AsyncSessionLocal
from datetime import datetime, time

pytestmark = pytest.mark.asyncio

async def setup_farmer(db, phone: str, name: str):
    user = User(phone=phone, role=UserRole.FARMER, is_active=True)
    db.add(user)
    await db.flush()
    farmer = Farmer(user_id=user.id, name=name)
    db.add(farmer)
    await db.flush()
    return user, farmer

async def setup_operator(db, phone: str, name: str, centre_id: uuid.UUID):
    user = User(phone=phone, role=UserRole.CENTRE_OPERATOR, is_active=True)
    db.add(user)
    await db.flush()
    officer = Officer(user_id=user.id, centre_id=centre_id, name=name)
    db.add(officer)
    await db.flush()
    return user, officer

async def setup_test_data(db):
    # Two Farmers
    user_fA, farmerA = await setup_farmer(db, str(uuid.uuid4().int)[:10], "Farmer A")
    user_fB, farmerB = await setup_farmer(db, str(uuid.uuid4().int)[:10], "Farmer B")

    # Two Centres
    res_c = await db.execute(select(Centre).limit(2))
    centres = res_c.scalars().all()
    if len(centres) < 2:
        c1 = Centre(name="Centre A", location="Loc A", district="Dist A", capacity_per_day=100)
        c2 = Centre(name="Centre B", location="Loc B", district="Dist B", capacity_per_day=100)
        db.add_all([c1, c2])
        await db.flush()
        centres = [c1, c2]
    centreA, centreB = centres[0], centres[1]

    # Two Operators
    user_oA, officerA = await setup_operator(db, str(uuid.uuid4().int)[:10], "Op A", centreA.id)
    user_oB, officerB = await setup_operator(db, str(uuid.uuid4().int)[:10], "Op B", centreB.id)

    # Crop
    res_crop = await db.execute(select(Crop).limit(1))
    crop = res_crop.scalars().first()

    # Slot for Centre A
    slotA = Slot(
        centre_id=centreA.id,
        crop_id=crop.id,
        slot_date=datetime.utcnow().date(),
        start_time=time(8,0),
        end_time=time(10,0),
        capacity=100,
        booked_count=1,
        status="OPEN"
    )
    db.add(slotA)
    await db.flush()

    # Booking for Farmer A at Centre A
    ref = f"KF-TEST-IDOR-{str(uuid.uuid4().int)[:6]}"
    bookingA = Booking(
        farmer_id=farmerA.id,
        centre_id=centreA.id,
        slot_id=slotA.id,
        crop_id=crop.id,
        quantity=50.0,
        status=BookingStatus.CONFIRMED,
        booking_reference=ref
    )
    db.add(bookingA)
    await db.commit()

    return {
        "farmerA_token": create_access_token(user_fA.id),
        "farmerB_token": create_access_token(user_fB.id),
        "operatorA_token": create_access_token(user_oA.id),
        "operatorB_token": create_access_token(user_oB.id),
        "bookingA": bookingA,
        "centreA": centreA,
        "centreB": centreB
    }

async def test_farmer_cannot_access_other_farmer_booking(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        data = await setup_test_data(db)
        bookingA_id = data["bookingA"].id

    headers = {"Authorization": f"Bearer {data['farmerB_token']}"}
    res = await client.get(f"/api/v1/bookings/{bookingA_id}", headers=headers)
    
    assert res.status_code in [403, 404], f"Expected 403 or 404, got {res.status_code}. Response: {res.text}"

async def test_operator_cannot_access_other_centre_booking(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        data = await setup_test_data(db)
        booking_id = data["bookingA"].id
        booking_ref = data["bookingA"].booking_reference

    headers = {"Authorization": f"Bearer {data['operatorB_token']}"}
    
    # 1. get_booking_details
    res = await client.get(f"/api/v1/bookings/{booking_id}", headers=headers)
    assert res.status_code in [403, 404], f"Expected 403 or 404 on get_booking_details, got {res.status_code} - {res.text}"

    # 2. download_epass_pdf
    res_pdf = await client.get(f"/api/v1/bookings/epass/{booking_ref}", headers=headers)
    assert res_pdf.status_code in [403, 404], f"Expected 403 or 404 on download_epass_pdf, got {res_pdf.status_code} - {res_pdf.text}"

async def test_operator_get_centre_bookings_m9(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        data = await setup_test_data(db)
        
    centreA_id = data["centreA"].id
    centreB_id = data["centreB"].id
    headers_opA = {"Authorization": f"Bearer {data['operatorA_token']}"}
    headers_farmer = {"Authorization": f"Bearer {data['farmerA_token']}"}

    # 1. Operator A gets bookings for Centre A
    res = await client.get(f"/api/v1/centres/{centreA_id}/bookings", headers=headers_opA)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["success"] is True
    assert "items" in res_data["data"]

    # 2. Operator A trying to get bookings for Centre B should fail (403 or 404)
    res2 = await client.get(f"/api/v1/centres/{centreB_id}/bookings", headers=headers_opA)
    assert res2.status_code in [403, 404]

    # 3. Farmer trying to access the endpoint should fail (403)
    res3 = await client.get(f"/api/v1/centres/{centreA_id}/bookings", headers=headers_farmer)
    assert res3.status_code == 403
