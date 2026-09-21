# KisanFlow — Full Research & Provenance Audit

**Smart India Hackathon 2026**  
**Problem Statement:** SIH26032  
**Problem:** Farmers often face long waiting time, lack of information regarding procurement schedules, and uncertainty about procurement status.  
**Team:** Cold Cipher  
**Team ID:** 242

> This audit separates external research from implementation evidence and clearly marks what is implemented, simulated, proposed, or unsupported. It is intended for the GitHub repository and for judge verification.

---

## 1. Project at a Glance

**KisanFlow** is a procurement coordination platform designed to synchronize farmer arrivals with procurement-centre capacity and operations.

The system focuses on:

- capacity-aware slot booking
- live queue and arrival coordination
- QR-based gate verification
- procurement-status tracking
- digital procurement records
- nearby procurement-centre discovery
- operator-controlled capacity and scheduling

The project is a coordination and physical-workflow layer. It does **not** replace e-NAM's electronic trading function.

---

## 2. Live Demo & Project Links

| Resource | Link |
|---|---|
| Farmer Web Portal | https://management-app-fawn-five.vercel.app/ |
| Operator Console | https://management-app-mugal1.vercel.app/ |
| REST API / Swagger | https://kisanflow-backend.onrender.com/docs |
| ReDoc API Reference | https://kisanflow-backend.onrender.com/redoc |
| Farmer Mobile App | https://expo.dev/accounts/mugazhv/projects/farmer-mobile |
| Source Repository | https://github.com/mugazhvan/cold-cipher-proc |
| Testing & Verification | https://github.com/mugazhvan/cold-cipher-proc/blob/main/docs/TESTING_AND_VERIFICATION.md |

> **Demo status:** These are deployment/demo surfaces, not external research sources.

---

## 3. Research Sources — Primary Set

### R01 — e-Kharid Haryana
**Organization:** Government of Haryana  
**URL:** https://ekharid.haryanafood.gov.in/

**Why we used it:** Studied an existing state digital procurement workflow covering farmer details, procurement, quality checks, storage and payment, including gate-pass/J-Form related operations.

**Use in KisanFlow:** Domain and workflow research only; KisanFlow is not presented as an official extension of e-Kharid.

### R02 — Anaaj Kharid Punjab
**Organization:** Department of Food, Civil Supplies & Consumer Affairs, Government of Punjab  
**URL:** https://anaajkharid.in/

**Why we used it:** Studied farmer registration, procurement workflow and existing digital gate-pass / field-verification practices.

**Use in KisanFlow:** Domain research for farmer onboarding, procurement stages and digital record design.

### R03 — e-NAM (National Agriculture Market)
**Organization:** Government of India / Ministry of Agriculture & Farmers' Welfare  
**URL:** https://enam.gov.in/

**Why we used it:** Used as the reference point for India's existing national electronic agricultural-market ecosystem.

**Use in KisanFlow:** Helps define the boundary between electronic market/trading functions and KisanFlow's physical queue, arrival and capacity-coordination focus.

### R04 — AGMARKNET
**Organization:** Directorate of Marketing & Inspection (DMI), Government of India  
**URL:** https://agmarknet.gov.in/

**Why we used it:** Referenced for agricultural market information and commodity/market-data context.

**Use in KisanFlow:** Research and future interoperability context; no claim of live AGMARKNET integration is made.

### R05 — Performance Evaluation of e-National Agriculture Market
**Organization:** CCS National Institute of Agricultural Marketing (CCS NIAM)  
**URL:** https://www.ccsniam.gov.in/research

**Why we used it:** Used research/evaluation material to understand operational bottlenecks and constraints around the e-NAM ecosystem.

**Use in KisanFlow:** Supports the rationale for addressing physical operational coordination rather than building another generic trading interface.

### R06 — Minimum Support Prices (MSP)
**Organization:** Department of Agriculture & Farmers Welfare, Government of India  
**URL:** https://desagri.gov.in/notifications/

**Why we used it:** Official source for MSP information and crop/pricing domain context.

**Use in KisanFlow:** Supports configurable crop/MSP data used in the demonstration. Demo values must be kept current or explicitly labelled as mock/historical.

