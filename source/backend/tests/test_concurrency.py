import pytest
import asyncio
from httpx import AsyncClient
import uuid
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import Farmer, Centre, Crop
from app.models.booking import Slot
from app.core.database import AsyncSessionLocal
from app.api.deps import get_db

pytestmark = pytest.mark.asyncio

async def setup_test_data(db: AsyncSession):
    from app.models.users import User, UserRole

    # Setup base entities
    user = User(
        id=uuid.uuid4(),
        phone=f"99{uuid.uuid4().hex[:8]}",
        role=UserRole.FARMER,
        is_active=True
    )
    db.add(user)
    await db.flush()

    farmer = Farmer(
        id=uuid.uuid4(),
        user_id=user.id,
        name="Concurrency Test Farmer",
        village="Test Village"
    )
    centre = Centre(
        id=uuid.uuid4(),
        name="Concurrency Centre",
        code=f"CC-{uuid.uuid4().hex[:6]}",
        opening_time=datetime.time(8, 0),
        closing_time=datetime.time(18, 0)
    )
    crop = Crop(
        id=uuid.uuid4(),
        name="Concurrency Crop",
        code=f"CCROP-{uuid.uuid4().hex[:4]}",
        unit="kg"
    )
    db.add(farmer)
    db.add(centre)
    db.add(crop)
    await db.flush()

    today = datetime.datetime.now(datetime.timezone.utc).date()
    
    # Slot with exactly 1 booking left (capacity 1000, booked 900 -> 100 remaining)
    # Booking request will be for 100
    slot = Slot(
        id=uuid.uuid4(),
        centre_id=centre.id,
        crop_id=crop.id,
        slot_date=today,
        start_time=datetime.time(10, 0),
        end_time=datetime.time(11, 0),
        capacity=1000,
        booked_count=900,
        status="OPEN"
    )
    db.add(slot)
    await db.commit()
    
    return farmer.id, centre.id, crop.id, slot.id, user.id

async def test_duplicate_booking_prevention(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        farmer_id, centre_id, crop_id, slot_id, user_id = await setup_test_data(db)
        
    from app.core.security import create_access_token
    token = create_access_token(user_id)

    payload = {
        "centre_id": str(centre_id),
        "crop_id": str(crop_id),
        "slot_id": str(slot_id),
        "quantity": 50
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Request 1
    res1 = await client.post("/api/v1/bookings", json=payload, headers=headers)
    assert res1.status_code == 201
    
    # Request 2 - exact same payload and farmer -> should fail due to unique index
    res2 = await client.post("/api/v1/bookings", json=payload, headers=headers)
    assert res2.status_code == 409
    assert res2.json()["detail"] == "DUPLICATE_BOOKING"

async def test_capacity_race_condition(client: AsyncClient):
    async with AsyncSessionLocal() as db:
        farmer_id, centre_id, crop_id, slot_id, user_id = await setup_test_data(db)
        
        from app.models.users import User, UserRole
        from app.core.security import create_access_token
        
        # We need 5 different farmers to avoid the UNIQUE constraint failure 
        # so we can truly test the capacity CheckConstraint race condition
        farmers_data = []
        for i in range(5):
            u = User(
                id=uuid.uuid4(),
                phone=f"88{uuid.uuid4().hex[:8]}",
                role=UserRole.FARMER,
                is_active=True
            )
            db.add(u)
            await db.flush()
            
            f = Farmer(
                id=uuid.uuid4(),
                user_id=u.id,
                name=f"Race Test Farmer {i}"
            )
            db.add(f)
            farmers_data.append((f.id, u.id))
        await db.commit()

    async def make_request(u_id):
        token = create_access_token(u_id)
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "centre_id": str(centre_id),
            "crop_id": str(crop_id),
            "slot_id": str(slot_id),
            "quantity": 100
        }
        return await client.post("/api/v1/bookings", json=payload, headers=headers)

    tasks = [make_request(u_id) for f_id, u_id in farmers_data]
    responses = await asyncio.gather(*tasks)
    
    status_codes = [r.status_code for r in responses]
    
    successes = status_codes.count(201)
    failures = status_codes.count(409)
    
    assert successes == 1
    assert failures == 4
    
    # Check the actual database state
    async with AsyncSessionLocal() as db:
        slot = await db.get(Slot, slot_id)
        assert slot.booked_count == 1000
