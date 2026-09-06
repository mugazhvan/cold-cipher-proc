import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_crop_categories(client: AsyncClient):
    response = await client.get("/api/v1/crops/categories")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert len(data["data"]) >= 4 # We seeded 4 categories
    assert any(c["code"] == "CAT_CEREALS" for c in data["data"])

@pytest.mark.asyncio
@pytest.mark.skip(reason="asyncpg connection pooling issue across tests")
async def test_get_crops(client: AsyncClient):
    response = await client.get("/api/v1/crops")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert len(data["data"]) > 0
    assert any(c["code"] == "PADDY" for c in data["data"])

@pytest.mark.asyncio
@pytest.mark.skip(reason="asyncpg connection pooling issue across tests")
async def test_get_crop_details(client: AsyncClient):
    # First get a crop to find its ID
    response = await client.get("/api/v1/crops")
    crops = response.json()["data"]
    paddy_id = next(c["id"] for c in crops if c["code"] == "PADDY")
    
    response = await client.get(f"/api/v1/crops/{paddy_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["data"]["code"] == "PADDY"
    
@pytest.mark.asyncio
@pytest.mark.skip(reason="asyncpg connection pooling issue across tests")
async def test_get_crop_types(client: AsyncClient):
    response = await client.get("/api/v1/crops")
    crops = response.json()["data"]
    paddy_id = next(c["id"] for c in crops if c["code"] == "PADDY")
    
    response = await client.get(f"/api/v1/crops/{paddy_id}/types")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert len(data["data"]) > 0
    assert any(ct["code"] == "PADDY_COMMON" for ct in data["data"])
