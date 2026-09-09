from typing import Optional
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class ProcurementBase(BaseModel):
    gross_weight: Optional[float] = None
    tare_weight: Optional[float] = None
    net_weight: Optional[float] = None
    quality_status: Optional[str] = None
    quality_remarks: Optional[str] = None
    status: str

class WeighingCreate(BaseModel):
    gross_weight: float
    tare_weight: float

class QualityCreate(BaseModel):
    quality_status: str
    quality_remarks: Optional[str] = None

class ProcurementUpdate(BaseModel):
    gross_weight: Optional[float] = None
    tare_weight: Optional[float] = None
    net_weight: Optional[float] = None
    quality_status: Optional[str] = None
    quality_remarks: Optional[str] = None
    status: Optional[str] = None

class ProcurementResponse(ProcurementBase):
    id: uuid.UUID
    booking_id: uuid.UUID
    centre_id: uuid.UUID
    procurement_completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
