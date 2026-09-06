import asyncio
import httpx
import uuid
import sys
from datetime import datetime, time

from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.entities import Farmer, Centre, Crop, Officer
from app.models.booking import Booking, Slot

import os
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:password@localhost:5432/kisanflow"

BASE_URL = "http://localhost:8000/api/v1"

async def login(client, phone, role):
    res = await client.post(f"{BASE_URL}/auth/otp/send", json={"phone": phone})
    res.raise_for_status()
    res = await client.post(f"{BASE_URL}/auth/otp/verify", json={"phone": phone, "otp": "123456"})
    res.raise_for_status()
    v_token = res.json()["data"]["verification_token"]
    res = await client.post(f"{BASE_URL}/auth/login", json={"verification_token": v_token, "role": role})
    res.raise_for_status()
    return res.json()["data"]["access_token"], res.json()["data"]["user"]["id"]

async def run_tests():
    report = []
    def add_res(title, status, expected, actual):
        report.append(f"{title}: {'PASSED' if expected == actual else 'FAILED'} (Expected: {expected}, Actual: {actual})")
        print(report[-1])

    async with AsyncSessionLocal() as db:
        centres = (await db.execute(select(Centre))).scalars().all()
        crops = (await db.execute(select(Crop))).scalars().all()
        if len(centres) < 2:
            print("Creating second centre...")
            centre_b = Centre(name="Test Centre 2", code="TC2", opening_time=time(8,0), closing_time=time(18,0))
            db.add(centre_b)
            await db.commit()
            await db.refresh(centre_b)
            centres.append(centre_b)
            
        if len(crops) < 2:
            print("Creating second crop...")
            crop_b = Crop(name="Test Crop 2", code="TCROP2", unit="kg")
            db.add(crop_b)
            await db.commit()
            await db.refresh(crop_b)
            crops.append(crop_b)
            
        centre_a, centre_b = centres[0], centres[1]
        crop_a, crop_b = crops[0], crops[1]
        
        today = datetime.utcnow().date()
        s_a = Slot(centre_id=centre_a.id, crop_id=crop_a.id, slot_date=today, start_time=time(8, 0), end_time=time(10, 0), capacity=1, booked_count=0, status="OPEN")
        s_b = Slot(centre_id=centre_b.id, crop_id=crop_b.id, slot_date=today, start_time=time(8, 0), end_time=time(10, 0), capacity=100, booked_count=0, status="OPEN")
        db.add_all([s_a, s_b])
        await db.commit()
        await db.refresh(s_a)
        await db.refresh(s_b)

        async with httpx.AsyncClient() as client:
            t_fA, u_fA = await login(client, "+919999999991", "FARMER")
            t_fB, u_fB = await login(client, "+919999999992", "FARMER")
            t_opA, u_opA = await login(client, "+918888888881", "CENTRE_OPERATOR")
            t_opB, u_opB = await login(client, "+918888888882", "CENTRE_OPERATOR")
            t_admin, u_admin = await login(client, "+917777777771", "ADMIN")
            
            for uid, c_id, name in [(u_opA, centre_a.id, "OpA"), (u_opB, centre_b.id, "OpB")]:
                officer = (await db.execute(select(Officer).where(Officer.user_id == uid))).scalars().first()
                if not officer:
                    db.add(Officer(user_id=uid, name=name, centre_id=c_id))
                else:
                    officer.centre_id = c_id
            await db.commit()
            
            headers_fA = {"Authorization": f"Bearer {t_fA}"}
            headers_fB = {"Authorization": f"Bearer {t_fB}"}
            headers_opA = {"Authorization": f"Bearer {t_opA}"}
            headers_opB = {"Authorization": f"Bearer {t_opB}"}
            headers_admin = {"Authorization": f"Bearer {t_admin}"}
            
            print("\n--- 1. FARMER IDOR ---")
            res = await client.post(f"{BASE_URL}/bookings", headers=headers_fA, json={"slot_id": str(s_b.id), "centre_id": str(centre_b.id), "crop_id": str(crop_b.id), "quantity": 10})
            if res.status_code != 201:
                print("Failed to create booking:", res.status_code, res.text)
            booking_a = res.json()["data"]["id"]
            
            res = await client.post(f"{BASE_URL}/bookings/{booking_a}/token", headers=headers_fB)
            add_res("IDOR: Generate Token", res.status_code, 403, res.status_code)
            
            res = await client.post(f"{BASE_URL}/bookings/{booking_a}/token", headers=headers_fA)
            if res.status_code != 201:
                print("Failed to generate token:", res.text)
                token_a_id = "fake_token_id"
            else:
                token_a_id = res.json()["data"]["id"]
            
            res = await client.get(f"{BASE_URL}/bookings/{booking_a}/token", headers=headers_fB)
            add_res("IDOR: View Token", res.status_code, 404, res.status_code)
            
            res = await client.post(f"{BASE_URL}/tokens/{token_a_id}/check-in", headers=headers_fB)
            add_res("IDOR: Check-in Token", res.status_code, 403, res.status_code)

            print("\n--- 2. OPERATOR CENTRE ISOLATION ---")
            res = await client.get(f"{BASE_URL}/management/centres/{centre_b.id}/slots", headers=headers_opA)
            add_res("Isolation: Get Slots (OpA on Centre B)", res.status_code, 403, res.status_code)
            
            res = await client.post(f"{BASE_URL}/management/queue/{token_a_id}/call", headers=headers_opA)
            add_res("Isolation: Call Token (OpA on Token B)", res.status_code, 403, res.status_code)
            
            res = await client.post(f"{BASE_URL}/management/queue/{token_a_id}/call", headers=headers_opB)
            add_res("Isolation: Allowed Operator (OpB on Token B)", res.status_code, 200, res.status_code)
            
            res = await client.get(f"{BASE_URL}/management/centres/{centre_b.id}/slots", headers=headers_admin)
            add_res("Isolation: Admin bypass", res.status_code, 200, res.status_code)
            
            print("\n--- 3. BOOKING DATA INTEGRITY ---")
            res = await client.post(f"{BASE_URL}/bookings", headers=headers_fA, json={"slot_id": str(s_b.id), "centre_id": str(centre_a.id), "crop_id": str(crop_b.id), "quantity": 10})
            add_res("Integrity: Mismatched Centre", res.status_code, 400, res.status_code)
            
            res = await client.post(f"{BASE_URL}/bookings", headers=headers_fA, json={"slot_id": str(s_b.id), "centre_id": str(centre_b.id), "crop_id": str(crop_a.id), "quantity": 10})
            add_res("Integrity: Mismatched Crop", res.status_code, 400, res.status_code)
            
            print("\n--- 8. REAL CONCURRENCY TEST ---")
            payload = {"slot_id": str(s_a.id), "centre_id": str(centre_a.id), "crop_id": str(crop_a.id), "quantity": 1, "vehicle_type": "Tractor Trolley", "vehicle_number": "PB11"}
            reqs = [client.post(f"{BASE_URL}/bookings", headers=headers_fA, json=payload) for _ in range(20)]
            results = await asyncio.gather(*reqs)
            successes = len([r for r in results if r.status_code == 201])
            failures = len([r for r in results if r.status_code == 400])
            add_res("Concurrency: 20 reqs, capacity 1", successes, 1, successes)
            print(f"20 requests -> {successes} created, {failures} rejected.")
            
            await db.refresh(s_a)
            add_res("Concurrency: Booked Count", s_a.booked_count, 1, s_a.booked_count)

            print("\n--- 5. SLOT RECOMMENDATION CONTRACT ---")
            res = await client.post(f"{BASE_URL}/intelligence/recommend-slots", headers=headers_fA, json={
                "centre_id": str(centre_b.id), "crop_id": str(crop_b.id), "quantity_kg": 100, "preferred_date": str(today)
            })
            add_res("Recommendation API", res.status_code, 200, res.status_code)
            if res.status_code == 200:
                print("Response data type for recommended_slots:", type(res.json()["data"]["recommended_slots"]))

if __name__ == "__main__":
    asyncio.run(run_tests())
