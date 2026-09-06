from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, centres, farmer, bookings, queue, management, intelligence, crops

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(crops.router, prefix="/crops", tags=["Crops"])
api_router.include_router(centres.router, prefix="/centres", tags=["Centres"])
api_router.include_router(farmer.router, prefix="/farmer", tags=["Farmer"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
api_router.include_router(queue.router, tags=["Queue"])
api_router.include_router(management.router, prefix="/management", tags=["Management"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["Intelligence Layer"])
