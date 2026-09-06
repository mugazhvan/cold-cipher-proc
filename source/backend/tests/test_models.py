import pytest
from app.models.base import Base

def test_models_import_successfully():
    """
    This test verifies that all models can be imported successfully
    without circular dependencies or syntax errors.
    """
    from app.models import (
        User, UserRole,
        Centre, Farmer, Officer, CropCategory, CropType, Crop, FarmerCrop,
        Slot, Booking, QueueToken, QueueEvent,
        Procurement, Payment, CentreCapacity,
        ProcessingHistory, WaitTimeHistory, CentreMetric, Prediction,
        Notification, AuditLog
    )

    # Check that all tables are registered in the metadata
    table_names = list(Base.metadata.tables.keys())
    
    assert "users" in table_names
    assert "centres" in table_names
    assert "farmers" in table_names
    assert "officers" in table_names
    assert "crop_categories" in table_names
    assert "crop_types" in table_names
    assert "crops" in table_names
    assert "farmer_crops" in table_names
    assert "slots" in table_names
    assert "bookings" in table_names
    assert "queue_tokens" in table_names
    assert "queue_events" in table_names
    assert "procurements" in table_names
    assert "payments" in table_names
    assert "centre_capacity" in table_names
    assert "processing_history" in table_names
    assert "wait_time_history" in table_names
    assert "centre_metrics" in table_names
    assert "predictions" in table_names
    assert "notifications" in table_names
    assert "audit_logs" in table_names
