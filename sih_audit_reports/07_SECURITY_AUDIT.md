# KisanFlow — 07 Security Provenance Audit

> **SIH 2026 · SIH26032 · Cold Cipher**

[? Audit Index](README.md) · [01 Source Audit](01_SOURCE_AUDIT.md) · [02 Claim Matrix](02_CLAIM_SOURCE_MATRIX.md) · [03 Implementation](03_IMPLEMENTATION_PROVENANCE.md) · [04 Systems](04_EXISTING_SYSTEM_COMPARISON.md) · [05 Cost](05_PRICING_COST_AUDIT.md) · [06 Tech Stack](06_TECH_STACK_REFERENCES.md) · [07 Security](07_SECURITY_AUDIT.md) · [08 Research](08_RESEARCH_PAPERS.md) · [09 Bibliography](09_FULL_BIBLIOGRAPHY.md) · [12 Slide 6](12_SLIDE_6_RESEARCH_REFERENCES.md)

**Purpose:** Audits the specific security claims made in the KisanFlow pitch and codebase against standard industry practices (specifically OWASP).

| Field | Value |
|---|---|
| Project | KisanFlow |
| SIH Problem | SIH26032 |
| Team | Cold Cipher |
| Document Type | Security Audit |
| Verification Scope | Current repository |
| Last Audit Status | Verified |

---

## 1. CRYPTOGRAPHIC E-GATE PASS (OFFLINE VERIFICATION)

- **Claim**: "Gate passes can be cryptographically verified instantly without relying on continuous internet connectivity."
- **Implementation**: security.py uses JSON Web Tokens (JWT) signed with the HMAC-SHA256 algorithm.
- **Source Standard**: ?? EXTERNAL SOURCE — [OWASP JSON Web Token (JWT) Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- **Verification**: ? IMPLEMENTED. The backend creates a payload containing the booking ID, farmer ID, and expiry timestamp, signing it with a secret key known only to the operator devices. The operator app decodes the signature offline. If the signature is valid and the timestamp is not expired, the pass is mathematically proven to be authentic.
- **Safe Wording**: "Uses HMAC-SHA256 signed JWTs to guarantee tamper-resistance for offline E-Gate passes."

## 2. ZERO OVERBOOKING / RACE-CONDITION PREVENTION

- **Claim**: "Mathematically guarantees zero overbooking at the mandi."
- **Implementation**: PostgreSQL SELECT ... FOR UPDATE (Row-Level Locking).
- **Source Standard**: ?? EXTERNAL SOURCE — [PostgreSQL Explicit Locking Documentation](https://www.postgresql.org/docs/15/explicit-locking.html)
- **Verification**: ?? TESTED. The pi/v1/endpoints/bookings.py file uses with_for_update() to lock the specific slot row during a booking transaction. If 50 farmers try to book the last remaining capacity unit at the exact same millisecond, PostgreSQL forces them into a serial queue. The first succeeds, and the remaining 49 receive an HTTP 409 Conflict.
- **Safe Wording**: "Enforces exact daily capacity limits using ACID-compliant, database-level transactional row locking."

## 3. PASSWORD STORAGE

- **Implementation**: The codebase uses passlib with the crypt algorithm.
- **Source Standard**: ?? EXTERNAL SOURCE — [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- **Verification**: ? IMPLEMENTED. Passwords are never stored in plaintext. They are salted and hashed using bcrypt before being persisted to PostgreSQL.

## 4. ROLE-BASED ACCESS CONTROL (RBAC)

- **Implementation**: RoleChecker dependency injection in FastAPI.
- **Verification**: ? IMPLEMENTED. The system correctly issues JWTs containing specific roles (FARMER, CENTRE_OPERATOR, DISTRICT_ADMIN). Operator endpoints explicitly enforce the CENTRE_OPERATOR role, preventing a farmer from generating a fake weighbridge receipt.

---

> [!WARNING]
> **Warning: Do Not Claim**
> - Do not claim **"100% Unhackable"**.
> - Do not claim **"Military-grade encryption"**. (HMAC-SHA256 is an industry standard, but this terminology is a red flag to technical judges).
> - Stick strictly to verifiable mechanisms: "Uses HMAC-SHA256," "Uses bcrypt," and "Uses Row-Level Locking."

---

**Quick Links**
- [?? Farmer Portal](https://management-app-fawn-five.vercel.app/)
- [?? Operator Console](https://management-app-mugal1.vercel.app/)
- [? Swagger API](https://kisanflow-backend.onrender.com/docs)
- [?? ReDoc](https://kisanflow-backend.onrender.com/redoc)
- [?? Expo App](https://expo.dev/accounts/mugazhv/projects/farmer-mobile)
- [?? GitHub Repository](https://github.com/mugazhvan/cold-cipher-proc)

[? Back to Audit Index](README.md)
