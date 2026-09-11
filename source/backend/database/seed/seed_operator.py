"""
Seed the demo operator user (5555555551) with an Officer record
linked to the Mandi Demo Centre (MDC001).
Idempotent — safe to run multiple times.
"""
import sys
sys.path.insert(0, ".")
import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.users import User, UserRole
from app.models.entities import Officer, Centre

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_operator(session: AsyncSession):
    # 1. Find the demo centre
    res = await session.execute(select(Centre).where(Centre.code == "MDC001"))
    demo_centre = res.scalars().first()
    if not demo_centre:
        logger.error("Demo centre MDC001 not found! Run seed_basic.py first.")
        return

    logger.info(f"Demo centre found: {demo_centre.name} ({demo_centre.id})")

    # 2. Ensure operator user 5555555551 exists
    operator_phone = "5555555551"
    res_user = await session.execute(select(User).where(User.phone == operator_phone))
    op_user = res_user.scalars().first()

    if not op_user:
        op_user = User(
            phone=operator_phone,
            role=UserRole.CENTRE_OPERATOR,
            is_active=True,
        )
        session.add(op_user)
        await session.flush()
        logger.info(f"Created operator user: phone={operator_phone}  id={op_user.id}")
    else:
        logger.info(f"Operator user already exists: phone={operator_phone}  id={op_user.id}  role={op_user.role}")
        # Ensure role is correct
        if op_user.role != UserRole.CENTRE_OPERATOR:
            op_user.role = UserRole.CENTRE_OPERATOR
            logger.info(f"  Updated role to CENTRE_OPERATOR")

    # 3. Ensure Officer record links user to demo centre
    res_officer = await session.execute(select(Officer).where(Officer.user_id == op_user.id))
    officer = res_officer.scalars().first()

    if not officer:
        officer = Officer(
            user_id=op_user.id,
            name="Samrala Depot Operator",
            centre_id=demo_centre.id,
            designation="Centre Operator & Weighbridge Lead",
        )
        session.add(officer)
        logger.info(f"Created officer record linking user to centre {demo_centre.id}")
    else:
        logger.info(f"Officer record already exists: centre_id={officer.centre_id}")
        if officer.centre_id != demo_centre.id:
            officer.centre_id = demo_centre.id
            logger.info(f"  Re-linked officer to demo centre {demo_centre.id}")

    # 4. Also fix the seed operator (9876500000) — ensure it has an officer record
    res_seed = await session.execute(select(User).where(User.phone == "9876500000"))
    seed_user = res_seed.scalars().first()
    if seed_user:
        res_seed_off = await session.execute(select(Officer).where(Officer.user_id == seed_user.id))
        seed_officer = res_seed_off.scalars().first()
        if not seed_officer:
            seed_officer = Officer(
                user_id=seed_user.id,
                name="Seed Operator",
                centre_id=demo_centre.id,
                designation="Centre Operator",
            )
            session.add(seed_officer)
            logger.info(f"Created officer record for seed operator 9876500000")

    # 5. Ensure farmer user 5555555550 exists for farmer app
    farmer_phone = "5555555550"
    res_f = await session.execute(select(User).where(User.phone == farmer_phone))
    farmer_user = res_f.scalars().first()
    if not farmer_user:
        farmer_user = User(
            phone=farmer_phone,
            role=UserRole.FARMER,
            is_active=True,
        )
        session.add(farmer_user)
        await session.flush()

        from app.models.entities import Farmer
        farmer = Farmer(
            user_id=farmer_user.id,
            name="Demo Farmer",
            village="Samrala",
            district="Ludhiana",
            state="Punjab",
            preferred_language="pa",
        )
        session.add(farmer)
        logger.info(f"Created demo farmer: phone={farmer_phone}  id={farmer_user.id}")

    await session.commit()
    logger.info("Operator seeding completed successfully.")


async def main():
    async with AsyncSessionLocal() as session:
        await seed_operator(session)


if __name__ == "__main__":
    asyncio.run(main())
