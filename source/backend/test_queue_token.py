import requests

# 1. Login to get token
login_data = {
    "username": "9876543210", # Farmer
    "password": "password123"
}
res = requests.post("http://localhost:8000/api/v1/auth/login", data=login_data)
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get the latest booking
res = requests.get("http://localhost:8000/api/v1/bookings", headers=headers)
bookings = res.json()["data"]["items"]
if not bookings:
    print("No bookings found")
    exit()

booking_id = bookings[0]["id"]
print(f"Latest booking ID: {booking_id}")

# 3. Request Token for this booking
res = requests.post(f"http://localhost:8000/api/v1/bookings/{booking_id}/token", headers=headers)
print(res.status_code)
print(res.json())
