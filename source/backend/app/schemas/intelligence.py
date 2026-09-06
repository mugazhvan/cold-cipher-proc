from typing import List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

class WaitTimePredictionResponse(BaseModel):
    centre_id: uuid.UUID
    predicted_wait_minutes: int
    confidence_score: float
    factors: List[str]

class CongestionPredictionResponse(BaseModel):
    centre_id: uuid.UUID
    date: str
    congestion_level: str  # LOW, MEDIUM, HIGH
    predicted_load_kg: float
    expected_queue_length: int
    explanation: str

class SlotRecommendationRequest(BaseModel):
    centre_id: uuid.UUID
    crop_id: uuid.UUID
    quantity_kg: float
    preferred_date: str

class RecommendedSlot(BaseModel):
    slot_id: uuid.UUID
    date: str
    start_time: str
    end_time: str
    estimated_wait_minutes: int
    congestion_level: str
    reason: str

class SlotRecommendationResponse(BaseModel):
    recommended_slots: List[RecommendedSlot]
