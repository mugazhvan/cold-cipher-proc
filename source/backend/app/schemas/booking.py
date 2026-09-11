from typing import Optional, Any
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
    booking_reference: Optional[str] = None
    farmer_id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime
    crop: Optional[CropResponse] = None
    crop_type: Optional[CropTypeResponse] = None
    farmer_name: Optional[str] = None
    village: Optional[str] = None
    farmer_phone: Optional[str] = None
    slot_date: Optional[str] = None
    slot_time: Optional[str] = None
    centre_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_booking(cls, booking: Any) -> "BookingResponse":
        f_name = None
        f_village = None
        f_phone = None
        if getattr(booking, 'farmer', None):
            f_name = booking.farmer.name
            f_village = booking.farmer.village
            if getattr(booking.farmer, 'user', None):
                f_phone = booking.farmer.user.phone

        c_name = booking.centre.name if getattr(booking, 'centre', None) else None
        s_date = str(booking.slot.slot_date) if getattr(booking, 'slot', None) else None
        s_time = None
        if getattr(booking, 'slot', None):
            s_time = f"{booking.slot.start_time.strftime('%I:%M %p')} - {booking.slot.end_time.strftime('%I:%M %p')}"

        stat = booking.status if isinstance(booking.status, str) else getattr(booking.status, 'value', str(booking.status))

        return cls(
            id=booking.id,
            booking_reference=booking.booking_reference,
            centre_id=booking.centre_id,
            slot_id=booking.slot_id,
            crop_id=booking.crop_id,
            quantity=float(booking.quantity),
            farmer_id=booking.farmer_id,
            status=stat,
            created_at=booking.created_at,
            updated_at=booking.updated_at,
            crop=CropResponse.model_validate(booking.crop) if getattr(booking, 'crop', None) else None,
            farmer_name=f_name,
            village=f_village,
            farmer_phone=f_phone,
            slot_date=s_date,
            slot_time=s_time,
            centre_name=c_name,
        )

class QRVerifyRequest(BaseModel):
    payload: Optional[str] = None
    qr_data: Optional[str] = None

class ReassignBookingRequest(BaseModel):
    target_slot_id: uuid.UUID
