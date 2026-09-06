from typing import Any, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud import crud_crop
from app.schemas.auth import StandardResponse
from app.schemas.crop import CropCategoryResponse, CropResponseWithDetails, CropTypeResponse

router = APIRouter()

@router.get("/categories", response_model=StandardResponse)
async def get_crop_categories(
    db: AsyncSession = Depends(get_db)
) -> Any:
    categories = await crud_crop.get_crop_categories(db)
    return {
        "success": True,
        "data": [CropCategoryResponse.model_validate(c).model_dump() for c in categories],
        "message": "Crop categories returned."
    }

@router.get("", response_model=StandardResponse)
async def get_crops(
    category_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> Any:
    crops = await crud_crop.get_crops(db, category_id=category_id)
    return {
        "success": True,
        "data": [CropResponseWithDetails.model_validate(c).model_dump() for c in crops],
        "message": "Crops returned."
    }

@router.get("/{crop_id}", response_model=StandardResponse)
async def get_crop_details(
    crop_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    crop = await crud_crop.get_crop(db, crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
        
    return {
        "success": True,
        "data": CropResponseWithDetails.model_validate(crop).model_dump(),
        "message": "Crop details returned."
    }

@router.get("/{crop_id}/types", response_model=StandardResponse)
async def get_crop_types(
    crop_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    crop_types = await crud_crop.get_crop_types(db, crop_id)
    return {
        "success": True,
        "data": [CropTypeResponse.model_validate(ct).model_dump() for ct in crop_types],
        "message": "Crop types returned."
    }
