# KisanFlow — 04 Existing System Comparison

> **SIH 2026 · SIH26032 · Cold Cipher**

[← Audit Index](README.md) · [01 Source Audit](01_SOURCE_AUDIT.md) · [02 Claim Matrix](02_CLAIM_SOURCE_MATRIX.md) · [03 Implementation](03_IMPLEMENTATION_PROVENANCE.md) · [04 Systems](04_EXISTING_SYSTEM_COMPARISON.md) · [05 Cost](05_PRICING_COST_AUDIT.md) · [06 Tech Stack](06_TECH_STACK_REFERENCES.md) · [07 Security](07_SECURITY_AUDIT.md) · [08 Research](08_RESEARCH_PAPERS.md) · [09 Bibliography](09_FULL_BIBLIOGRAPHY.md) · [10 Unsupported](10_UNSUPPORTED_CLAIMS.md) · [11 Defense](11_JUDGE_DEFENSE.md) · [12 Slide 6](12_SLIDE_6_RESEARCH_REFERENCES.md)

**Purpose:** Differentiates KisanFlow from existing government systems (e-NAM, e-Kharid) by outlining exact capabilities and gaps.

| Field | Value |
|---|---|
| Project | KisanFlow |
| SIH Problem | SIH26032 |
| Team | Cold Cipher |
| Document Type | Technical & Research |
| Verification Scope | Current repository |
| Last Audit Status | Verified |

---

## CORE SYSTEM COMPARISON

| Feature/Domain | e-NAM (National) | State Portals (e.g., e-Kharid) | KisanFlow (Our System) | What KisanFlow Adds |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Purpose** | Pan-India electronic trade / bidding. | State-specific farmer registration & procurement. | **Physical Queue Orchestration** | Focuses strictly on physical yard movement, assaying bottlenecks, and gate access. |
| **Slot Booking** | ❌ NOT IMPLEMENTED | ✅ (Static Gate Passes) | ✅ IMPLEMENTED (Dynamic) | Introduces **transactional database locking** to prevent overbooking, with dynamic recommendations. |
| **Security Pass** | Standard printed receipts. | SMS/QR-based pass. | ✅ IMPLEMENTED (Crypto E-Pass) | Gate passes are cryptographically verified instantly without continuous internet at checkposts. |
| **Queue Management**| Manual yard management. | Manual token assignment. | ✅ IMPLEMENTED (Live Tracking) | Automates the state machine (Gate ➔ Yard ➔ Assay ➔ Weighbridge ➔ Payout) with operator dispatching. |
| **Mandi Discovery** | Directory listings. | Fixed registration to specific mandis. | ✅ IMPLEMENTED (360° Radar) | Uses geolocation to show real-time congestion at nearby alternative procurement centres. |

---

## OFFICIAL SYSTEM CLARIFICATIONS

<details>
<summary><strong>View Detailed Clarifications</strong></summary>

- **e-NAM**: The National Agriculture Market is an electronic trading portal networking APMCs to create a unified national market. It is *not* a gate-level queue management system. KisanFlow is positioned as a logistics pre-processor that feeds verified assay data *into* e-NAM.
- **e-Kharid (Haryana)**: Handles farmer registration (Meri Fasal Mera Byora), gate pass generation, and J-Form creation. KisanFlow improves on this by adding strict concurrency controls to the booking engine to prevent the severe yard congestion frequently reported during peak harvest.
- **PFMS (Public Financial Management System)**: The backend for Direct Benefit Transfers (DBT). KisanFlow does not replace PFMS; it calculates the net MSP payout and generates a simulated DBT reference schema designed to be transmitted to PFMS.

> [!IMPORTANT]
> **Crucial Pitch Advice:** Never state "KisanFlow is the only system that does X" unless verified. State: "While platforms like e-Kharid handle registration, KisanFlow introduces offline-verifiable cryptographic passes and active queue tracking to solve physical yard congestion."

</details>

---

**Quick Links**
- [🌐 Farmer Portal](https://management-app-fawn-five.vercel.app/)
- [🏢 Operator Console](https://management-app-mugal1.vercel.app/)
- [⚡ Swagger API](https://kisanflow-backend.onrender.com/docs)
- [📖 ReDoc](https://kisanflow-backend.onrender.com/redoc)
- [📱 Expo App](https://expo.dev/accounts/mugazhv/projects/farmer-mobile)
- [💻 GitHub Repository](https://github.com/mugazhvan/cold-cipher-proc)

[← Back to Audit Index](README.md)
