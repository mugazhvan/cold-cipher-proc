import sys
sys.path.insert(0, ".")
import asyncio
import logging
from datetime import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models import (
    User, UserRole, Centre, CentreStatus, Farmer, Crop
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_data(session: AsyncSession):
    # 1. Create a Test Centre
    logger.info("Seeding centres...")
    res = await session.execute(select(Centre).where(Centre.code == "MDC001"))
    if not res.scalars().first():
        centre = Centre(
            name="Mandi Demo Centre",
            code="MDC001",
            address="123 Main Road",
            village="Sample Village",
            district="Sample District",
            state="Sample State",
            opening_time=time(8, 0),
            closing_time=time(18, 0),
            status=CentreStatus.OPEN
        )
        session.add(centre)
    
    # 2. Seed Crop Taxonomy
    logger.info("Seeding crop taxonomy...")
    
    # 2.1 Categories
    from app.models.entities import CropCategory, CropType
    
    categories_data = [
        {"name": "Cereals", "code": "CAT_CEREALS"},
        {"name": "Pulses", "code": "CAT_PULSES"},
        {"name": "Oilseeds", "code": "CAT_OILSEEDS"},
        {"name": "Commercial & Industrial Crops", "code": "CAT_COMMERCIAL"},
    ]
    
    categories = {}
    for c_data in categories_data:
        res = await session.execute(select(CropCategory).where(CropCategory.code == c_data["code"]))
        cat = res.scalars().first()
        if not cat:
            cat = CropCategory(**c_data)
            session.add(cat)
            await session.flush()
        categories[c_data["code"]] = cat

    # 2.2 Crops & Types
    taxonomy = {
        "CAT_CEREALS": [
            {"name": "Paddy", "code": "PADDY", "unit": "quintal", "types": [
                {"name": "Common", "code": "PADDY_COMMON", "type_kind": "VARIETY"},
                {"name": "Grade A", "code": "PADDY_GRADE_A", "type_kind": "GRADE"}
            ]},
            {"name": "Wheat", "code": "WHT", "unit": "quintal", "types": [
                {"name": "FAQ", "code": "WHEAT_FAQ", "type_kind": "QUALITY_CLASS"}
            ]},
            {"name": "Jowar", "code": "JOWAR", "unit": "quintal", "types": [
                {"name": "Hybrid", "code": "JOWAR_HYBRID", "type_kind": "VARIETY"},
                {"name": "Maldandi", "code": "JOWAR_MALDANDI", "type_kind": "VARIETY"}
            ]},
            {"name": "Bajra", "code": "BAJRA", "unit": "quintal", "types": [
                {"name": "FAQ", "code": "BAJRA_FAQ", "type_kind": "QUALITY_CLASS"}
            ]},
            {"name": "Maize", "code": "MAIZE", "unit": "quintal", "types": [
                {"name": "FAQ", "code": "MAIZE_FAQ", "type_kind": "QUALITY_CLASS"}
            ]},
            {"name": "Ragi", "code": "RAGI", "unit": "quintal", "types": [
                {"name": "FAQ", "code": "RAGI_FAQ", "type_kind": "QUALITY_CLASS"}
            ]},
            {"name": "Minor Millets", "code": "MINOR_MILLETS", "unit": "quintal", "types": [
                {"name": "Kodo", "code": "MILLET_KODO", "type_kind": "VARIETY"},
                {"name": "Foxtail (Kangani)", "code": "MILLET_FOXTAIL", "type_kind": "VARIETY"},
                {"name": "Little Millet (Kutki)", "code": "MILLET_LITTLE", "type_kind": "VARIETY"},
                {"name": "Proso (Cheena)", "code": "MILLET_PROSO", "type_kind": "VARIETY"}
            ]}
        ],
        "CAT_PULSES": [
            {"name": "Gram", "code": "GRAM", "unit": "quintal", "types": [
                {"name": "Desi Chana", "code": "GRAM_DESI", "type_kind": "VARIETY"},
                {"name": "Kabuli Chana", "code": "GRAM_KABULI", "type_kind": "VARIETY"}
            ]},
            {"name": "Arhar/Tur", "code": "ARHAR", "unit": "quintal", "types": [
                {"name": "Whole raw grain", "code": "ARHAR_WHOLE", "type_kind": "FORM"}
            ]},
            {"name": "Moong", "code": "MOONG", "unit": "quintal", "types": [
                {"name": "Whole raw grain", "code": "MOONG_WHOLE", "type_kind": "FORM"}
            ]},
            {"name": "Urad", "code": "URAD", "unit": "quintal", "types": [
                {"name": "Whole raw grain", "code": "URAD_WHOLE", "type_kind": "FORM"}
            ]},
            {"name": "Masur", "code": "MASUR", "unit": "quintal", "types": [
                {"name": "Whole raw grain", "code": "MASUR_WHOLE", "type_kind": "FORM"}
            ]}
        ],
        "CAT_OILSEEDS": [
            {"name": "Soybean", "code": "SOYBEAN", "unit": "quintal", "types": [
                {"name": "Yellow", "code": "SOYBEAN_YELLOW", "type_kind": "QUALITY_CLASS"}
            ]},
            {"name": "Rapeseed & Mustard", "code": "MUSTARD", "unit": "quintal", "types": [
                {"name": "Standard Mustard", "code": "MUSTARD_STANDARD", "type_kind": "VARIETY"},
                {"name": "Toria", "code": "MUSTARD_TORIA", "type_kind": "VARIETY"}
            ]},
            {"name": "Groundnut", "code": "GROUNDNUT", "unit": "quintal", "types": [
                {"name": "Groundnut-in-shell", "code": "GROUNDNUT_IN_SHELL", "type_kind": "FORM"}
            ]},
            {"name": "Sunflower Seed", "code": "SUNFLOWER", "unit": "quintal", "types": [
                {"name": "Whole oilseed", "code": "SUNFLOWER_WHOLE", "type_kind": "FORM"}
            ]},
            {"name": "Sesamum (Til)", "code": "SESAMUM", "unit": "quintal", "types": [
                {"name": "Whole oilseed", "code": "SESAMUM_WHOLE", "type_kind": "FORM"}
            ]},
            {"name": "Safflower (Kusum)", "code": "SAFFLOWER", "unit": "quintal", "types": [
                {"name": "Whole oilseed", "code": "SAFFLOWER_WHOLE", "type_kind": "FORM"}
            ]},
            {"name": "Nigerseed", "code": "NIGERSEED", "unit": "quintal", "types": [
                {"name": "Whole oilseed", "code": "NIGERSEED_WHOLE", "type_kind": "FORM"}
            ]}
        ],
        "CAT_COMMERCIAL": [
            {"name": "Raw Cotton", "code": "COTTON", "unit": "quintal", "types": [
                {"name": "Medium Staple", "code": "COTTON_MEDIUM", "type_kind": "GRADE"},
                {"name": "Long Staple", "code": "COTTON_LONG", "type_kind": "GRADE"}
            ]},
            {"name": "Raw Jute", "code": "JUTE", "unit": "quintal", "types": [
                {"name": "TD-3 Grade", "code": "JUTE_TD3", "type_kind": "GRADE"}
            ]},
            {"name": "Copra", "code": "COPRA", "unit": "quintal", "types": [
                {"name": "Milling Copra", "code": "COPRA_MILLING", "type_kind": "FORM"},
                {"name": "Ball Copra", "code": "COPRA_BALL", "type_kind": "FORM"},
                {"name": "De-husked Coconut", "code": "COPRA_DEHUSKED", "type_kind": "FORM"}
            ]},
            {"name": "Sugarcane", "code": "SUGARCANE", "unit": "quintal", "types": [
                {"name": "Recovery-rate based pricing", "code": "SUGARCANE_RECOVERY", "type_kind": "QUALITY_CLASS"}
            ]}
        ]
    }
    
    for cat_code, crops_data in taxonomy.items():
        cat_id = categories[cat_code].id
        for c_data in crops_data:
            res = await session.execute(select(Crop).where(Crop.code == c_data["code"]))
            crop = res.scalars().first()
            if not crop:
                crop = Crop(name=c_data["name"], code=c_data["code"], unit=c_data["unit"], category_id=cat_id, active=True)
                session.add(crop)
                await session.flush()
            elif crop.category_id is None:
                crop.category_id = cat_id
                
            for t_data in c_data.get("types", []):
                res_t = await session.execute(select(CropType).where(CropType.code == t_data["code"]))
                ctype = res_t.scalars().first()
                if not ctype:
                    ctype = CropType(
                        crop_id=crop.id,
                        name=t_data["name"],
                        code=t_data["code"],
                        type_kind=t_data["type_kind"],
                        active=True
                    )
                    session.add(ctype)
                    
    await session.flush()

    # 3. Create Admin User
    logger.info("Seeding users...")
    res_admin = await session.execute(select(User).where(User.phone == "9999999999"))
    if not res_admin.scalars().first():
        admin_user = User(
            phone="9999999999",
            role=UserRole.ADMIN,
            is_active=True
        )
        session.add(admin_user)

    # 4. Create a Farmer User
    res_farmer = await session.execute(select(User).where(User.phone == "8888888888"))
    farmer_user = res_farmer.scalars().first()
    if not farmer_user:
        farmer_user = User(
            phone="8888888888",
            role=UserRole.FARMER,
            is_active=True
        )
        session.add(farmer_user)
        await session.flush() # Flush to get user ID

        farmer = Farmer(
            user_id=farmer_user.id,
            name="Raju Kisan",
            village="Sample Village",
            district="Sample District",
            state="Sample State",
            preferred_language="en"
        )
        session.add(farmer)

    # 5. Seed slots for today and tomorrow for the demo centre
    from datetime import date, timedelta
    from app.models.booking import Slot
    res_c = await session.execute(select(Centre).where(Centre.code == "MDC001"))
    demo_centre = res_c.scalars().first()
    if demo_centre:
        all_crops_res = await session.execute(select(Crop).where(Crop.active == True))
        all_crops = all_crops_res.scalars().all()
        today = date.today()
        dates_to_seed = [today, today + timedelta(days=1), today + timedelta(days=2)]
        standard_windows = [
            (time(8, 0), time(10, 0)),
            (time(10, 0), time(12, 0)),
            (time(12, 0), time(14, 0)),
            (time(14, 0), time(16, 0)),
            (time(16, 0), time(18, 0)),
        ]
        # Seed for top 5 crops
        for cr in all_crops[:5]:
            for d in dates_to_seed:
                for st, et in standard_windows:
                    res_s = await session.execute(
                        select(Slot)
                        .where(Slot.centre_id == demo_centre.id)
                        .where(Slot.crop_id == cr.id)
                        .where(Slot.slot_date == d)
                        .where(Slot.start_time == st)
                    )
                    if not res_s.scalars().first():
                        s = Slot(
                            centre_id=demo_centre.id,
                            crop_id=cr.id,
                            slot_date=d,
                            start_time=st,
                            end_time=et,
                            capacity=20000,
                            booked_count=0,
                            status="OPEN"
                        )
                        session.add(s)

    await session.commit()
    logger.info("Database seeding completed successfully.")

async def main():
    async with AsyncSessionLocal() as session:
        await seed_data(session)

if __name__ == "__main__":
    asyncio.run(main())
