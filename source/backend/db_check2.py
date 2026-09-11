import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        # Find operator with phone 5555555551 (used in frontend auto-auth)
        r = await db.execute(text("SELECT id, phone, role FROM users WHERE phone='5555555551'"))
        row = r.fetchone()
        if row:
            uid = row[0]
            print(f"Operator user: id={uid}  phone={row[1]}  role={row[2]}")
            # Check officer link
            r2 = await db.execute(text(f"SELECT id, centre_id FROM officers WHERE user_id='{uid}'"))
            orow = r2.fetchone()
            if orow:
                print(f"Officer record: id={orow[0]}  centre_id={orow[1]}")
            else:
                print("NO officer record for this user!")
        else:
            print("NO user with phone 5555555551!")

        # Also check operator 9876500000 (seed operator)
        r3 = await db.execute(text("SELECT id, phone, role FROM users WHERE phone='9876500000'"))
        row3 = r3.fetchone()
        if row3:
            uid3 = row3[0]
            print(f"\nSeed operator: id={uid3}  phone={row3[1]}  role={row3[2]}")
            r4 = await db.execute(text(f"SELECT id, centre_id FROM officers WHERE user_id='{uid3}'"))
            orow4 = r4.fetchone()
            if orow4:
                print(f"Officer record: id={orow4[0]}  centre_id={orow4[1]}")
            else:
                print("NO officer record for seed operator!")
        
        # The first centre (Mandi Demo Centre) 
        print("\n=== Mandi Demo Centre details ===")
        r5 = await db.execute(text("SELECT * FROM centres WHERE id='7854a32d-02b5-4483-8938-a80b9a54fc57'"))
        from sqlalchemy import inspect as sa_inspect
        row5 = r5.fetchone()
        if row5:
            print(f"  columns: {r5.keys()}")
            print(f"  values: {tuple(row5)}")

        # Check bookings for that centre
        r6 = await db.execute(text("SELECT count(*) FROM bookings WHERE centre_id='7854a32d-02b5-4483-8938-a80b9a54fc57'"))
        print(f"\n=== Bookings for Mandi Demo Centre: {r6.scalar()} ===")

asyncio.run(check())
