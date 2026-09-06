import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.entities import CropCategory, Crop, CropType

async def get_crop_categories(db: AsyncSession, active_only: bool = True) -> List[CropCategory]:
    stmt = select(CropCategory)
    if active_only:
        stmt = stmt.where(CropCategory.active == True)
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_crops(db: AsyncSession, category_id: Optional[uuid.UUID] = None, active_only: bool = True) -> List[Crop]:
    stmt = select(Crop).options(selectinload(Crop.category), selectinload(Crop.crop_types))
    if active_only:
        stmt = stmt.where(Crop.active == True)
    if category_id:
        stmt = stmt.where(Crop.category_id == category_id)
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_crop(db: AsyncSession, crop_id: uuid.UUID) -> Optional[Crop]:
    stmt = select(Crop).options(selectinload(Crop.category), selectinload(Crop.crop_types)).where(Crop.id == crop_id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def get_crop_types(db: AsyncSession, crop_id: uuid.UUID, active_only: bool = True) -> List[CropType]:
    stmt = select(CropType).where(CropType.crop_id == crop_id)
    if active_only:
        stmt = stmt.where(CropType.active == True)
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_crop_type(db: AsyncSession, crop_type_id: uuid.UUID) -> Optional[CropType]:
    stmt = select(CropType).where(CropType.id == crop_type_id)
    result = await db.execute(stmt)
    return result.scalars().first()