### R07 — OWASP JSON Web Token Security Cheat Sheet
**Organization:** OWASP Foundation  
**URL:** https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html

**Why we used it:** Provides security guidance relevant to signed JWTs and HMAC-based signatures.

**Use in KisanFlow:** Security reference for JWT/HMAC-SHA256 implementation and verification practices.

---

## 4. Technical References Used Outside the Slide-6 Primary Set

These support implementation or deployment decisions and belong in the full repository audit rather than the main presentation reference list.

| Reference | Purpose | URL |
|---|---|---|
| Vercel Pricing | Prototype/frontend hosting cost audit | https://vercel.com/pricing |
| Render Pricing | Prototype/backend hosting cost audit | https://render.com/pricing |
| React | Frontend implementation reference | https://react.dev/ |
| TypeScript | Frontend type system reference | https://www.typescriptlang.org/ |
| Vite | Frontend build tooling reference | https://vite.dev/ |
| Tailwind CSS | UI styling reference | https://tailwindcss.com/docs/ |
| FastAPI | Backend API framework reference | https://fastapi.tiangolo.com/ |
| Pydantic | API validation reference | https://docs.pydantic.dev/ |
| SQLAlchemy | ORM/data-access reference | https://docs.sqlalchemy.org/en/20/ |
| Alembic | Database migration reference | https://alembic.sqlalchemy.org/en/latest/ |
| PyJWT | JWT implementation reference | https://pyjwt.readthedocs.io/ |
| bcrypt | Password hashing reference | https://github.com/pyca/bcrypt |
| FPDF2 | PDF/document generation reference | https://py-pdf.github.io/fpdf2/ |
| Expo | Farmer mobile application reference | https://expo.dev/ |

**Reference-set decision:** PostgreSQL documentation is intentionally **not included in the Slide-6 research/reference set**. Concurrency behaviour is treated as implementation evidence verified from the project code/tests rather than as a presentation research citation.

---

## 5. Implementation Status Audit

| Feature | Status | Evidence / Notes | Safe wording |
|---|---|---|---|
| Farmer registration & login | IMPLEMENTED | Auth endpoints and farmer flows | Farmers can register and log in through the platform. |
| Slot discovery & booking | IMPLEMENTED | Booking API and frontend flow | Farmers can view and book available procurement slots. |
| Capacity management | IMPLEMENTED | Booking/capacity checks and concurrency tests | The platform enforces configured capacity during booking. |
| Queue management | IMPLEMENTED | Queue/token state and operator controls | Operators manage the live farmer queue and progression states. |
| QR generation & verification | IMPLEMENTED | Signed QR/JWT workflow | The platform uses HMAC-SHA256 signed QR passes for verification. |
| Nearby-centre discovery | IMPLEMENTED | Haversine distance calculation | The platform calculates local distance to recommend nearby centres. |
| Wait-time estimation | IMPLEMENTED — HEURISTIC | Deterministic utilization logic | Uses a deterministic, capacity-aware heuristic to estimate congestion/wait time. |
| Digital procurement receipt | IMPLEMENTED — PROTOTYPE | PDF generation | Generates a digital Form J-style procurement receipt. |
| Payment/DBT references | SIMULATED | Mock/domain data | Demonstrates the payment-status workflow with simulated references. |
| e-NAM / AGMARKNET connectivity | SIMULATED / DOMAIN MODEL | No live external API connection verified | Schema/workflow is designed with future interoperability in mind. |
| UIDAI / Aadhaar backend integration | SIMULATED / DOMAIN MODEL | No live UIDAI integration verified | Data structures support future identity-integration hooks. |
| PFMS integration | SIMULATED / DOMAIN MODEL | No live PFMS integration verified | Data structures support future payment-system integration. |
| SMS / WhatsApp notifications | PROPOSED / SIMULATED | UI/demo behaviour | Notification flow is demonstrated but external messaging is not live. |
| AI / ML model | NOT IMPLEMENTED | No trained ML model identified in the audited codebase | Do not describe the current heuristic as AI/ML. |

---

## 6. Claim Audit — What We Say vs What We Can Prove

