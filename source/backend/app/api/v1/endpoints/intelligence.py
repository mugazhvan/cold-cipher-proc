import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import StandardResponse
from app.schemas.intelligence import (
    WaitTimePredictionResponse,
    CongestionPredictionResponse,
    SlotRecommendationRequest,
    SlotRecommendationResponse
)
from app.intelligence import predictions
from app.api.deps import get_current_user
from app.models.users import User

router = APIRouter()

@router.get("/wait-time/{centre_id}", response_model=StandardResponse)
async def get_wait_time(
    centre_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    prediction = await predictions.predict_wait_time(db, centre_id)
    return {
        "success": True,
        "data": prediction.model_dump(),
        "message": "Wait time prediction returned."
    }

@router.get("/congestion/{centre_id}/{date}", response_model=StandardResponse)
async def get_congestion(
    centre_id: uuid.UUID,
    date: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    prediction = await predictions.predict_congestion(db, centre_id, date)
    return {
        "success": True,
        "data": prediction.model_dump(),
        "message": "Congestion prediction returned."
    }

@router.post("/recommend-slots", response_model=StandardResponse)
async def recommend_slots(
    request: SlotRecommendationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    recs = await predictions.recommend_slots(
        db, request.centre_id, request.crop_id, request.quantity_kg, request.preferred_date
    )
    
    return {
        "success": True,
        "data": SlotRecommendationResponse(recommended_slots=recs).model_dump(),
        "message": "Slot recommendations returned."
    }
