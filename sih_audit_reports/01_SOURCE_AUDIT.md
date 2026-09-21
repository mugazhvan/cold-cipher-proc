# KisanFlow — 01 Source Audit

> **SIH 2026 · SIH26032 · Cold Cipher**

[? Audit Index](README.md) · [01 Source Audit](01_SOURCE_AUDIT.md) · [02 Claim Matrix](02_CLAIM_SOURCE_MATRIX.md) · [03 Implementation](03_IMPLEMENTATION_PROVENANCE.md) · [04 Systems](04_EXISTING_SYSTEM_COMPARISON.md) · [05 Cost](05_PRICING_COST_AUDIT.md) · [06 Tech Stack](06_TECH_STACK_REFERENCES.md) · [07 Security](07_SECURITY_AUDIT.md) · [08 Research](08_RESEARCH_PAPERS.md) · [09 Bibliography](09_FULL_BIBLIOGRAPHY.md) · [12 Slide 6](12_SLIDE_6_RESEARCH_REFERENCES.md)

**Purpose:** Complete inventory of all external sources, government platforms, academic papers, and technical documentation utilized or researched for KisanFlow.

| Field | Value |
|---|---|
| Project | KisanFlow |
| SIH Problem | SIH26032 |
| Team | Cold Cipher |
| Document Type | Research & Evidence |
| Verification Scope | Current repository |
| Last Audit Status | Verified |

---

## 1. PROJECT AT A GLANCE

KisanFlow is a procurement coordination platform connecting farmers
with procurement-centre capacity, scheduling, queue management and
procurement status tracking.

Problem Statement:
SIH26032 — Farmers often face long waiting times, lack of information
regarding procurement schedules, and uncertainty about procurement status.

---

## 2. IMPLEMENTATION STATUS

| Feature | Status |
|---|---|
| Farmer registration/login | ? IMPLEMENTED |
| Slot booking | ? IMPLEMENTED |
| Capacity enforcement | ? IMPLEMENTED |
| Queue management | ? IMPLEMENTED |
| QR generation & verification | ? IMPLEMENTED |
| Nearby centre discovery | ? IMPLEMENTED |
| Wait-time estimation | ? IMPLEMENTED (Deterministic Heuristic) |
| Digital procurement receipt | ? IMPLEMENTED (PDF Prototype) |
| Payment/DBT | ?? SIMULATED |
| PFMS integration | ?? SIMULATED / ??? PROPOSED |
| UIDAI/Aadhaar integration | ?? SIMULATED / ??? PROPOSED |
| e-NAM integration | ?? SIMULATED / ??? PROPOSED |
| AGMARKNET integration | ?? SIMULATED / ??? PROPOSED |
| SMS/WhatsApp | ?? SIMULATED / ??? PROPOSED |
| AI/ML recommendation | ? NOT IMPLEMENTED |

> [!NOTE]
> See [03 Implementation Provenance](03_IMPLEMENTATION_PROVENANCE.md) for full code-level evidence.

---

## 3. MASTER SOURCE AUDIT

This section inventories all external sources—including official government platforms, academic papers, documentation, pricing pages, and standards—utilized or researched for the KisanFlow project (SIH26032).

### Master Source List

| ID | Source Title | Organization / Author | Source Type | Official? | Verification Status | URL / Direct Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S01** | Minimum Support Prices (MSP) | Dept. of Agriculture & Farmers Welfare, GoI | Official Gov | YES | ?? EXTERNAL SOURCE | [agricoop.nic.in](https://agricoop.nic.in/) |
| **S02** | e-Kharid Haryana Portal | Govt. of Haryana | Gov Platform | YES | ?? EXTERNAL SOURCE | [ekharid.haryana.gov.in](https://ekharid.haryana.gov.in/) |
| **S03** | Anaaj Kharid Punjab Portal | Punjab Mandi Board | Gov Platform | YES | ?? EXTERNAL SOURCE | [anaajkharid.in](https://anaajkharid.in/) |
| **S04** | e-NAM (National Agriculture Market) | Ministry of Agriculture, GoI | Gov Platform | YES | ?? EXTERNAL SOURCE | [enam.gov.in](https://enam.gov.in/) |
| **S05** | AGMARKNET | DMI, Ministry of Agriculture | Gov Platform | YES | ?? EXTERNAL SOURCE | [agmarknet.gov.in](https://agmarknet.gov.in/) |
| **S06** | Performance Evaluation of e-NAM | CCS NIAM | Academic Report | YES | ?? EXTERNAL SOURCE | [ccsniam.gov.in](https://ccsniam.gov.in/) |
| **S07** | JWT Security Cheat Sheet | OWASP | Security Standard | YES | ?? EXTERNAL SOURCE | [cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html) |
| **S08** | Vercel Pricing Page | Vercel Inc. | Tech Docs | YES | ?? EXTERNAL SOURCE | [vercel.com/pricing](https://vercel.com/pricing) |
| **S09** | Render Pricing Page | Render | Tech Docs | YES | ?? EXTERNAL SOURCE | [render.com/pricing](https://render.com/pricing) |
| **S10** | Haversine Formula | Mathematical Standard | Algorithm | N/A | ?? EXTERNAL SOURCE | Standard algorithm |
| **S11** | PostgreSQL Concurrency Control | PostgreSQL Global Dev Group | Tech Docs | YES | ?? EXTERNAL SOURCE | [postgresql.org/docs](https://www.postgresql.org/docs/15/explicit-locking.html) |
| **S12** | PFMS | Ministry of Finance | Gov Platform | YES | ?? EXTERNAL SOURCE | [pfms.nic.in](https://pfms.nic.in/) |
| **S13** | UIDAI (Aadhaar) | Ministry of Electronics and IT | Gov Platform | YES | ?? EXTERNAL SOURCE | [uidai.gov.in](https://uidai.gov.in/) |

<details>
<summary><strong>View Detailed Usage Map</strong></summary>

- **S01**: ?? SIMULATED internally within mockData.ts to estimate payouts.
- **S02 / S03**: ?? RESEARCHED to structure the physical gate pass lifecycle and J-Form PDF outputs.
- **S04 / S05**: ?? RESEARCHED to distinguish KisanFlow's physical logistics focus from e-NAM's trading focus.
- **S06**: ?? RESEARCHED as academic basis for addressing yard congestion and assaying bottlenecks.
- **S07**: ? IMPLEMENTED in security.py via pyjwt and HMAC-SHA256 signature verification.
- **S08 / S09**: ?? RESEARCHED for current infrastructure costs validating the feasibility of cloud hosting.
- **S10**: ? IMPLEMENTED in geoUtils.ts and predictions.py for mandi radar localization.
- **S11**: ? IMPLEMENTED in pi/v1/endpoints/bookings.py using with_for_update().
- **S12 / S13**: ?? SIMULATED extensively researched to design interoperable database schemas and mock response structures, though not actively networked.
</details>

---

**Quick Links**
- [?? Farmer Portal](https://management-app-fawn-five.vercel.app/)
- [?? Operator Console](https://management-app-mugal1.vercel.app/)
- [? Swagger API](https://kisanflow-backend.onrender.com/docs)
- [?? ReDoc](https://kisanflow-backend.onrender.com/redoc)
- [?? Expo App](https://expo.dev/accounts/mugazhv/projects/farmer-mobile)
- [?? GitHub Repository](https://github.com/mugazhvan/cold-cipher-proc)

[? Back to Audit Index](README.md)
