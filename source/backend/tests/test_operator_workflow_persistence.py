import pytest
import uuid
from datetime import datetime, date, time, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.future import select

from app.main import app
from app.models.users import UserRole, User
from app.models.entities import Farmer, Centre, Crop, Officer
from app.models.booking import Booking, Slot, BookingStatus, SlotStatus
from app.models.queue import QueueToken, QueueStatus
from app.models.operations import Procurement, Payment, ProcurementStatus, PaymentStatus
from app.core.security import create_access_token, create_signed_qr_payload
from app.core.database import AsyncSessionLocal

pytestmark = pytest.mark.asyncio


async def setup_test_environment():
    """Sets up a clean isolated test environment with Centre A, Centre B, Farmer, and Operators."""
    async with AsyncSessionLocal() as db:
        res_crop = await db.execute(select(Crop).limit(1))
        crop = res_crop.scalars().first()
        if not crop:
            crop = Crop(name="Wheat Test", code=f"WH-{uuid.uuid4().hex[:4]}", unit="kg")
            db.add(crop)
            await db.flush()

        centre_a = Centre(
            name="Samrala Test Mandi",
            code=f"SAM-{uuid.uuid4().hex[:6]}",
            opening_time=time(8, 0),
            closing_time=time(18, 0)
        )
        centre_b = Centre(
            name="Khanna Test Mandi",
            code=f"KHA-{uuid.uuid4().hex[:6]}",
            opening_time=time(8, 0),
            closing_time=time(18, 0)
        )
        db.add(centre_a)
        db.add(centre_b)
        await db.flush()

        # Farmer
        f_phone = f"98{uuid.uuid4().hex[:8]}"
        farmer_user = User(phone=f_phone, role=UserRole.FARMER, is_active=True)
        db.add(farmer_user)
        await db.flush()

        farmer = Farmer(user_id=farmer_user.id, name="Balwinder Singh", village="Samrala Khurd")
        db.add(farmer)

        # Operator Centre A
        op_a_phone = f"97{uuid.uuid4().hex[:8]}"
        op_a_user = User(phone=op_a_phone, role=UserRole.CENTRE_OPERATOR, is_active=True)
        db.add(op_a_user)
        await db.flush()

        officer_a = Officer(user_id=op_a_user.id, centre_id=centre_a.id, name="Operator A")
        db.add(officer_a)

        # Operator Centre B
        op_b_phone = f"96{uuid.uuid4().hex[:8]}"
        op_b_user = User(phone=op_b_phone, role=UserRole.CENTRE_OPERATOR, is_active=True)
        db.add(op_b_user)
        await db.flush()

        officer_b = Officer(user_id=op_b_user.id, centre_id=centre_b.id, name="Operator B")
        db.add(officer_b)

        await db.commit()

        token_a = create_access_token(op_a_user.id)
        token_b = create_access_token(op_b_user.id)

        return {
            "centre_a_id": centre_a.id,
            "centre_b_id": centre_b.id,
            "crop_id": crop.id,
            "farmer_id": farmer.id,
            "op_a_token": token_a,
            "op_b_token": token_b,
        }


async def test_slot_database_persistence_across_sessions():
    """Validates that creating, closing, and updating capacity of slots persists across separate DB sessions."""
    env = await setup_test_environment()
    centre_id = env["centre_a_id"]
    crop_id = env["crop_id"]
    slot_date = datetime.now(timezone.utc).date() + timedelta(days=2)

    # Session 1: Create Slot
    async with AsyncSessionLocal() as session1:
        slot = Slot(
            centre_id=centre_id,
            crop_id=crop_id,
            slot_date=slot_date,
            start_time=time(9, 0),
            end_time=time(10, 0),
            capacity=20,
            booked_count=0,
            status=SlotStatus.OPEN
        )
        session1.add(slot)
        await session1.commit()
        slot_id = slot.id

    # Session 2: Read from brand new database session
    async with AsyncSessionLocal() as session2:
        res = await session2.execute(select(Slot).where(Slot.id == slot_id))
        persisted_slot = res.scalars().first()
        assert persisted_slot is not None
        assert persisted_slot.capacity == 20
        assert persisted_slot.status == SlotStatus.OPEN
        assert persisted_slot.booked_count == 0

        # Close the slot
        persisted_slot.status = SlotStatus.CLOSED
        session2.add(persisted_slot)
        await session2.commit()

    # Session 3: Verify it is CLOSED across another new database session
    async with AsyncSessionLocal() as session3:
        res = await session3.execute(select(Slot).where(Slot.id == slot_id))
        closed_slot = res.scalars().first()
        assert closed_slot is not None
        assert closed_slot.status == SlotStatus.CLOSED

        # Update capacity to 30
        closed_slot.capacity = 30
        session3.add(closed_slot)
        await session3.commit()

    # Session 4: Verify capacity remains 30
    async with AsyncSessionLocal() as session4:
        res = await session4.execute(select(Slot).where(Slot.id == slot_id))
        final_slot = res.scalars().first()
        assert final_slot is not None
        assert final_slot.capacity == 30


