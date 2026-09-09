import asyncio
import httpx

async def book_slot(client, token, slot_id, quantity):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "mandi_id": 1,
        "crop_id": 1,
        "slot_id": slot_id,
        "vehicle_number": "PB-10-XX-1234",
        "quantity_quintals": quantity
    }
    response = await client.post("http://localhost:8000/api/v1/bookings", json=data, headers=headers)
    return response.status_code, response.json()

async def main():
    async with httpx.AsyncClient() as client:
        # Get tokens for multiple farmers
        tokens = []
        for phone in ["8888888888", "7777777777", "6666666666", "5555555555"]:
            # 1. Send OTP
            await client.post("http://localhost:8000/api/v1/auth/otp/send", json={"phone": phone})
            # 2. Verify OTP
            verify_resp = await client.post("http://localhost:8000/api/v1/auth/otp/verify", json={"phone": phone, "otp": "123456"})
            if verify_resp.status_code == 200:
                v_token = verify_resp.json()["data"]["verification_token"]
                # 3. Login
                login_resp = await client.post("http://localhost:8000/api/v1/auth/login", json={"verification_token": v_token, "role": "FARMER"})
                if login_resp.status_code == 200:
                    tokens.append(login_resp.json()["data"]["access_token"])
        
        if not tokens:
            print("Failed to get tokens")
            return

        print(f"Got {len(tokens)} tokens.")

        # Find a slot with capacity
        headers = {"Authorization": f"Bearer {tokens[0]}"}
        resp = await client.get("http://localhost:8000/api/v1/intelligence/recommend-slots?mandi_id=1&crop_id=1&quantity_quintals=50", headers=headers)
        res_json = resp.json()
        if "data" in res_json:
            slots = res_json["data"]
        else:
            slots = res_json
            
        if not slots:
            print("No slots found")
            return
            
        # Target the first slot.
        slot_id = slots[0]["slot_id"]
        print(f"Targeting slot {slot_id} which has capacity {slots[0].get('available_capacity', 'unknown')}")

        # Hammer the endpoint concurrently. 
        # The default DB capacity seeded is 20000.
        # So we request 10000 * 4 = 40000 to trigger overbooking failure (2 success, 2 failures).
        tasks = [book_slot(client, token, slot_id, 10000) for token in tokens] 
        results = await asyncio.gather(*tasks)
        
        successes = 0
        conflicts = 0
        for status, data in results:
            print(f"Status: {status}, Response: {data}")
            if status == 200 or status == 201:
                successes += 1
            elif status == 409:
                conflicts += 1

        print(f"\nResults: {successes} successful bookings, {conflicts} conflicts prevented by M6 constraints.")

if __name__ == "__main__":
    asyncio.run(main())
