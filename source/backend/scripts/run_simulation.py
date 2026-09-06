import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.models.entities import Farmer, Centre, Crop
from app.models.booking import Booking, Slot
from app.models.queue import QueueToken, QueueStatus

async def run_simulation():
    print("Starting KisanFlow Live Simulation...")
    async with AsyncSessionLocal() as session:
        # 1. Fetch base entities (assuming they were seeded)
        centres = (await session.execute(select(Centre))).scalars().all()
        crops = (await session.execute(select(Crop))).scalars().all()
        farmers = (await session.execute(select(Farmer))).scalars().all()
        
        if not centres or not crops or not farmers:
            print("Database is empty. Please run seed script first.")
            return

        today = datetime.utcnow().date()
        
        # 2. Generate heavy traffic for Today (for live demo)
        demo_centre = centres[0]
        print(f"Targeting {demo_centre.name} for heavy simulation load.")
        
        # Fetch today's slots for demo_centre
        slots = (await session.execute(
            select(Slot).where(Slot.centre_id == demo_centre.id).where(Slot.slot_date == today)
        )).scalars().all()
        
        if not slots:
            print("No slots available for today. Creating mock slots...")
            slots = []
            for i in range(8, 16, 2):
                from datetime import time
                s = Slot(
                    centre_id=demo_centre.id,
                    crop_id=crops[0].id,
                    slot_date=today,
                    start_time=time(i, 0),
                    end_time=time(i+2, 0),
                    capacity=20000,
                    booked_count=0,
                    status="OPEN"
                )
                session.add(s)
                slots.append(s)
            await session.commit()
            
        print(f"Simulating 120 bookings and queue events for today...")
        
        simulated_bookings = []
        token_counter = 1
        
        for i in range(120):
            farmer = random.choice(farmers)
            slot = random.choice(slots)
            crop = random.choice(crops)
            qty = random.uniform(500, 2500)
            
            # Booking
            b = Booking(
                farmer_id=farmer.id,
                centre_id=demo_centre.id,
                slot_id=slot.id,
                crop_id=crop.id,
                quantity=qty,
                status="CONFIRMED",
                booking_reference=f"BK-{uuid.uuid4().hex[:8].upper()}"
            )
            session.add(b)
            slot.booked_count += 1
            simulated_bookings.append(b)
            
            # Flush to get booking ID
            await session.flush()
            
            # Queue Token
            # Make 60% of them currently WAITING, 10% PROCESSING, 30% COMPLETED
            rand_val = random.random()
            if rand_val < 0.6:
                status = QueueStatus.WAITING
            elif rand_val < 0.7:
                status = QueueStatus.PROCESSING
            else:
                status = QueueStatus.COMPLETED
                b.status = "COMPLETED"
                
            token = QueueToken(
                booking_id=b.id,
                centre_id=demo_centre.id,
                token_number=token_counter,
                queue_date=today,
                status=status,
                check_in_at=datetime.utcnow() - timedelta(minutes=random.randint(10, 120)) if status != QueueStatus.WAITING else None
            )
            session.add(token)
            token_counter += 1

        await session.commit()
        
        print("--------------------------------------------------")
        print(f"Simulation Complete!")
        print(f"Added 120 live bookings to {demo_centre.name}")
        print(f"Queue populated with active tokens.")
        print("Ready for Management Dashboard Demo.")
        print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(run_simulation())
