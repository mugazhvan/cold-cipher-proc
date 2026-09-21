# KisanFlow — 02 Claim Source Matrix

> **SIH 2026 · SIH26032 · Cold Cipher**

[← Audit Index](README.md) · [01 Source Audit](01_SOURCE_AUDIT.md) · [02 Claim Matrix](02_CLAIM_SOURCE_MATRIX.md) · [03 Implementation](03_IMPLEMENTATION_PROVENANCE.md) · [04 Systems](04_EXISTING_SYSTEM_COMPARISON.md) · [05 Cost](05_PRICING_COST_AUDIT.md) · [06 Tech Stack](06_TECH_STACK_REFERENCES.md) · [07 Security](07_SECURITY_AUDIT.md) · [08 Research](08_RESEARCH_PAPERS.md) · [09 Bibliography](09_FULL_BIBLIOGRAPHY.md) · [10 Unsupported](10_UNSUPPORTED_CLAIMS.md) · [11 Defense](11_JUDGE_DEFENSE.md) · [12 Slide 6](12_SLIDE_6_RESEARCH_REFERENCES.md)

**Purpose:** Verifies the primary claims made in presentations, READMEs, and pitches against the actual implementation codebase and external sources.

| Field | Value |
|---|---|
| Project | KisanFlow |
| SIH Problem | SIH26032 |
| Team | Cold Cipher |
| Document Type | Technical & Evidence |
| Verification Scope | Current repository |
| Last Audit Status | Verified |

---

## CLAIM VERIFICATION MATRIX

| Claim | Source / Evidence | Verified? | Safe to say in SIH? | Recommended Wording |
| :--- | :--- | :--- | :--- | :--- |
| **"Reduces mandi waiting times by 60-70%"** | Projected hypothesis. No field data exists. | ❌ NOT IMPLEMENTED | ❌ NO | "Our slot-based heuristic scheduling is **designed to distribute peak loads**, targeting significant reductions in yard congestion." |
| **"AI-driven wait time prediction"** | predictions.py (Rule-based heuristic) | ❌ NOT IMPLEMENTED | ❌ NO | "Uses a deterministic, capacity-aware heuristic algorithm to balance mandi loads and estimate wait times." |
| **"Zero overbooking at mandis"** | PostgreSQL with_for_update() row-locks & Concurrency tests (	est_concurrency.py) | 🧪 TESTED | ✅ YES | "Guarantees exact capacity enforcement using ACID-compliant database row-level locking, preventing double-bookings." |
| **"Cryptographically secure e-Gate passes"** | security.py using HMAC-SHA256 & OWASP Guidelines | ✅ IMPLEMENTED | ✅ YES | "Uses HMAC-SHA256 signed QR codes to generate verifiable, tamper-resistant digital e-Gate passes." |
| **"Live Google Maps integration for routing"** | Not found in code. Only Haversine formula is used (geoUtils.ts). | ❌ NOT IMPLEMENTED | ❌ NO | "Utilizes the mathematical Haversine formula to compute offline distance and recommend the nearest Mandi." |
| **"Integrates with PFMS / e-NAM / UIDAI"** | Codebase review (Uses simulated schemas) | ⚠️ SIMULATED | ⚠️ CONDITIONAL | "Demonstrates a domain-accurate prototype architecture designed to interface seamlessly with PFMS and e-NAM APIs." |
| **"Replaces traditional J-Forms"** | pdf_generator.py generating dynamic outputs | ✅ IMPLEMENTED | ✅ YES | "Automates the generation of standard digital Form 'J' procurement receipts instantly upon weighbridge clearance." |
| **"Completely free to scale nationwide"** | Render Free Tier limits (Expires in 30 days) | ❌ NOT IMPLEMENTED | ❌ NO | "Currently deployed on a zero-cost prototype stack (Vercel/Render), designed to scale on enterprise infrastructure." |
| **"Calculates precise MSP payments"** | Simulated arrays in mockData.ts (currently outdated to 2023-24 rates) | ⚠️ SIMULATED | ⚠️ CONDITIONAL | "Dynamically calculates payouts based on configurable Minimum Support Price (MSP) schemas." |

---

**Quick Links**
- [🌐 Farmer Portal](https://management-app-fawn-five.vercel.app/)
- [🏢 Operator Console](https://management-app-mugal1.vercel.app/)
- [⚡ Swagger API](https://kisanflow-backend.onrender.com/docs)
- [📖 ReDoc](https://kisanflow-backend.onrender.com/redoc)
- [📱 Expo App](https://expo.dev/accounts/mugazhv/projects/farmer-mobile)
- [💻 GitHub Repository](https://github.com/mugazhvan/cold-cipher-proc)

[← Back to Audit Index](README.md)
