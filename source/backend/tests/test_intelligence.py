import pytest
import uuid
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from app.intelligence.predictions import recommend_slots
from app.models.booking import Slot

from app.core.database import AsyncSessionLocal

pytestmark = pytest.mark.asyncio

async def test_recommend_slots_transparency():
    async with AsyncSessionLocal() as db_session:
        # Setup test data
        centre_id = uuid.uuid4()
        crop_id = uuid.uuid4()
        
        # We will use today's date
        today = datetime.datetime.now(datetime.timezone.utc).date()
        today_str = str(today)

        # Insert missing foreign key objects
        from app.models.entities import Centre, Crop
        centre = Centre(
            id=centre_id,
            name="Test Centre",
            code=f"TC-{uuid.uuid4().hex[:6]}",
            opening_time=datetime.time(8, 0),
            closing_time=datetime.time(18, 0)
        )
        crop = Crop(
            id=crop_id,
            name="Test Crop",
            code=f"CROP-{uuid.uuid4().hex[:6]}",
            unit="kg"
        )
        db_session.add(centre)
        db_session.add(crop)
        await db_session.commit()

    
        # 1. LOW congestion slot (capacity 100, booked 10 -> 10% utilization -> score 90.0)
        slot1 = Slot(
            id=uuid.uuid4(),
            centre_id=centre_id,
            crop_id=crop_id,
            slot_date=today,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(10, 0),
            capacity=10000, # 100 quintals
            booked_count=1000, # 10 quintals
            status="OPEN"
        )
    
        # 2. MEDIUM congestion slot (capacity 100, booked 50 -> 50% utilization -> score 50.0)
        slot2 = Slot(
            id=uuid.uuid4(),
            centre_id=centre_id,
            crop_id=crop_id,
            slot_date=today,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(11, 0),
            capacity=10000,
            booked_count=5000,
            status="OPEN"
        )
    
        # 3. HIGH congestion slot (capacity 100, booked 90 -> 90% utilization -> score 10.0)
        slot3 = Slot(
            id=uuid.uuid4(),
            centre_id=centre_id,
            crop_id=crop_id,
            slot_date=today,
            start_time=datetime.time(11, 0),
            end_time=datetime.time(12, 0),
            capacity=10000,
            booked_count=9000,
            status="OPEN"
        )
    
        db_session.add_all([slot1, slot2, slot3])
        await db_session.commit()
    
        # Test logic
        # Requesting 10 quintals (1000 kg)
        recommendations = await recommend_slots(
            db=db_session,
            centre_id=centre_id,
            crop_id=crop_id,
            quantity_kg=1000.0,
            target_date=today_str
        )
    
        # All three should be returned, sorted by score descending (LOW, MEDIUM, HIGH)
        assert len(recommendations) == 3
        
        # Highest score (LOW) should be first
        first_rec = recommendations[0]
        assert first_rec.slot_id == slot1.id
        assert first_rec.congestion_level == "LOW"
        assert first_rec.score == 90.0
        assert first_rec.capacity == 10000
        assert first_rec.booked_count == 1000
        assert first_rec.remaining_capacity == 9000
        assert first_rec.utilization == 0.1
        assert "Low current utilization" in first_rec.reasons
    
        # Middle score (MEDIUM)
        second_rec = recommendations[1]
        assert second_rec.slot_id == slot2.id
        assert second_rec.congestion_level == "MEDIUM"
        assert second_rec.score == 50.0
        assert "Moderate current utilization" in second_rec.reasons
    
        # Lowest score (HIGH)
        third_rec = recommendations[2]
        assert third_rec.slot_id == slot3.id
        assert third_rec.congestion_level == "HIGH"
        assert third_rec.score == 10.0
        assert "High current utilization" in third_rec.reasons


async def test_recommend_slots_capacity_rejection():
    async with AsyncSessionLocal() as db_session:
        # Setup test data
        centre_id = uuid.uuid4()
        crop_id = uuid.uuid4()
        today = datetime.datetime.now(datetime.timezone.utc).date()
        today_str = str(today)

        # Insert missing foreign key objects
        from app.models.entities import Centre, Crop
        centre = Centre(
            id=centre_id,
            name="Test Centre 2",
            code=f"TC2-{uuid.uuid4().hex[:6]}",
            opening_time=datetime.time(8, 0),
            closing_time=datetime.time(18, 0)
        )
        crop = Crop(
            id=crop_id,
            name="Test Crop 2",
            code=f"CROP2-{uuid.uuid4().hex[:6]}",
            unit="kg"
        )
        db_session.add(centre)
        db_session.add(crop)
        await db_session.commit()
    
        # Slot with 10 quintals remaining (1000 kg)
        slot1 = Slot(
            id=uuid.uuid4(),
            centre_id=centre_id,
            crop_id=crop_id,
            slot_date=today,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(10, 0),
            capacity=2000, 
            booked_count=1000, 
            status="OPEN"
        )
    
        db_session.add(slot1)
        await db_session.commit()
    
        # Requesting 15 quintals (1500 kg) - should be rejected
        recommendations = await recommend_slots(
            db=db_session,
            centre_id=centre_id,
            crop_id=crop_id,
            quantity_kg=1500.0,
            target_date=today_str
        )
    
        assert len(recommendations) == 0