### Claim: “Reduces mandi waiting time by 60–70%”
**Status:** NOT VERIFIED.  
**Reason:** No physical pilot dataset proves this percentage.  
**Safe wording:** “Designed to reduce congestion by distributing peak arrivals through controlled slots.”

### Claim: “AI-driven wait-time prediction”
**Status:** NOT VERIFIED / NOT IMPLEMENTED.  
**Reason:** Current wait-time logic is deterministic and rule-based.  
**Safe wording:** “Deterministic, capacity-aware heuristic for congestion and wait-time estimation.”

### Claim: “Cryptographically secure e-Gate passes”
**Status:** IMPLEMENTED.  
**Evidence:** JWT signed with HMAC-SHA256.  
**Safe wording:** “Uses HMAC-SHA256 signed QR passes for verifiable gate authentication.”

### Claim: “Zero overbooking”
**Status:** SOFTWARE BEHAVIOUR VERIFIED BY CODE/TESTS.  
**Evidence:** Transactional capacity controls and concurrency testing.  
**Safe wording:** “Concurrent bookings are handled transactionally so configured slot capacity is enforced.”

### Claim: “Live Google Maps integration”
**Status:** NOT IMPLEMENTED.  
**Reason:** The audited implementation uses mathematical Haversine distance on stored coordinates.  
**Safe wording:** “Uses Haversine distance calculation for nearby-centre discovery.”

### Claim: “Fully integrated with PFMS / UIDAI / e-NAM”
**Status:** NOT VERIFIED.  
**Reason:** The project contains domain models/simulation rather than authorized live integrations.  
**Safe wording:** “Provides an interoperability-ready prototype schema for future integration.”

### Claim: “Replaces official Form J”
**Status:** TOO STRONG.  
**Safe wording:** “Generates a digital Form J-style procurement receipt for the prototype workflow.”

### Claim: “Completely free nationwide deployment”
**Status:** NOT SUPPORTED.  
**Reason:** Current hosting is a prototype setup and production-scale deployment has infrastructure costs and provider constraints.  
**Safe wording:** “Currently demonstrated on a low-cost prototype deployment and designed for migration to production infrastructure.”

---

## 7. Existing System Comparison

| Area | Existing ecosystem | KisanFlow focus |
|---|---|---|
| e-NAM | National electronic agricultural-market platform | Physical procurement coordination around arrivals, slots and queue states |
| Haryana e-Kharid | State procurement workflow and farmer-facing digital services | Capacity-aware scheduling and live operational coordination |
| Punjab Anaaj Kharid | State procurement and farmer-registration workflow | Unified booking, gate verification and queue tracking |
| AGMARKNET | Agricultural market information/data infrastructure | Nearby-centre discovery and future interoperability context |

### Differentiation Statement

KisanFlow is **not positioned as a replacement for e-NAM or state procurement portals**. Its differentiating focus is coordinating the physical arrival and movement of farmers through procurement-centre capacity, booking, gate verification, queue and procurement-status states.

---

## 8. Security Audit

### Signed QR / JWT

The backend uses JWTs with HMAC-SHA256 signatures for the QR/e-pass workflow. OWASP's JWT guidance recognises HMAC with SHA-2 as a standard MAC option for signed JWTs.

**Do not claim:**
- 100% unhackable
- military-grade encryption
- absolute fraud prevention

### Password Security

The project uses bcrypt-based password hashing rather than plaintext password storage.

### Role-Based Access Control

The backend separates farmer and operator permissions through role-based access controls.

### Concurrency

Concurrent booking behaviour is validated from the implementation and its tests. The presentation should describe the observed behaviour without turning it into an absolute production guarantee across every deployment architecture.

---

## 9. Deployment & Cost Audit

### Current Prototype

- Farmer web portal: Vercel
- Operator console: Vercel
- Backend API: Render
- Database: Hosted with the deployed prototype environment
- Farmer mobile app: Expo

### Cost References

**Vercel:** https://vercel.com/pricing  
**Render:** https://render.com/pricing

Prototype hosting costs can be low or zero under applicable free tiers, but this must not be represented as a permanent nationwide production cost model.

### Mapping Cost

