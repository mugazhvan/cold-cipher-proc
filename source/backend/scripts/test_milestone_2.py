import asyncio
import httpx
import uuid
from datetime import datetime, date, time

BASE_URL = "http://localhost:8000/api/v1"

async def test_qr_verification():
    async with httpx.AsyncClient(timeout=10.0) as client:
        async def login(phone, role):
            res = await client.post(f"{BASE_URL}/auth/otp/send", json={"phone": phone})
            res.raise_for_status()
            res = await client.post(f"{BASE_URL}/auth/otp/verify", json={"phone": phone, "otp": "123456"})
            res.raise_for_status()
            v_token = res.json()["data"]["verification_token"]
            res = await client.post(f"{BASE_URL}/auth/login", json={"verification_token": v_token, "role": role})
            res.raise_for_status()
            return {"Authorization": f"Bearer {res.json()['data']['access_token']}"}, res.json()['data']['user']['id']

        # Login Admin
        headers_admin, _ = await login("9999999999", "ADMIN")

        # Login Farmers
        headers_fA, _ = await login("9876543210", "FARMER")
        
        # Get centres and crops
        centres = (await client.get(f"{BASE_URL}/centres", headers=headers_admin)).json()["data"]
        crops = (await client.get(f"{BASE_URL}/crops", headers=headers_admin)).json()["data"]
        centre_a = centres['items'][0]
        centre_b = centres['items'][1]
        crop_a = crops[0]

        # Login Operators
        headers_opA, uidA = await login("5555555551", "CENTRE_OPERATOR")
        headers_opB, uidB = await login("5555555552", "CENTRE_OPERATOR")

        import os
        os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:password@db:5432/kisanflow"
        from app.core.database import AsyncSessionLocal
        from app.models.entities import Officer
        from sqlalchemy.future import select

        async with AsyncSessionLocal() as db:
            for uid, c_id in [(uidA, centre_a['id']), (uidB, centre_b['id'])]:
                officer = (await db.execute(select(Officer).where(Officer.user_id == uid))).scalars().first()
                if not officer:
                    db.add(Officer(user_id=uid, name="Op", centre_id=c_id))
                else:
                    officer.centre_id = c_id
            await db.commit()

        # Create slots
        d = str(date.today())
        s1 = await client.post(f"{BASE_URL}/management/centres/{centre_a['id']}/slots", headers=headers_admin, json={
            "crop_id": crop_a["id"], "slot_date": d, "start_time": "08:00", "end_time": "10:00", "capacity": 10, "status": "OPEN"
        })
        s1_id = s1.json()["data"]["id"]

        s2 = await client.post(f"{BASE_URL}/management/centres/{centre_b['id']}/slots", headers=headers_admin, json={
            "crop_id": crop_a["id"], "slot_date": d, "start_time": "08:00", "end_time": "10:00", "capacity": 10, "status": "OPEN"
        })
        s2_id = s2.json()["data"]["id"]

        # Book for Farmer A in Centre A
        b1 = await client.post(f"{BASE_URL}/bookings", headers=headers_fA, json={
            "slot_id": s1_id, "centre_id": centre_a['id'], "crop_id": crop_a['id'], "quantity": 10
        })
        b1_id = b1.json()["data"]["id"]
        
        # Book for Farmer A in Centre B
        b2 = await client.post(f"{BASE_URL}/bookings", headers=headers_fA, json={
            "slot_id": s2_id, "centre_id": centre_b['id'], "crop_id": crop_a['id'], "quantity": 10
        })
        b2_id = b2.json()["data"]["id"]

        print(f"\nCreated Bookings:\n B1(Centre A) = {b1_id}\n B2(Centre B) = {b2_id}")

        print("\n--- 1. TEST INVALID/MALFORMED QR ---")
        res = await client.post(f"{BASE_URL}/management/qr/verify", headers=headers_opA, json={"payload": "invalid-qr"})
        print(f"Invalid QR (Expected 401): {res.status_code}")

        res = await client.post(f"{BASE_URL}/management/qr/verify", headers=headers_opA, json={"payload": "KISANFLOW://TOKEN/not-a-uuid/extra"})
        print(f"Malformed UUID QR (Expected 401): {res.status_code}")

        print("\n--- 2. TEST WRONG CENTRE (UNAUTHORIZED OPERATOR) ---")
        # Op A (assigned to Centre A) tries to scan B2 (Centre B)
        res = await client.post(f"{BASE_URL}/management/qr/verify", headers=headers_opA, json={"payload": b2_id})
        print(f"Wrong Centre (Expected 403): {res.status_code} - {res.text}")

        print("\n--- 3. TEST VALID QR ---")
        # Op A scans B1
        res = await client.post(f"{BASE_URL}/management/qr/verify", headers=headers_opA, json={"payload": f"KISANFLOW://TOKEN/{b1_id}/PB-123"})
        print(f"Valid QR (Expected 200): {res.status_code} - {res.text}")

        print("\n--- 4. TEST ALREADY VERIFIED ---")
        # Op A scans B1 again
        res = await client.post(f"{BASE_URL}/management/qr/verify", headers=headers_opA, json={"payload": b1_id})
        print(f"Duplicate Scan (Expected 409): {res.status_code} - {res.text}")

if __name__ == "__main__":
    asyncio.run(test_qr_verification())
