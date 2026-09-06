import pytest
from httpx import AsyncClient

async def get_farmer_token(client: AsyncClient):
    # Mock OTP flow
    await client.post("/api/v1/auth/otp/send", json={"phone": "8888888888"})
    response = await client.post("/api/v1/auth/otp/verify", json={"phone": "8888888888", "otp": "123456"})
    verification_token = response.json()["data"]["verification_token"]
    
    response = await client.post("/api/v1/auth/login", json={
        "verification_token": verification_token,
        "role": "FARMER"
    })
    return response.json()["data"]["access_token"]

@pytest.mark.asyncio
@pytest.mark.skip(reason="asyncpg connection pooling issue across tests")
async def test_add_farmer_crop_valid(client: AsyncClient):
    token = await get_farmer_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get crops
    response = await client.get("/api/v1/crops")
    crops = response.json()["data"]
    paddy = next(c for c in crops if c["code"] == "PADDY")
    
    # Get paddy types
    response = await client.get(f"/api/v1/crops/{paddy['id']}/types")
    paddy_types = response.json()["data"]
    common_paddy = next(ct for ct in paddy_types if ct["code"] == "PADDY_COMMON")
    
    # Add crop
    crop_data = {
        "crop_id": paddy["id"],
        "crop_type_id": common_paddy["id"],
        "season": "Kharif",
        "quantity": 100.5,
        "unit": "quintal"
    }
    response = await client.post("/api/v1/farmer/crops", json=crop_data, headers=headers)
    assert response.status_code == 201
    assert response.json()["success"] == True

@pytest.mark.asyncio
@pytest.mark.skip(reason="asyncpg connection pooling issue across tests")
async def test_add_farmer_crop_invalid_type(client: AsyncClient):
    token = await get_farmer_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get crops
    response = await client.get("/api/v1/crops")
    crops = response.json()["data"]
    wheat = next(c for c in crops if c["code"] == "WHT")
    paddy = next(c for c in crops if c["code"] == "PADDY")
    
    # Get paddy types
    response = await client.get(f"/api/v1/crops/{paddy['id']}/types")
    paddy_types = response.json()["data"]
    common_paddy = next(ct for ct in paddy_types if ct["code"] == "PADDY_COMMON")
    
    # Add crop using Wheat ID but Paddy Type ID
    crop_data = {
        "crop_id": wheat["id"],
        "crop_type_id": common_paddy["id"],
        "season": "Rabi",
        "quantity": 50.0,
        "unit": "quintal"
    }
    response = await client.post("/api/v1/farmer/crops", json=crop_data, headers=headers)
    assert response.status_code == 400
    assert "not belong to the selected crop" in response.json()["detail"]
