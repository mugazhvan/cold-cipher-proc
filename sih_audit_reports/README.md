# 🌾 KisanFlow
## Research, Provenance & Technical Audit

> **SIH 2026 · Problem Statement SIH26032 · Cold Cipher**

### Audit at a Glance

| Area | Status |
|---|---|
| Domain Research | ✅ Verified |
| Core Booking Workflow | ✅ Implemented |
| Queue Management | ✅ Implemented |
| QR Verification | ✅ Implemented |
| Concurrent Booking Protection | 🧪 Tested |
| Wait-Time Logic | ⚠️ Deterministic Heuristic |
| PFMS / UIDAI | ⚠️ Simulation / Future |
| AI / ML | ❌ Not Implemented |

### Documentation Architecture

| Document | What a Judge Finds |
|---|---|
| [01 Source Audit](01_SOURCE_AUDIT.md) | Complete external source register |
| [02 Claim Matrix](02_CLAIM_SOURCE_MATRIX.md) | Claim → evidence → safe wording |
| [03 Implementation Provenance](03_IMPLEMENTATION_PROVENANCE.md) | What the code actually implements |
| [04 Existing Systems](04_EXISTING_SYSTEM_COMPARISON.md) | e-NAM/e-Kharid comparison |
| [05 Cost Audit](05_PRICING_COST_AUDIT.md) | Hosting and deployment feasibility |
| [06 Tech Stack](06_TECH_STACK_REFERENCES.md) | Framework and tooling references |
| [07 Security Audit](07_SECURITY_AUDIT.md) | Authentication, QR and booking security |
| [08 Research Papers](08_RESEARCH_PAPERS.md) | Academic and domain evidence |
| [09 Full Bibliography](09_FULL_BIBLIOGRAPHY.md) | Complete references |
| [10 Unsupported Claims](10_UNSUPPORTED_CLAIMS.md) | What we explicitly do NOT claim |


### System Overview

`mermaid
flowchart LR
    PPT[PPT Slide 6]
    PPT --> AUDIT[Master Audit]
    AUDIT --> SOURCES[Research Sources]
    AUDIT --> CLAIMS[Claim Verification]
    AUDIT --> CODE[Implementation Evidence]
    AUDIT --> SECURITY[Security Evidence]
    AUDIT --> COST[Cost & Deployment]
    AUDIT --> DEFENSE[Judge Defense]
`

---
**Quick Links**
- [🌐 Farmer Portal](https://management-app-fawn-five.vercel.app/)
- [🏢 Operator Console](https://management-app-mugal1.vercel.app/)
- [⚡ Swagger API](https://kisanflow-backend.onrender.com/docs)
- [📖 ReDoc](https://kisanflow-backend.onrender.com/redoc)
- [📱 Expo App](https://expo.dev/accounts/mugazhv/projects/farmer-mobile)
- [💻 GitHub Repository](https://github.com/mugazhvan/cold-cipher-proc)

