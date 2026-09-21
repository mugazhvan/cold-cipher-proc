# KisanFlow: Security Provenance Audit

This document audits the specific security claims made in the KisanFlow pitch and codebase against standard industry practices (specifically OWASP).

## 1. Cryptographic E-Gate Pass (Offline Verification)

*   **Claim**: "Gate passes can be cryptographically verified instantly without relying on continuous internet connectivity."
*   **Implementation**: `security.py` uses JSON Web Tokens (JWT) signed with the `HMAC-SHA256` algorithm.
*   **Source Standard**: [OWASP JSON Web Token (JWT) Cheat Sheet for Java/General](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
*   **Verification**: **✅ TRUE**. The backend creates a payload containing the booking ID, farmer ID, and expiry timestamp, signing it with a secret key known only to the operator devices. The operator app decodes the signature offline. If the signature is valid and the timestamp is not expired, the pass is mathematically proven to be authentic.
*   **Safe Wording**: "Uses HMAC-SHA256 signed JWTs to guarantee tamper-resistance for offline E-Gate passes."

## 2. Zero Overbooking / Race-Condition Prevention

*   **Claim**: "Mathematically guarantees zero overbooking at the mandi."
*   **Implementation**: PostgreSQL `SELECT ... FOR UPDATE` (Row-Level Locking).
*   **Source Standard**: [PostgreSQL Explicit Locking Documentation](https://www.postgresql.org/docs/15/explicit-locking.html)
*   **Verification**: **✅ TRUE**. The `api/v1/endpoints/bookings.py` file uses `with_for_update()` to lock the specific slot row during a booking transaction. If 50 farmers try to book the last remaining capacity unit at the exact same millisecond, PostgreSQL forces them into a serial queue. The first succeeds, and the remaining 49 receive an HTTP 409 Conflict.
*   **Safe Wording**: "Enforces exact daily capacity limits using ACID-compliant, database-level transactional row locking."

## 3. Password Storage

*   **Implementation**: The codebase uses `passlib` with the `bcrypt` algorithm.
*   **Source Standard**: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
*   **Verification**: **✅ TRUE**. Passwords are never stored in plaintext. They are salted and hashed using bcrypt before being persisted to PostgreSQL.

## 4. Role-Based Access Control (RBAC)

*   **Implementation**: `RoleChecker` dependency injection in FastAPI.
*   **Verification**: **✅ TRUE**. The system correctly issues JWTs containing specific roles (`FARMER`, `CENTRE_OPERATOR`, `DISTRICT_ADMIN`). Operator endpoints explicitly enforce the `CENTRE_OPERATOR` role, preventing a farmer from generating a fake weighbridge receipt.

## Warning: Do Not Claim

*   Do not claim **"100% Unhackable"**.
*   Do not claim **"Military-grade encryption"**. (HMAC-SHA256 is an industry standard, but this terminology is a red flag to technical judges).
*   Stick strictly to verifiable mechanisms: "Uses HMAC-SHA256," "Uses bcrypt," and "Uses Row-Level Locking."
