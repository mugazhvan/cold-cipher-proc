import asyncio
from app.core.database import AsyncSessionLocal
from app.models.entities import Farmer, Centre, Crop
from app.models.users import User, UserRole
from app.models.booking import Booking, Slot, BookingStatus
from app.core.security import create_access_token
from sqlalchemy.future import select
import uuid

async def main():
    async with AsyncSessionLocal() as db:
        # Create or find farmer 8888888888
        res = await db.execute(select(User).where(User.phone == "8888888888"))
        user = res.scalars().first()
        
        if not user:
            user = User(phone="8888888888", role=UserRole.FARMER, is_active=True)
            db.add(user)
            await db.flush()
            
            farmer = Farmer(user_id=user.id, name="Demo Farmer")
            db.add(farmer)
            await db.flush()
        else:
            res_f = await db.execute(select(Farmer).where(Farmer.user_id == user.id))
            farmer = res_f.scalars().first()

        res_c = await db.execute(select(Centre).limit(1))
        centre = res_c.scalars().first()
        
        res_crop = await db.execute(select(Crop).limit(1))
        crop = res_crop.scalars().first()
        
        res_slot = await db.execute(select(Slot).limit(1))
        slot = res_slot.scalars().first()
        
        if not (centre and crop and slot):
            print("Missing seed data (centre, crop, slot). Run seed_basic.py first.")
            return

        booking_ref = f"KF-DEMO-{str(uuid.uuid4().int)[:6]}"
        booking = Booking(
            farmer_id=farmer.id,
            centre_id=centre.id,
            slot_id=slot.id,
            crop_id=crop.id,
            quantity=50.0,
            status=BookingStatus.CONFIRMED,
            booking_reference=booking_ref
        )
        db.add(booking)
        await db.commit()
        
        jwt_token = create_access_token(user.id)
        
        print("\n=== KISANFLOW E-PASS DEMO CREDENTIALS ===")
        print(f"1. Login as Farmer (Phone: {user.phone})")
        print(f"2. LocalStorage JWT Token: {jwt_token}")
        print(f"3. Booking Reference (Token Number): {booking_ref}")
        print("=========================================\n")
        print("To test in UI:")
        print("1. Open the Farmer app.")
        print(f"2. Run in browser console: localStorage.setItem('kisanflow_token', '{jwt_token}')")
        print("3. Click 'Download Official PDF' in the modal.")

if __name__ == "__main__":
    asyncio.run(main())
