# KisanFlow — Real Stateful Operator & Mandi Management System
## Architecture, Workflows, Database Persistence, and Operational Guide

---

## 1. Executive Summary

Before this update, the Mandi Operator application displayed static, mock tokens and hardcoded demo rows. Actions like "Verify Gate Pass" would instantly toggle a farmer's status in local React memory without scanning a QR code or calling a backend endpoint. Furthermore, refreshing the page would either wipe all changes or trigger `422 Unprocessable Entity` errors due to hardcoded string IDs (such as `'centre-samrala'`) instead of real PostgreSQL UUIDs.

**All mock shortcuts, synthetic fallbacks, and local-only state have been eliminated.**

Every action in the Operator Management application is now backed by transactional PostgreSQL operations, strict role-based access control (RBAC), cryptographic signature verification, and synchronized real-time state invalidation.

```
=================================================================================================
                                  SYSTEM DATA FLOW OVERVIEW
=================================================================================================

   OPERATOR CONSOLE                                                 POSTGRESQL DATABASE
   ----------------                                                 -------------------
   1. Create Slot / Routine ------------ POST /slots/batch --------> Insert real Slot rows
                                                                             |
   FARMER APP                                                                | Published Slots
   ----------                                                                v
   2. Book Available Slot <------------- GET /slots ----------------- Read capacity
          |
          +----------------------------- POST /bookings ------------> Concurrency-safe lock
                                                                      Increment booked_count
                                                                      Generate signed QR e-Pass
                                                                             |
   OPERATOR MANDI GATE                                                       |
   -------------------                                                       |
   3. Scan HMAC QR Code   ----+                                              |
          OR                  |--------- POST /qr/verify -----------> Validate HMAC & Expiry
      Manual Fallback Lookup -+          POST /verify-arrival         Atomic update:
                                                                      Booking -> ARRIVED
                                                                      QueueToken -> WAITING
                                                                             |
   MANDI WEIGHBRIDGE / LAB                                                   |
   -----------------------                                                   |
   4. Call Token to Bay ---------------- POST /queue/{id}/call -----> QueueToken -> CALLED
   5. Record Quality Test -------------- POST /procurement/quality -> Booking -> PROCESSING
   6. Record Tare & Weighbridge -------- POST /procurement/complete-> Booking -> COMPLETED
                                                                      Payment -> COMPLETED (DBT)
                                                                             |
   RELOAD TEST: Refresh browser at ANY stage -----------------------> GET live state from DB
=================================================================================================
```

---

## 2. Gate Pass Verification: QR Scan & Strict Manual Fallback

### The Core Problem Solved
Previously, operators had access to a generic "Verify Gate Pass" button that automatically set a farmer's status to `ARRIVED` without verifying physical presence or scanning a pass.

**That shortcut has been completely removed.**
A farmer's arrival can now **only** be verified via two strictly validated paths:

### Option A: Authentic QR Code Scan
1. **Farmer e-Pass Generation:**
   When a booking is confirmed, the backend cryptographically signs an HMAC-SHA256 payload:
   ```json
   {
     "b": "KF-2026-0942",
     "c": "19dcddb6-0667-4a5c-afda-d2e42a89f7c5",
     "e": 1789230000
   }
   ```
   Formatted as: `kf-pass:v1:<base64url_payload>.<base64url_signature>`.
2. **Operator Gate Scan:**
   The operator scans the physical or mobile e-Pass using a camera scanner or barcode reader.
3. **Backend Cryptographic Validation:**
   - Validates HMAC-SHA256 key signature. Any tampered payload yields `401 Cryptographic signature verification failed`.
   - Checks expiration timestamp ($e$). Expired passes yield `401 e-Pass has expired`.
   - Checks Operator Centre Authorization: An operator at Mandi B scanning a pass for Mandi A is rejected with `403 Forbidden`.
   - Duplicate Detection: Re-scanning an already-admitted farmer yields `409 Conflict: This farmer has already been checked in.`
4. **State Transition:**
   - `bookings.status` transitions from `CONFIRMED` $\to$ `ARRIVED`.
   - An active `queue_tokens` entry is created with status `WAITING` and a sequential daily token number.
   - An immutable audit trail entry is inserted into `queue_events`.

### Option B: Strict Two-Step Manual Fallback
If the farmer's mobile screen is cracked, low on battery, or the camera hardware fails:
1. Operator clicks **"Can't scan QR? Use manual fallback"**.
2. **Step 1: Lookup:** Operator enters the booking reference (e.g., `KF-2026-0948`).
   - The backend looks up the booking, verifies centre isolation, and returns safe details (Farmer Name, Village, Crop, Quantity, Slot, Current Status).
3. **Step 2: Verified Arrival:**
   - Only after reviewing the farmer's credentials does the operator click **[ Verify Arrival & Ingress ]**.
   - The backend validates the current state and executes `verify_farmer_arrival()`, transitioning the booking to `ARRIVED` and assigning a live queue token.

```
       [ Farmer Arrives at Mandi Gate ]
                      |
        +-------------+-------------+
        |                           |
   [ Option A: QR ]          [ Option B: Fallback ]
        |                           |
  Scan Camera QR             Enter Booking Ref
        |                           |
  Send to Backend             Fetch Safe Details
        |                           |
  HMAC & Expiry Check         Operator Verifies ID
        |                           |
        +-------------+-------------+
                      |
           verify_farmer_arrival()
                      |
         +------------+------------+
         |                         |
    [ In Database ]          [ In Queue ]
  Booking -> ARRIVED     QueueToken -> WAITING
```

---

