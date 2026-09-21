# KISANFLOW
## Research, Provenance, Demo & Technical Audit
SIH 2026 — Problem Statement SIH26032

---

## 1. PROJECT AT A GLANCE

KisanFlow is a procurement coordination platform connecting farmers
with procurement-centre capacity, scheduling, queue management and
procurement status tracking.

Problem Statement:
SIH26032 — Farmers often face long waiting times, lack of information
regarding procurement schedules, and uncertainty about procurement status.

---

## 2. LIVE DEMO & PROJECT LINKS

### Farmer Portal
https://management-app-fawn-five.vercel.app/

Slot booking, mandi discovery, queue tracking, procurement status.

### Operator Console
https://management-app-mugal1.vercel.app/

Capacity management, scheduling, QR verification, queue and procurement operations.

### REST API / Swagger
https://kisanflow-backend.onrender.com/docs

Live API documentation and endpoint testing.

### ReDoc API Specification
https://kisanflow-backend.onrender.com/redoc

Readable API schemas and contracts.

### Farmer Mobile App
https://expo.dev/accounts/mugazhv/projects/farmer-mobile

React Native / Expo farmer application.

### Source Repository
https://github.com/mugazhvan/cold-cipher-proc

### Testing & Verification
[Repository: docs/TESTING_AND_VERIFICATION.md]

---

## 3. IMPLEMENTATION STATUS

| Feature | Status |
|---|---|
| Farmer registration/login | IMPLEMENTED |
| Slot booking | IMPLEMENTED |
| Capacity enforcement | IMPLEMENTED |
| Queue management | IMPLEMENTED |
| QR generation & verification | IMPLEMENTED |
| Nearby centre discovery | IMPLEMENTED |
| Wait-time estimation | IMPLEMENTED — HEURISTIC |
| Digital procurement receipt | IMPLEMENTED — PDF PROTOTYPE |
| Payment/DBT | SIMULATED |
| PFMS integration | SIMULATED / FUTURE |
| UIDAI/Aadhaar integration | SIMULATED / FUTURE |
| e-NAM integration | SIMULATED / FUTURE |
| AGMARKNET integration | SIMULATED / FUTURE |
| SMS/WhatsApp | PROPOSED / SIMULATED |
| AI/ML recommendation | NOT IMPLEMENTED |

Source: Implementation Provenance Audit.

---

## 4. MASTER SOURCE AUDIT

This section inventories all external sources—including official government platforms, academic papers, documentation, pricing pages, and standards—utilized or researched for the KisanFlow project (SIH26032).

## Master Source List

| ID | Source Title | Organization / Author | Source Type | Official? | Primary? | Verification Status | Confidence | URL / Direct Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S01** | Minimum Support Prices (MSP) for Kharif & Rabi Crops | Department of Agriculture & Farmers Welfare, GoI | Official Gov | YES | PRIMARY | VERIFIED (Current for 2024-25) | High | [agricoop.nic.in](https://agricoop.nic.in/) |
| **S02** | e-Kharid Haryana Portal | Govt. of Haryana | Gov Platform | YES | PRIMARY | VERIFIED | High | [ekharid.haryana.gov.in](https://ekharid.haryana.gov.in/) |
| **S03** | Anaaj Kharid Punjab Portal | Punjab Mandi Board | Gov Platform | YES | PRIMARY | VERIFIED | High | [anaajkharid.in](https://anaajkharid.in/) |
| **S04** | e-NAM (National Agriculture Market) | Ministry of Agriculture, GoI | Gov Platform | YES | PRIMARY | VERIFIED | High | [enam.gov.in](https://enam.gov.in/) |
| **S05** | AGMARKNET | DMI, Ministry of Agriculture | Gov Platform | YES | PRIMARY | VERIFIED | High | [agmarknet.gov.in](https://agmarknet.gov.in/) |
| **S06** | Performance Evaluation of e-NAM | CCS NIAM | Academic Report | YES | SECONDARY| VERIFIED | High | [ccsniam.gov.in](https://ccsniam.gov.in/) |
| **S07** | JWT Security Cheat Sheet | OWASP | Security Standard | YES | PRIMARY | VERIFIED | High | [cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html) |
| **S08** | Vercel Pricing Page | Vercel Inc. | Tech Docs | YES | PRIMARY | VERIFIED (Sept 2026) | High | [vercel.com/pricing](https://vercel.com/pricing) |
| **S09** | Render Pricing Page | Render | Tech Docs | YES | PRIMARY | VERIFIED (Sept 2026) | High | [render.com/pricing](https://render.com/pricing) |
| **S10** | Haversine Formula | Mathematical Standard | Algorithm | N/A | PRIMARY | VERIFIED | High | Standard mathematical algorithm reference |
| **S11** | PostgreSQL Concurrency Control | PostgreSQL Global Dev Group | Tech Docs | YES | PRIMARY | VERIFIED | High | [postgresql.org/docs](https://www.postgresql.org/docs/15/explicit-locking.html) |
| **S12** | PFMS (Public Financial Management System) | Ministry of Finance | Gov Platform | YES | PRIMARY | VERIFIED (Domain modeling only) | High | [pfms.nic.in](https://pfms.nic.in/) |
| **S13** | UIDAI (Aadhaar) | Ministry of Electronics and IT | Gov Platform | YES | PRIMARY | VERIFIED (Domain modeling only) | High | [uidai.gov.in](https://uidai.gov.in/) |

## Usage Map

- **S01**: Simulated internally within `mockData.ts` to estimate payouts.
- **S02 / S03**: Researched to structure the physical gate pass lifecycle and J-Form PDF outputs.
- **S04 / S05**: Researched to distinguish KisanFlow's physical logistics focus from e-NAM's trading focus.
- **S06**: Academic basis for addressing yard congestion and assaying bottlenecks.
- **S07**: Directly implemented in `security.py` via `pyjwt` and HMAC-SHA256 signature verification.
- **S08 / S09**: Current infrastructure costs validating the feasibility of cloud hosting.
- **S10**: Directly implemented in `geoUtils.ts` and `predictions.py` for mandi radar localization.
- **S11**: Directly implemented in `api/v1/endpoints/bookings.py` using `with_for_update()`.
- **S12 / S13**: Extensively researched to design interoperable database schemas and mock response structures, though not actively networked.
