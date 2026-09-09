import pytest
import asyncio
import uuid
import datetime
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.entities import Farmer, Centre, Crop
from app.models.users import User, UserRole
from app.models.booking import Slot, Booking
from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token

pytestmark = pytest.mark.asyncio

async def create_stress_test_data(db: AsyncSession, farmers_count: int, capacity: int = 100):
    centre = Centre(
        id=uuid.uuid4(), name="Stress Centre", code=f"STR-{uuid.uuid4().hex[:4]}",
        opening_time=datetime.time(8, 0), closing_time=datetime.time(18, 0)
    )
    crop = Crop(
        id=uuid.uuid4(), name="Stress Crop", code=f"STRC-{uuid.uuid4().hex[:4]}", unit="kg"
    )
    db.add_all([centre, crop])
    await db.flush()

    slot = Slot(
        id=uuid.uuid4(), centre_id=centre.id, crop_id=crop.id,
        slot_date=datetime.datetime.now(datetime.timezone.utc).date(),
        start_time=datetime.time(10, 0), end_time=datetime.time(11, 0),
        capacity=capacity, booked_count=0, status="OPEN"
    )
    db.add(slot)

    farmers_data = []
    for i in range(farmers_count):
        u = User(id=uuid.uuid4(), phone=f"90{uuid.uuid4().hex[:8]}", role=UserRole.FARMER, is_active=True)
        db.add(u)
        await db.flush()
        f = Farmer(id=uuid.uuid4(), user_id=u.id, name=f"Stress Farmer {i}")
        db.add(f)
        farmers_data.append((f.id, u.id))
    
    await db.commit()
    return centre.id, crop.id, slot.id, farmers_data

async def test_concurrent_slot_booking_20_times_3(client: AsyncClient):
    for run_idx in range(3):
        async with AsyncSessionLocal() as db:
            centre_id, crop_id, slot_id, farmers_data = await create_stress_test_data(db, 20, capacity=50)
            
        async def make_booking_request(u_id):
            token = create_access_token(u_id)
            headers = {"Authorization": f"Bearer {token}"}
            payload = {
                "centre_id": str(centre_id),
                "crop_id": str(crop_id),
                "slot_id": str(slot_id),
                "quantity": 50  # Since capacity is 50, only ONE of the 20 requests should succeed
            }
            return await client.post("/api/v1/bookings", json=payload, headers=headers)

        tasks = [make_booking_request(u_id) for _, u_id in farmers_data]
        responses = await asyncio.gather(*tasks)
        
        status_codes = [r.status_code for r in responses]
        successes = status_codes.count(201)
        failures = status_codes.count(409)
        
        assert successes == 1, f"Run {run_idx}: Expected exactly 1 success, got {successes}"
        assert failures == 19, f"Run {run_idx}: Expected exactly 19 failures, got {failures}"
        
        async with AsyncSessionLocal() as db:
            slot = await db.get(Slot, slot_id)
            assert slot.booked_count == 50, f"Run {run_idx}: Capacity invariant violated. Booked {slot.booked_count}/50"

async def test_rapid_polling_queue_load(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        centre_id, crop_id, slot_id, farmers_data = await create_stress_test_data(db, 1)
        token = create_access_token(farmers_data[0][1])
        headers = {"Authorization": f"Bearer {token}"}
        
    async def poll_endpoint():
        return await client.get("/api/v1/health", headers=headers)

    # 100 concurrent rapid polls
    tasks = [poll_endpoint() for _ in range(100)]
    responses = await asyncio.gather(*tasks)
    
    assert all(r.status_code == 200 for r in responses)

async def test_authentication_failures(client: AsyncClient):
    # 1. Missing Token
    res1 = await client.get("/api/v1/bookings/123")
    assert res1.status_code in [401, 403]
    
    # 2. Malformed Token
    res2 = await client.get("/api/v1/bookings/123", headers={"Authorization": "Bearer garbage123"})
    assert res2.status_code in [401, 403]
    
    # 3. Invalid JWT Claims (Farmer trying operator endpoint)
    async with AsyncSessionLocal() as db:
        _, _, _, farmers_data = await create_stress_test_data(db, 1)
        f_token = create_access_token(farmers_data[0][1])
    
    res3 = await client.get("/api/v1/centres/fake-centre-id/bookings", headers={"Authorization": f"Bearer {f_token}"})
    assert res3.status_code == 403

async def test_duplicate_requests(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        centre_id, crop_id, slot_id, farmers_data = await create_stress_test_data(db, 1)
        u_id = farmers_data[0][1]
    
    token = create_access_token(u_id)
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "centre_id": str(centre_id),
        "crop_id": str(crop_id),
        "slot_id": str(slot_id),
        "quantity": 10
    }
    
    # Fire 5 identical requests
    tasks = [client.post("/api/v1/bookings", json=payload, headers=headers) for _ in range(5)]
    responses = await asyncio.gather(*tasks)
    
    status_codes = [r.status_code for r in responses]
    assert status_codes.count(201) == 1
    assert status_codes.count(409) == 4

async def test_multi_operator_concurrency(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        centre_id, crop_id, slot_id, farmers_data = await create_stress_test_data(db, 1)
        
        # Setup 2 Operators for the same centre
        opA_user = User(id=uuid.uuid4(), phone="9888888888", role=UserRole.CENTRE_OPERATOR, is_active=True)
        opB_user = User(id=uuid.uuid4(), phone="9777777777", role=UserRole.CENTRE_OPERATOR, is_active=True)
        db.add_all([opA_user, opB_user])
        await db.flush()
        
        from app.models.entities import Officer
        officerA = Officer(id=uuid.uuid4(), user_id=opA_user.id, centre_id=centre_id, name="Op A")
        officerB = Officer(id=uuid.uuid4(), user_id=opB_user.id, centre_id=centre_id, name="Op B")
        db.add_all([officerA, officerB])
        
        # Create a booking that is ARRIVED, ready to be called
        booking = Booking(
            id=uuid.uuid4(), farmer_id=farmers_data[0][0], centre_id=centre_id, slot_id=slot_id, crop_id=crop_id,
            quantity=50.0, status="ARRIVED", booking_reference="REF-M10"
        )
        db.add(booking)
        await db.commit()
        
        tokenA = create_access_token(opA_user.id)
        tokenB = create_access_token(opB_user.id)
        booking_id = booking.id

    # Both operators try to call the farmer simultaneously (transition ARRIVED -> QUEUED -> CALLED)
    # The actual endpoint in management is /api/v1/management/queue/call/{booking_id}
    headersA = {"Authorization": f"Bearer {tokenA}"}
    headersB = {"Authorization": f"Bearer {tokenB}"}

    async def op_call(headers):
        return await client.post(f"/api/v1/management/queue/call/{booking_id}", headers=headers)
    
    responses = await asyncio.gather(op_call(headersA), op_call(headersB))
    status_codes = [r.status_code for r in responses]
    
    # One should succeed, one should fail (or return the exact same idempotent response if implemented that way, but state shouldn't advance twice)
    successes = status_codes.count(200)
    conflicts = status_codes.count(409) + status_codes.count(404) + status_codes.count(400) # depending on state machine response
    
    # Check DB state
    async with AsyncSessionLocal() as db:
        b = await db.get(Booking, booking_id)
        assert b.status == "CALLED" # State should be precisely CALLED, not advanced further

