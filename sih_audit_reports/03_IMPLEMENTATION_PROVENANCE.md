# KisanFlow — 03 Implementation Provenance

> **SIH 2026 · SIH26032 · Cold Cipher**

[← Audit Index](README.md) · [01 Source Audit](01_SOURCE_AUDIT.md) · [02 Claim Matrix](02_CLAIM_SOURCE_MATRIX.md) · [03 Implementation](03_IMPLEMENTATION_PROVENANCE.md) · [04 Systems](04_EXISTING_SYSTEM_COMPARISON.md) · [05 Cost](05_PRICING_COST_AUDIT.md) · [06 Tech Stack](06_TECH_STACK_REFERENCES.md) · [07 Security](07_SECURITY_AUDIT.md) · [08 Research](08_RESEARCH_PAPERS.md) · [09 Bibliography](09_FULL_BIBLIOGRAPHY.md) · [10 Unsupported](10_UNSUPPORTED_CLAIMS.md) · [11 Defense](11_JUDGE_DEFENSE.md) · [12 Slide 6](12_SLIDE_6_RESEARCH_REFERENCES.md)

**Purpose:** Precisely classifies major project features based on actual codebase forensics.

| Field | Value |
|---|---|
| Project | KisanFlow |
| SIH Problem | SIH26032 |
| Team | Cold Cipher |
| Document Type | Technical & Evidence |
| Verification Scope | Current repository |
| Last Audit Status | Verified |

---

## CLASSIFICATION MATRIX

This matrix precisely classifies major project features into categories based on the actual codebase forensics: **IMPLEMENTED**, **SIMULATED**, **PROPOSED**, and **RESEARCHED**.

| Feature | Status | Code Evidence | Safe Presentation Wording |
| :--- | :--- | :--- | :--- |
| **Farmer Registration & Login** | ✅ IMPLEMENTED | POST /api/v1/auth/login | "Farmers can securely register and log in via phone-based authentication." |
| **Slot Booking & Discovery** | ✅ IMPLEMENTED | POST /api/v1/bookings | "Farmers can discover active mandis and book guaranteed delivery slots." |
| **Capacity Management (Zero Overbooking)** | ✅ IMPLEMENTED | DB CheckConstraint ooked_count <= capacity | "PostgreSQL row-level locking ensures strict daily yard capacities." |
| **Queue Management & State Machine** | ✅ IMPLEMENTED | QueueToken model, POST /queue/{id}/call | "Live 5-stage token tracking orchestrates farmer movement from gate to weighbridge." |
| **QR Generation & Verification** | ✅ IMPLEMENTED | security.py (HMAC-SHA256) | "Issues offline-verifiable, cryptographically signed E-Gate passes." |
| **Nearby Centre Discovery** | ✅ IMPLEMENTED | geoUtils.ts (Haversine formula) | "Calculates distance to nearest active procurement centres dynamically." |
| **Wait-time Estimation** | ✅ IMPLEMENTED | predictions.py (Utilization math) | "Deterministic, capacity-aware utilization logic estimates active yard congestion." |
| **Document Generation (J-Form)** | ✅ IMPLEMENTED | pdf_generator.py | "Automates standard digital Form 'J' procurement receipts instantly." |
| **Payment Status / Calculation** | ⚠️ SIMULATED | Returns fake DBT-YYYYMMDD-XXXX | "Generates domain-accurate DBT payment references upon weighment." |
| **e-NAM / AGMARKNET Integration** | ⚠️ SIMULATED | N/A (Schema only) | "Features a schema designed for seamless interoperability with e-NAM." |
| **UIDAI (Aadhaar) / PFMS** | ⚠️ SIMULATED | N/A (Schema only) | "Data architecture is structured to support future PFMS/UIDAI hooks." |
| **Notifications (SMS / WhatsApp)** | 🛠️ PROPOSED | UI displays mock "SMS Sent" toasts | "UI simulates real-time SMS broadcast notifications for non-smartphone users." |
| **AI / ML Recommendations** | ❌ NOT IMPLEMENTED | predictions.py contains no ML logic | *(Do not claim AI/ML. Claim "Algorithm" or "Heuristic" instead)* |

---

**Quick Links**
- [🌐 Farmer Portal](https://management-app-fawn-five.vercel.app/)
- [🏢 Operator Console](https://management-app-mugal1.vercel.app/)
- [⚡ Swagger API](https://kisanflow-backend.onrender.com/docs)
- [📖 ReDoc](https://kisanflow-backend.onrender.com/redoc)
- [📱 Expo App](https://expo.dev/accounts/mugazhv/projects/farmer-mobile)
- [💻 GitHub Repository](https://github.com/mugazhvan/cold-cipher-proc)

[← Back to Audit Index](README.md)
