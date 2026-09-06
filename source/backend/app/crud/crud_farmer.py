import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.entities import Farmer, Crop, FarmerCrop
from app.schemas.farmer import FarmerUpdate, FarmerCropCreate

async def get_farmer_by_user(db: AsyncSession, user_id: uuid.UUID) -> Optional[Farmer]:
    result = await db.execute(select(Farmer).where(Farmer.user_id == user_id))
    return result.scalars().first()

async def update_farmer(db: AsyncSession, db_farmer: Farmer, farmer_in: FarmerUpdate) -> Farmer:
    update_data = farmer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_farmer, field, value)
    db.add(db_farmer)
    await db.commit()
    await db.refresh(db_farmer)
    return db_farmer

async def get_crops(db: AsyncSession) -> List[Crop]:
    # This was the old way; it is superseded by crud_crop.py. But leaving it for backward compatibility.
    result = await db.execute(select(Crop).where(Crop.active == True))
    return result.scalars().all()

from sqlalchemy.orm import selectinload

async def get_farmer_crops(db: AsyncSession, farmer_id: uuid.UUID) -> List[FarmerCrop]:
    stmt = select(FarmerCrop).where(FarmerCrop.farmer_id == farmer_id).options(
        selectinload(FarmerCrop.crop),
        selectinload(FarmerCrop.crop_type)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_farmer_crop(db: AsyncSession, farmer_crop_id: uuid.UUID) -> Optional[FarmerCrop]:
    stmt = select(FarmerCrop).where(FarmerCrop.id == farmer_crop_id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def add_farmer_crop(db: AsyncSession, farmer_id: uuid.UUID, crop_in: FarmerCropCreate) -> FarmerCrop:
    db_farmer_crop = FarmerCrop(
        farmer_id=farmer_id,
        crop_id=crop_in.crop_id,
        crop_type_id=crop_in.crop_type_id,
        season=crop_in.season,
        quantity=crop_in.quantity,
        unit=crop_in.unit
    )
    db.add(db_farmer_crop)
    await db.commit()
    await db.refresh(db_farmer_crop)
    return db_farmer_crop

async def update_farmer_crop(db: AsyncSession, db_farmer_crop: FarmerCrop, update_data: dict) -> FarmerCrop:
    for field, value in update_data.items():
        if value is not None:
            setattr(db_farmer_crop, field, value)
    db.add(db_farmer_crop)
    await db.commit()
    await db.refresh(db_farmer_crop)
    return db_farmer_crop

async def delete_farmer_crop(db: AsyncSession, db_farmer_crop: FarmerCrop):
    await db.delete(db_farmer_crop)
    await db.commit()
