import uuid
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.entities import Centre

async def get_centre(db: AsyncSession, centre_id: uuid.UUID) -> Optional[Centre]:
    result = await db.execute(select(Centre).where(Centre.id == centre_id))
    return result.scalars().first()

async def get_centres(
    db: AsyncSession, skip: int = 0, limit: int = 20, district: Optional[str] = None, state: Optional[str] = None
) -> Tuple[List[Centre], int]:
    query = select(Centre)
    if district:
        query = query.where(Centre.district.ilike(f"%{district}%"))
    if state:
        query = query.where(Centre.state.ilike(f"%{state}%"))
        
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return items, total
