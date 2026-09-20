import uuid
import math
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud import crud_centre, crud_booking
from app.schemas.auth import StandardResponse
from app.schemas.centre import CentreResponse
from app.schemas.booking import BookingResponse
from app.schemas.slot import SlotResponse
from app.api.deps import get_current_user, RoleChecker, verify_centre_access
from app.models.users import UserRole, User
from app.models.booking import Slot
from sqlalchemy import select, func, String
from sqlalchemy.orm import selectinload

router = APIRouter()

def calculate_haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth's radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

# Default coordinates for known regional procurement centres in Punjab
DEFAULT_COORDINATES = {
    "PB-LDH-042": (30.8359, 76.1914),  # Samrala
    "PB-LDH-001": (30.7068, 76.2205),  # Khanna
    "PB-LDH-019": (30.8052, 76.0354),  # Doraha
    "PB-LDH-088": (30.8444, 75.9806),  # Sahnewal
    "MDC001": (30.8359, 76.1914),      # Mandi Demo Centre
}

@router.get("", response_model=StandardResponse)
async def read_centres(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    district: Optional[str] = None,
    state: Optional[str] = None,
    current_user = Depends(get_current_user)
) -> Any:
    skip = (page - 1) * limit
    items, total = await crud_centre.get_centres(db, skip=skip, limit=limit, district=district, state=state)
    
    return {
        "success": True,
        "data": {
            "items": [CentreResponse.model_validate(c).model_dump() for c in items],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "has_next": (skip + limit) < total
            }
        },
        "message": "Centres returned."
    }

@router.get("/nearby", response_model=StandardResponse)
async def read_nearby_centres(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Farmer GPS Latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Farmer GPS Longitude"),
    radius_km: float = Query(50.0, ge=1.0, le=500.0, description="Search radius in kilometers"),
    vehicle_type: str = Query("Tractor Trolley", description="Vehicle type for transit estimation"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    """
    Geospatial nearby Mandi discovery using the Haversine formula.
    Computes precise distance, estimated road transit time, queue congestion,
    and Google Maps turn-by-turn navigation URLs.
    """
    items, total = await crud_centre.get_centres(db, skip=0, limit=100)
    
    speed_kmh = 25.0
    if "truck" in vehicle_type.lower():
        speed_kmh = 40.0
    elif "bullock" in vehicle_type.lower():
        speed_kmh = 8.0

    nearby_centres = []
    for c in items:
        lat = float(c.latitude) if c.latitude is not None else None
        lon = float(c.longitude) if c.longitude is not None else None
        
        # Fallback to known coordinates if missing in legacy DB row
        if (lat is None or lon is None) and c.code in DEFAULT_COORDINATES:
            lat, lon = DEFAULT_COORDINATES[c.code]
        elif lat is None or lon is None:
            lat, lon = (30.8359, 76.1914)  # Default Samrala farm region

        dist_km = calculate_haversine_km(latitude, longitude, lat, lon)
        if dist_km <= radius_km:
            transit_mins = max(5, round((dist_km / speed_kmh) * 60))
            dump = CentreResponse.model_validate(c).model_dump()
            dump["latitude"] = lat
            dump["longitude"] = lon
            dump["distance_km"] = dist_km
            dump["transit_minutes"] = transit_mins
            dump["google_maps_url"] = f"https://www.google.com/maps/dir/?api=1&destination={lat},{lon}"
            # Smart composite recommendation score: lower distance & wait time is preferred
            wait_time = dump.get("estimated_wait_minutes") or 20
            dump["recommendation_score"] = round(dist_km * 1.5 + wait_time * 0.8, 1)
            nearby_centres.append(dump)

    # Sort nearest first by default
    nearby_centres.sort(key=lambda x: x["distance_km"])

    return {
        "success": True,
        "data": {
            "origin": {
                "latitude": latitude,
                "longitude": longitude,
                "vehicle_type": vehicle_type,
                "speed_kmh": speed_kmh,
                "radius_km": radius_km,
            },
            "count": len(nearby_centres),
            "items": nearby_centres,
        },
        "message": f"Found {len(nearby_centres)} nearby procurement centres within {radius_km} km."
    }

@router.get("/{centre_id}", response_model=StandardResponse)
async def read_centre(
    centre_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    centre = await crud_centre.get_centre(db, centre_id=centre_id)
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
        
    return {
        "success": True,
        "data": CentreResponse.model_validate(centre).model_dump(),
        "message": "Centre returned."
    }

@router.get("/{centre_id}/slots", response_model=StandardResponse)
async def read_centre_slots(
    centre_id: uuid.UUID,
    date: Optional[str] = Query(None),
    crop_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    # Farmers and general public can view slots for a centre
    stmt = select(Slot).where(Slot.centre_id == centre_id).options(selectinload(Slot.crop))
    if date:
        stmt = stmt.where(func.cast(Slot.slot_date, String) == str(date))
    if crop_id:
        stmt = stmt.where(Slot.crop_id == crop_id)
        
    stmt = stmt.order_by(Slot.slot_date.asc(), Slot.start_time.asc())
    result = await db.execute(stmt)
    slots = result.scalars().all()
    
    return {
        "success": True,
        "data": [SlotResponse.from_slot(s).model_dump() for s in slots],
        "message": "Centre slots returned."
    }

@router.get("/{centre_id}/bookings", response_model=StandardResponse)
async def read_centre_bookings(
    centre_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(RoleChecker([UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER, UserRole.ADMIN]))
) -> Any:
    # Verify the user has access to this centre
    await verify_centre_access(db, current_user, centre_id)
    
    bookings, total = await crud_booking.get_bookings_for_centre(db, centre_id=centre_id, skip=skip, limit=limit)
    
    return {
        "success": True,
        "data": {
            "items": [BookingResponse.from_booking(b).model_dump() for b in bookings],
            "total": total
        },
        "message": "Centre bookings returned."
    }
