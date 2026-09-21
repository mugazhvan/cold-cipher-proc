# KisanFlow — 08 Academic & Gov Research

> **SIH 2026 · SIH26032 · Cold Cipher**

[? Audit Index](README.md) · [01 Source Audit](01_SOURCE_AUDIT.md) · [02 Claim Matrix](02_CLAIM_SOURCE_MATRIX.md) · [03 Implementation](03_IMPLEMENTATION_PROVENANCE.md) · [04 Systems](04_EXISTING_SYSTEM_COMPARISON.md) · [05 Cost](05_PRICING_COST_AUDIT.md) · [06 Tech Stack](06_TECH_STACK_REFERENCES.md) · [07 Security](07_SECURITY_AUDIT.md) · [08 Research](08_RESEARCH_PAPERS.md) · [09 Bibliography](09_FULL_BIBLIOGRAPHY.md) · [12 Slide 6](12_SLIDE_6_RESEARCH_REFERENCES.md)

**Purpose:** Lists the foundational research that validates the problem statement and justifies the algorithmic slot booking solution.

| Field | Value |
|---|---|
| Project | KisanFlow |
| SIH Problem | SIH26032 |
| Team | Cold Cipher |
| Document Type | Research & Evidence |
| Verification Scope | External References |
| Last Audit Status | Verified |

---

## 1. PERFORMANCE EVALUATION OF e-NAM
- **Organization**: CCS National Institute of Agricultural Marketing (NIAM)
- **Context**: e-NAM is the flagship digital trading platform for farmers in India.
- **Key Findings**:
  - While e-NAM successfully digitized trading, physical bottlenecks remain at the mandi gates and assaying labs.
  - Farmers often experience severe congestion because arrivals are uncoordinated.
  - Assaying (quality testing) takes significant time, leading to physical yard gridlock.
- **How KisanFlow Uses This**: ?? RESEARCHED. This report justifies our pivot away from "just another trading app" toward a **physical logistics orchestrator**. We solve the exact physical congestion bottlenecks that NIAM identified.

## 2. MINIMUM SUPPORT PRICES (MSP)
- **Organization**: Department of Agriculture & Farmers Welfare, GoI
- **Context**: Official release of MSPs for Kharif and Rabi crops.
- **How KisanFlow Uses This**: ?? SIMULATED. The schema inside mockData.ts and the Crop database models are built directly using the government's official taxonomy. This ensures our DBT (Direct Benefit Transfer) simulations are domain-accurate.

## 3. STATE-LEVEL PROCUREMENT WORKFLOWS
- **Organizations**: Haryana State Government (e-Kharid), Punjab Mandi Board (Anaaj Kharid)
- **Context**: Existing state-level digital portals.
- **How KisanFlow Uses This**: ?? RESEARCHED. We reverse-engineered the standard workflows (Farmer Registration ? Gate Pass ? Weighment ? Form J ? Payment) from these portals to ensure KisanFlow's 5-stage token tracking completely aligns with established real-world practices. 

---

> [!NOTE]
> **Important**: Do not claim we are officially endorsed by NIAM or these state boards. We merely used their public documentation and academic reports as domain research to build a highly accurate prototype.

---

**Quick Links**
- [?? Farmer Portal](https://management-app-fawn-five.vercel.app/)
- [?? Operator Console](https://management-app-mugal1.vercel.app/)
- [? Swagger API](https://kisanflow-backend.onrender.com/docs)
- [?? ReDoc](https://kisanflow-backend.onrender.com/redoc)
- [?? Expo App](https://expo.dev/accounts/mugazhv/projects/farmer-mobile)
- [?? GitHub Repository](https://github.com/mugazhvan/cold-cipher-proc)

[? Back to Audit Index](README.md)