## 3. Slot Windows & Routine Generation System

### Real Database Records
Slots are not static UI components. Every slot displayed on screen corresponds to an actual row in the `slots` PostgreSQL table:
- `id`: UUID Primary Key
- `centre_id`: Foreign Key to `centres`
- `crop_id`: Foreign Key to `crops`
- `slot_date`: Date of procurement
- `start_time` & `end_time`: Time boundaries (e.g., `09:00:00` to `10:00:00`)
- `capacity`: Maximum allowed quota for the window
- `booked_count`: Live count of booked units
- `status`: `OPEN` or `CLOSED`

### Daily Routine Generation
Operators can generate an entire day's procurement routine in one click:
- **Default Routine Parameters:**
  - Start Time: `08:00`
  - End Time: `16:00`
  - Slot Duration: `60` minutes
  - Capacity: `20` vehicles/loads per slot
  - Lunch Break: `12:00` to `13:00` (automatically excluded)
- **Duplicate Prevention:**
  If an operator runs the routine generator twice on the same day for the same centre and crop, the system will not create duplicate slot windows. Existing windows are preserved and zero duplicate rows are added.

### Publishing, Closing, and Capacity Adjustments
- **Toggle Open/Close:** An operator can close a slot window with `[ Close Slot ]`.
  - When closed, the status in PostgreSQL becomes `CLOSED`.
  - The Farmer application immediately hides or disables booking for that slot.
  - Existing bookings remain valid.
- **Dynamic Capacity:** Operators can modify capacity directly. If capacity is raised above `booked_count`, a previously `FULL` slot transitions back to `OPEN`.

---

## 4. Concurrency-Safe Farmer Booking

When a farmer books a slot:
1. Backend acquires an exclusive row-level database lock:
   ```sql
   SELECT * FROM slots WHERE id = :slot_id FOR UPDATE;
   ```
2. Checks:
   - `status == 'OPEN'`
   - `booked_count < capacity`
3. Increments `booked_count` by 1.
4. If `booked_count == capacity`, sets `status = 'FULL'`.
5. Inserts `bookings` record with unique `booking_reference`.
6. Commits transaction. If multiple farmers attempt to book the last spot concurrently, exactly one succeeds; all others receive `409 Conflict: Slot is already full`.

---

## 5. Slot Reassignment Workflow

Operators can reassign a booked farmer from an oversubscribed slot to an alternate open slot:
1. **Validation:**
   - Operator has access to the centre.
   - Target slot exists, belongs to the same centre and crop, and is `OPEN`.
   - Target slot has available capacity (`booked_count < capacity`).
2. **Two-Row Atomic Lock:**
   ```sql
   SELECT * FROM slots WHERE id IN (source_id, target_id) FOR UPDATE;
   ```
3. **Reconciliation:**
   - Decrements `source_slot.booked_count`.
   - Increments `target_slot.booked_count`.
   - Updates `booking.slot_id = target_slot.id`.
   - Inserts audit event in `reassignment_logs`.
4. **Commit:** All changes persist atomically. If either slot condition fails, the entire transaction rolls back.

---

## 6. Mandi Processing & Procurement State Machine

Slots and Queues are strictly separated:
- **Slot:** The planned appointment time (e.g., `09:00 - 10:00`).
- **Queue:** The physical vehicle waiting line inside the mandi after QR gate check-in.

```
+-----------+    QR Scan / Manual    +---------+     Call to Bay     +--------+
|  BOOKED   | ---------------------> | ARRIVED | ------------------> | CALLED |
+-----------+                        +---------+                     +--------+
                                          |                              |
                                      (Queue: WAITING)              (Queue: CALLED)
                                                                         |
                                                                         v
+-----------+    Tare & Net Weight   +------------+    Moisture / FAQ    |
| COMPLETED | <--------------------- | PROCESSING | <--------------------+
+-----------+                        +------------+
      |                              (Queue: PROCESSING)
      +---> Payout Generated (DBT Instant Transfer)
      +---> J-Form Receipt Generated
```

1. **Gate Verification:** Booking $\to$ `ARRIVED`, Queue $\to$ `WAITING`.
2. **Bay Dispatch:** Operator calls token to Bay (e.g., "Weighbridge Bay 2"). Queue $\to$ `CALLED`.
3. **Quality Testing:** Grain inspection records moisture %, foreign matter %, and broken grain %. Booking $\to$ `PROCESSING`.
4. **Weighbridge & Payout:**
   - Records gross vehicle weight and tare weight.
   - Automatically calculates net weight and MSP payout:
     $$\text{Payout} = \text{Net Weight (kg)} \times \frac{\text{Crop MSP (₹)}}{100}$$
   - Inserts `payments` record with `DBT-YYYYMMDD-XXXX` reference.
   - Transitions Booking $\to$ `COMPLETED`, Queue $\to$ `COMPLETED`.

---

## 7. Database Persistence & Reload Verification

All operational changes survive browser refreshes, device changes, and server restarts because the frontend no longer relies on mock states.

### Persistence Checklist Verified by Automated Tests:
- [x] Slot created $\to$ survives browser refresh.
- [x] Slot closed $\to$ remains `CLOSED` after refresh.
- [x] Capacity modified $\to$ new capacity remains after refresh.
- [x] QR code verified $\to$ booking remains `ARRIVED` and token remains in queue.
- [x] Manual fallback verified $\to$ booking remains `ARRIVED` after refresh.
- [x] Farmer reassigned $\to$ target slot count remains incremented after refresh.
- [x] Quality test & Weighment completed $\to$ payment and completed status remain in database.