The audited nearby-centre calculation uses the Haversine mathematical formula locally. No live Google Maps or Mapbox API is required for that calculation.

---

## 10. Research Method

The project research was organized around four questions:

1. **What already exists?** — State and national procurement platforms.
2. **What operational workflow needs coordination?** — Farmer arrival, gate verification, queue and procurement states.
3. **What external standards should support implementation?** — Security, frontend/backend, hosting and document-generation references.
4. **Which claims are actually proven by the code?** — Implementation/provenance audit and claim matrix.

This prevents research findings from being presented as if they were measured project outcomes.

---

## 11. Research → Design Mapping

| Research input | Design decision in KisanFlow |
|---|---|
| e-Kharid workflow research | Model procurement-centre and farmer operational flow |
| Anaaj Kharid workflow research | Model registration, gate verification and procurement records |
| e-NAM ecosystem | Position KisanFlow as a coordination layer, not a trading replacement |
| AGMARKNET market-data context | Keep future data interoperability in mind |
| CCS NIAM evaluation material | Focus on physical operational bottlenecks and coordination |
| Official MSP notifications | Use configurable crop/MSP domain data |
| OWASP JWT guidance | Use signed JWT/HMAC-SHA256 mechanism for verification |

---

## 12. Known Limitations

1. No physical deployment at a live procurement centre has been used to measure real-world waiting-time reduction.
2. Wait-time estimation is heuristic rather than trained machine learning.
3. PFMS, UIDAI and e-NAM are not live production integrations in the current prototype.
4. Nearby-centre discovery is distance-based rather than live road-traffic routing.
5. Demo pricing/crop values must be refreshed or clearly labelled whenever the underlying official data changes.
6. External notification channels are not live unless separately integrated.
7. Production deployment would require appropriate government authorization, infrastructure, identity controls, observability, backups and compliance processes.

---

## 13. Judge-Ready Answers

### “Doesn't e-NAM already do this?”
KisanFlow is not intended to replace e-NAM. e-NAM is a national electronic trading platform; KisanFlow focuses on the physical procurement-centre coordination layer — controlled arrivals, capacity, gate verification, queue state and procurement progress.

### “Are you actually using AI?”
Not in the current prototype. The wait-time/congestion component is a deterministic capacity-aware heuristic. This is intentionally presented as an algorithm rather than machine learning.

### “Are PFMS and UIDAI really integrated?”
No live government-server integration is claimed. The prototype contains domain-oriented structures intended to make future authorized integration possible.

### “How do you stop two farmers taking the same capacity?”
The booking flow uses transactional concurrency controls and has been tested against concurrent booking scenarios. The important design principle is that capacity is checked and updated as one protected transaction rather than as two independent client-side actions.

### “Where did your crop/MSP values come from?”
The domain reference is the official MSP material published by the Department of Agriculture & Farmers Welfare. Demo data should always be checked against the latest applicable notification before presentation.

---

## 14. Primary Source Bibliography

1. Government of Haryana — **e-Kharid**  
   https://ekharid.haryanafood.gov.in/

2. Department of Food, Civil Supplies & Consumer Affairs, Government of Punjab — **Anaaj Kharid**  
   https://anaajkharid.in/

3. Government of India — **e-NAM**  
   https://enam.gov.in/

4. Directorate of Marketing & Inspection — **AGMARKNET**  
   https://agmarknet.gov.in/

5. CCS National Institute of Agricultural Marketing — **Research / Performance Evaluation of e-NAM**  
   https://www.ccsniam.gov.in/research

6. Department of Agriculture & Farmers Welfare, Government of India — **MSP Notifications**  
   https://desagri.gov.in/notifications/

7. OWASP Foundation — **JSON Web Token Cheat Sheet**  
   https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html

---

## 15. Audit Status

**Audit type:** Research + provenance + implementation claim audit  
**Project:** KisanFlow / SIH26032  
**Prepared for:** Cold Cipher / Smart India Hackathon 2026  
**Review basis:** Project documentation, deployed-demo references, codebase audit material, and official/technical source references.

> **Important:** This document is an evidence register. A source being listed here does not imply endorsement, partnership, certification, or official integration with KisanFlow.
