from typing import Optional, List
from pydantic import BaseModel, ConfigDict
import uuid

class CropCategoryBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    active: bool = True

class CropCategoryResponse(CropCategoryBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class CropTypeBase(BaseModel):
    name: str
    code: str
    type_kind: Optional[str] = None
    description: Optional[str] = None
    active: bool = True

class CropTypeResponse(CropTypeBase):
    id: uuid.UUID
    crop_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class CropBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    unit: str
    active: bool = True

class CropResponse(CropBase):
    id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    model_config = ConfigDict(from_attributes=True)

class CropResponseWithDetails(CropResponse):
    category: Optional[CropCategoryResponse] = None
    crop_types: List[CropTypeResponse] = []