async def test_slot_routine_generation_and_duplicate_prevention():
    """Validates standard routine slot generation and duplicate window conflict prevention."""
    env = await setup_test_environment()
    centre_id = env["centre_a_id"]
    crop_id = env["crop_id"]
    token = env["op_a_token"]
    slot_date = str(datetime.now(timezone.utc).date() + timedelta(days=3))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        routine_payload = {
            "crop_id": str(crop_id),
            "slot_date": slot_date,
            "capacity": 20,
            "start_time": "08:00:00",
            "end_time": "16:00:00",
            "slot_duration_minutes": 60,
            "break_start_time": "12:00:00",
            "break_end_time": "13:00:00",
        }

        # 1. First routine generation
        res1 = await ac.post(
            f"/api/v1/management/centres/{centre_id}/slots/batch",
            json=routine_payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res1.status_code == 201
        slots1 = res1.json()["data"]
        # Expected: 08-09, 09-10, 10-11, 11-12, (break 12-13 skipped), 13-14, 14-15, 15-16 = 7 slots
        assert len(slots1) == 7

        # 2. Second routine generation on same day and centre: must not duplicate
        res2 = await ac.post(
            f"/api/v1/management/centres/{centre_id}/slots/batch",
            json=routine_payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res2.status_code == 201
        slots2 = res2.json()["data"]
        assert len(slots2) == 0  # 0 new slots created because all 7 windows already exist

    # Verify DB count
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Slot)
            .where(Slot.centre_id == centre_id)
            .where(Slot.slot_date == datetime.strptime(slot_date, "%Y-%m-%d").date())
        )
        total_slots = res.scalars().all()
        assert len(total_slots) == 7


