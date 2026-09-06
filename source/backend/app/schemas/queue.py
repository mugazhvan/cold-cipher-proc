from typing import Optional
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class TokenResponse(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    centre_id: uuid.UUID
    token_number: int
    status: str
    estimated_wait_minutes: Optional[int] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class QueueStatusResponse(BaseModel):
    centre_id: uuid.UUID
    current_serving_token: Optional[int] = None
    total_waiting: int
    average_wait_time_minutes: int
