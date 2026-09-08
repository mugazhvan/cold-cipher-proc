from typing import Optional
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class BookingBase(BaseModel):
    centre_id: uuid.UUID
    slot_id: uuid.UUID
    crop_id: uuid.UUID
    quantity: float

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    slot_id: Optional[uuid.UUID] = None

from app.schemas.crop import CropResponse, CropTypeResponse

class BookingResponse(BookingBase):
    id: uuid.UUID
    farmer_id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime
    crop: Optional[CropResponse] = None
    crop_type: Optional[CropTypeResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class QRVerifyRequest(BaseModel):
    payload: Optional[str] = None
    qr_data: Optional[str] = None