async def test_qr_verification_real_state_change_and_duplicate_rejection():
    """Validates real QR verification, DB state transition to ARRIVED, token creation, and duplicate scan rejection."""
    env = await setup_test_environment()
    centre_a_id = env["centre_a_id"]
    crop_id = env["crop_id"]
    farmer_id = env["farmer_id"]
    token_a = env["op_a_token"]
    today = datetime.now(timezone.utc).date()

    async with AsyncSessionLocal() as db:
        slot = Slot(
            centre_id=centre_a_id,
            crop_id=crop_id,
            slot_date=today,
            start_time=time(10, 0),
            end_time=time(11, 0),
            capacity=20,
            booked_count=1,
            status=SlotStatus.OPEN
        )
        db.add(slot)
        await db.flush()

        booking = Booking(
            booking_reference=f"KF-TEST-{uuid.uuid4().hex[:6].upper()}",
            farmer_id=farmer_id,
            centre_id=centre_a_id,
            slot_id=slot.id,
            crop_id=crop_id,
            quantity=5000,
            status=BookingStatus.CONFIRMED
        )
        db.add(booking)
        await db.commit()
        booking_id = booking.id
        booking_ref = booking.booking_reference

    # Generate valid signed QR payload
    signed_qr = create_signed_qr_payload(
        booking_ref=booking_ref,
        centre_id=str(centre_a_id),
        expiry_ts=int(datetime.now(timezone.utc).timestamp() + 3600)
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Scan valid QR code
        res = await ac.post(
            "/api/v1/management/qr/verify",
            json={"payload": signed_qr},
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"]["status"] == "WAITING"
        assigned_token_num = body["data"]["token_number"]

        # 2. Verify state changed in PostgreSQL
        async with AsyncSessionLocal() as db_check:
            b_res = await db_check.execute(select(Booking).where(Booking.id == booking_id))
            updated_booking = b_res.scalars().first()
            assert updated_booking.status == BookingStatus.ARRIVED

            t_res = await db_check.execute(select(QueueToken).where(QueueToken.booking_id == booking_id))
            queue_tok = t_res.scalars().first()
            assert queue_tok is not None
            assert queue_tok.status == QueueStatus.WAITING
            assert queue_tok.token_number == assigned_token_num

        # 3. Duplicate scan attempt: must be rejected with 409 ALREADY_VERIFIED
        res_dup = await ac.post(
            "/api/v1/management/qr/verify",
            json={"payload": signed_qr},
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert res_dup.status_code == 409


async def test_manual_fallback_workflow_persistence():
    """Validates the strict 2-step manual fallback: Lookup -> Verify Arrival."""
    env = await setup_test_environment()
    centre_a_id = env["centre_a_id"]
    crop_id = env["crop_id"]
    farmer_id = env["farmer_id"]
    token_a = env["op_a_token"]
    today = datetime.now(timezone.utc).date()

    async with AsyncSessionLocal() as db:
        slot = Slot(
            centre_id=centre_a_id,
            crop_id=crop_id,
            slot_date=today,
            start_time=time(14, 0),
            end_time=time(15, 0),
            capacity=20,
            booked_count=1,
            status=SlotStatus.OPEN
        )
        db.add(slot)
        await db.flush()

        booking = Booking(
            booking_reference=f"KF-MANUAL-{uuid.uuid4().hex[:6].upper()}",
            farmer_id=farmer_id,
            centre_id=centre_a_id,
            slot_id=slot.id,
            crop_id=crop_id,
            quantity=4500,
            status=BookingStatus.CONFIRMED
        )
        db.add(booking)
        await db.commit()
        booking_id = booking.id
        booking_ref = booking.booking_reference

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1: Lookup Booking Reference
        res_lookup = await ac.get(
            f"/api/v1/management/bookings/lookup?reference={booking_ref}",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert res_lookup.status_code == 200
        l_data = res_lookup.json()["data"]
        assert l_data["booking_reference"] == booking_ref
        assert l_data["farmer_name"] == "Balwinder Singh"
        assert l_data["status"] == "CONFIRMED"

        # Step 2: Verify Arrival
        res_verify = await ac.post(
            f"/api/v1/management/bookings/{booking_id}/verify-arrival",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert res_verify.status_code == 200
        v_data = res_verify.json()["data"]
        assert v_data["token_number"] > 0

    # Verify persistent state in new DB session
    async with AsyncSessionLocal() as db_check:
        b_res = await db_check.execute(select(Booking).where(Booking.id == booking_id))
        persisted = b_res.scalars().first()
        assert persisted.status == BookingStatus.ARRIVED


async def test_centre_isolation_rejection():
    """Validates that Operator of Centre B cannot scan or verify arrival for Centre A's booking."""
    env = await setup_test_environment()
    centre_a_id = env["centre_a_id"]
    crop_id = env["crop_id"]
    farmer_id = env["farmer_id"]
    token_b = env["op_b_token"]  # Operator of Centre B!
    today = datetime.now(timezone.utc).date()

    async with AsyncSessionLocal() as db:
        slot = Slot(
            centre_id=centre_a_id,
            crop_id=crop_id,
            slot_date=today,
            start_time=time(11, 0),
            end_time=time(12, 0),
            capacity=20,
            booked_count=1,
            status=SlotStatus.OPEN
        )
        db.add(slot)
        await db.flush()

        booking = Booking(
            booking_reference=f"KF-ISOL-{uuid.uuid4().hex[:6].upper()}",
            farmer_id=farmer_id,
            centre_id=centre_a_id,
            slot_id=slot.id,
            crop_id=crop_id,
            quantity=3000,
            status=BookingStatus.CONFIRMED
        )
        db.add(booking)
        await db.commit()
        booking_id = booking.id

    signed_qr = create_signed_qr_payload(
        booking_ref=booking.booking_reference,
        centre_id=str(centre_a_id),
        expiry_ts=int(datetime.now(timezone.utc).timestamp() + 3600)
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # QR verification by wrong centre operator must return 403 Forbidden
        res_qr = await ac.post(
            "/api/v1/management/qr/verify",
            json={"payload": signed_qr},
            headers={"Authorization": f"Bearer {token_b}"}
        )
        assert res_qr.status_code == 403

        # Manual lookup by wrong centre operator must return 403 Forbidden
        res_lookup = await ac.get(
            f"/api/v1/management/bookings/lookup?reference={booking.booking_reference}",
            headers={"Authorization": f"Bearer {token_b}"}
        )
        assert res_lookup.status_code == 403


async def test_transactional_slot_reassignment():
    """Validates transactional slot reassignment with capacity locking and count reconciliation."""
    env = await setup_test_environment()
    centre_id = env["centre_a_id"]
    crop_id = env["crop_id"]
    farmer_id = env["farmer_id"]
    token = env["op_a_token"]
    today = datetime.now(timezone.utc).date() + timedelta(days=4)

    async with AsyncSessionLocal() as db:
        slot1 = Slot(
            centre_id=centre_id,
            crop_id=crop_id,
            slot_date=today,
            start_time=time(9, 0),
            end_time=time(10, 0),
            capacity=20,
            booked_count=10,
            status=SlotStatus.OPEN
        )
        slot2 = Slot(
            centre_id=centre_id,
            crop_id=crop_id,
            slot_date=today,
            start_time=time(10, 0),
            end_time=time(11, 0),
            capacity=20,
            booked_count=5,
            status=SlotStatus.OPEN
        )
        db.add(slot1)
        db.add(slot2)
        await db.flush()

        booking = Booking(
            booking_reference=f"KF-REASSIGN-{uuid.uuid4().hex[:6].upper()}",
            farmer_id=farmer_id,
            centre_id=centre_id,
            slot_id=slot1.id,
            crop_id=crop_id,
            quantity=2,  # 2 quintals / units
            status=BookingStatus.CONFIRMED
        )
        db.add(booking)
        await db.commit()
        b_id = booking.id
        s1_id = slot1.id
        s2_id = slot2.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            f"/api/v1/management/bookings/{b_id}/reassign",
            json={"target_slot_id": str(s2_id)},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        assert res.json()["success"] is True

    # Check persistence in brand new DB session
    async with AsyncSessionLocal() as db_check:
        b = (await db_check.execute(select(Booking).where(Booking.id == b_id))).scalars().first()
        s1 = (await db_check.execute(select(Slot).where(Slot.id == s1_id))).scalars().first()
        s2 = (await db_check.execute(select(Slot).where(Slot.id == s2_id))).scalars().first()

        assert b.slot_id == s2_id
        assert s1.booked_count == 8   # 10 - 2
        assert s2.booked_count == 7   # 5 + 2


async def test_full_procurement_state_machine_persistence():
    """Validates complete flow: Arrived -> Quality Test -> Weighment & DBT Payout -> Completed in DB."""
    env = await setup_test_environment()
    centre_id = env["centre_a_id"]
    crop_id = env["crop_id"]
    farmer_id = env["farmer_id"]
    token = env["op_a_token"]
    today = datetime.now(timezone.utc).date()

    async with AsyncSessionLocal() as db:
        slot = Slot(
            centre_id=centre_id,
            crop_id=crop_id,
            slot_date=today,
            start_time=time(8, 0),
            end_time=time(9, 0),
            capacity=20,
            booked_count=1,
            status=SlotStatus.OPEN
        )
        db.add(slot)
        await db.flush()

        booking = Booking(
            booking_reference=f"KF-PROC-{uuid.uuid4().hex[:6].upper()}",
            farmer_id=farmer_id,
            centre_id=centre_id,
            slot_id=slot.id,
            crop_id=crop_id,
            quantity=4500,
            status=BookingStatus.ARRIVED
        )
        db.add(booking)
        await db.commit()
        b_id = booking.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Quality Test
        res_q = await ac.post(
            f"/api/v1/management/procurement/{b_id}/quality-test",
            json={
                "moisture_percentage": 11.4,
                "foreign_matter_percentage": 0.3,
                "broken_grain_percentage": 0.8,
                "grade": "FAQ_GRADE_A",
                "passed": True,
                "notes": "Premium quality FAQ grain"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res_q.status_code == 200
        assert res_q.json()["data"]["quality_status"] == "PASSED"

        # 2. Weighment & Complete Payout
        res_p = await ac.post(
            f"/api/v1/management/procurement/{b_id}/complete-and-payout",
            json={
                "gross_weight_kg": 7500.0,
                "tare_weight_kg": 3000.0
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res_p.status_code == 200
        p_data = res_p.json()["data"]
        assert p_data["booking_status"] == "COMPLETED"
        assert p_data["net_weight_kg"] == 4500.0
        assert p_data["payout_amount"] == 102375.0  # 4500 * 22.75

    # 3. Verify in independent DB session
    async with AsyncSessionLocal() as db_check:
        b = (await db_check.execute(select(Booking).where(Booking.id == b_id))).scalars().first()
        p = (await db_check.execute(select(Procurement).where(Procurement.booking_id == b_id))).scalars().first()
        pay = (await db_check.execute(select(Payment).where(Payment.procurement_id == p.id))).scalars().first()

        assert b.status == BookingStatus.COMPLETED
        assert p.status == ProcurementStatus.PROCUREMENT_COMPLETED
        assert float(p.net_weight) == 4500.0
        assert pay.status == PaymentStatus.COMPLETED
        assert float(pay.amount) == 102375.0
        assert pay.payment_reference.startswith("DBT-")
