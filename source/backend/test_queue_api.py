import asyncio
import uuid
import httpx
from datetime import datetime

async def test_queue():
    async with httpx.AsyncClient() as client:
        # 1. Login to get token via OTP
        res = await client.post("http://localhost:8000/api/v1/auth/otp/send", json={"phone": "9876543210"})
        res = await client.post("http://localhost:8000/api/v1/auth/otp/verify", json={"phone": "9876543210", "otp": "123456"})
        verification_token = res.json()["data"]["verification_token"]
        res = await client.post("http://localhost:8000/api/v1/auth/login", json={"verification_token": verification_token, "role": "FARMER"})
        
        token = res.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get the latest booking
        res = await client.get("http://localhost:8000/api/v1/bookings", headers=headers)
        bookings = res.json()["data"]["items"]
        if not bookings:
            print("No bookings found")
            return
            
        booking = bookings[0]
        booking_id = booking["id"]
        centre_id = booking["centre_id"]
        print(f"Latest booking ID: {booking_id}")
        
        # 3. Request Token for this booking
        print("\n--- Generating Token ---")
        res = await client.post(f"http://localhost:8000/api/v1/bookings/{booking_id}/token", headers=headers)
        print("Status:", res.status_code)
        print("Response:", res.json())
        
        if res.status_code == 201:
            token_data = res.json()["data"]
            # 4. Get Live Status
            print("\n--- Getting Live Status ---")
            res = await client.get(f"http://localhost:8000/api/v1/centres/{centre_id}/live-status", headers=headers)
            print("Status:", res.status_code)
            print("Response:", res.json())

if __name__ == "__main__":
    asyncio.run(test_queue())
