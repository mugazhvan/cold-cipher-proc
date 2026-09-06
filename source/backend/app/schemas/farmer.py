from typing import Optional, List
from pydantic import BaseModel, ConfigDict
import uuid

class FarmerBase(BaseModel):
    name: str
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

class FarmerResponse(FarmerBase):
    id: uuid.UUID
    farmer_code: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

from app.schemas.crop import CropResponse, CropTypeResponse

class FarmerCropCreate(BaseModel):
    crop_id: uuid.UUID
    crop_type_id: Optional[uuid.UUID] = None
    season: str
    quantity: float
    unit: str

class FarmerCropUpdate(BaseModel):
    season: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None

class FarmerCropResponse(FarmerCropCreate):
    id: uuid.UUID
    crop: Optional[CropResponse] = None
    crop_type: Optional[CropTypeResponse] = None
    
    model_config = ConfigDict(from_attributes=True)
