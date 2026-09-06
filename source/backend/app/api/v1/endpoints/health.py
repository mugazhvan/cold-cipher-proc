from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    api_prefix: str


@router.get("/health", response_model=HealthResponse)
async def check_health():
    return {
        "status": "healthy",
        "service": "kisanflow-backend",
        "version": "0.1.0",
        "api_prefix": "/api/v1"
    }
