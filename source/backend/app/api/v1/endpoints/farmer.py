import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud import crud_farmer, crud_crop
from app.models.users import User, UserRole
from app.schemas.auth import StandardResponse
from app.schemas.farmer import FarmerUpdate, FarmerResponse, FarmerCropCreate, FarmerCropResponse, FarmerCropUpdate
from app.api.deps import get_current_user, RoleChecker

router = APIRouter()

@router.get("/profile", response_model=StandardResponse)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    return {
        "success": True,
        "data": FarmerResponse.model_validate(farmer).model_dump(),
        "message": "Profile returned."
    }

@router.patch("/profile", response_model=StandardResponse)
async def update_profile(
    farmer_in: FarmerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    farmer = await crud_farmer.update_farmer(db, db_farmer=farmer, farmer_in=farmer_in)
    return {
        "success": True,
        "data": FarmerResponse.model_validate(farmer).model_dump(),
        "message": "Profile updated."
    }

@router.get("/crops", response_model=StandardResponse)
async def read_farmer_crops(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    farmer_crops = await crud_farmer.get_farmer_crops(db, farmer.id)
    return {
        "success": True,
        "data": [FarmerCropResponse.model_validate(fc).model_dump() for fc in farmer_crops],
        "message": "Farmer crops returned."
    }

@router.post("/crops", response_model=StandardResponse, status_code=201)
async def add_farmer_crop(
    crop_in: FarmerCropCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    # Validation: Verify crop exists
    crop = await crud_crop.get_crop(db, crop_in.crop_id)
    if not crop:
        raise HTTPException(status_code=400, detail="Crop does not exist")
        
    # Validation: Verify crop type exists and belongs to crop
    if crop_in.crop_type_id:
        crop_type = await crud_crop.get_crop_type(db, crop_in.crop_type_id)
        if not crop_type:
            raise HTTPException(status_code=400, detail="Crop type does not exist")
        if crop_type.crop_id != crop_in.crop_id:
            raise HTTPException(status_code=400, detail="Crop type does not belong to the selected crop")
            
    farmer_crop = await crud_farmer.add_farmer_crop(db, farmer_id=farmer.id, crop_in=crop_in)
    return {
        "success": True,
        "data": FarmerCropResponse.model_validate(farmer_crop).model_dump(),
        "message": "Crop added."
    }

@router.patch("/crops/{farmer_crop_id}", response_model=StandardResponse)
async def update_farmer_crop(
    farmer_crop_id: uuid.UUID,
    crop_in: FarmerCropUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    farmer_crop = await crud_farmer.get_farmer_crop(db, farmer_crop_id)
    if not farmer_crop or farmer_crop.farmer_id != farmer.id:
        raise HTTPException(status_code=404, detail="Farmer crop not found")
        
    farmer_crop = await crud_farmer.update_farmer_crop(db, db_farmer_crop=farmer_crop, update_data=crop_in.model_dump(exclude_unset=True))
    return {
        "success": True,
        "data": FarmerCropResponse.model_validate(farmer_crop).model_dump(),
        "message": "Crop updated."
    }

@router.delete("/crops/{farmer_crop_id}", response_model=StandardResponse)
async def delete_farmer_crop(
    farmer_crop_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.FARMER]))
) -> Any:
    farmer = await crud_farmer.get_farmer_by_user(db, current_user.id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    farmer_crop = await crud_farmer.get_farmer_crop(db, farmer_crop_id)
    if not farmer_crop or farmer_crop.farmer_id != farmer.id:
        raise HTTPException(status_code=404, detail="Farmer crop not found")
        
    await crud_farmer.delete_farmer_crop(db, db_farmer_crop=farmer_crop)
    return {
        "success": True,
        "data": None,
        "message": "Crop removed."
    }
