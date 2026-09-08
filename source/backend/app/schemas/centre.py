from typing import Optional
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import time

class CentreBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    status: str

class CentreCreate(CentreBase):
    pass

class CentreResponse(CentreBase):
    id: uuid.UUID
    current_load: Optional[float] = 0
    daily_capacity_kg: Optional[float] = 50000
    estimated_wait_minutes: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)
