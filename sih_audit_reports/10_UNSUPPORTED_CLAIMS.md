# KisanFlow — 10 Unsupported Claims

> **SIH 2026 · SIH26032 · Cold Cipher**

[← Audit Index](README.md) · [01 Source Audit](01_SOURCE_AUDIT.md) · [02 Claim Matrix](02_CLAIM_SOURCE_MATRIX.md) · [03 Implementation](03_IMPLEMENTATION_PROVENANCE.md) · [04 Systems](04_EXISTING_SYSTEM_COMPARISON.md) · [05 Cost](05_PRICING_COST_AUDIT.md) · [06 Tech Stack](06_TECH_STACK_REFERENCES.md) · [07 Security](07_SECURITY_AUDIT.md) · [08 Research](08_RESEARCH_PAPERS.md) · [09 Bibliography](09_FULL_BIBLIOGRAPHY.md) · [10 Unsupported](10_UNSUPPORTED_CLAIMS.md) · [11 Defense](11_JUDGE_DEFENSE.md) · [12 Slide 6](12_SLIDE_6_RESEARCH_REFERENCES.md)

**Purpose:** Identifies claims that must be removed from presentations and documentation due to a lack of codebase evidence or verifiable external backing.

| Field | Value |
|---|---|
| Project | KisanFlow |
| SIH Problem | SIH26032 |
| Team | Cold Cipher |
| Document Type | Internal Audit / Warning |
| Verification Scope | Pitch vs Codebase |
| Last Audit Status | Verified |

---

> [!CAUTION]
> Presenting these claims to a technical jury could result in the project being penalized for hallucination or misrepresentation.

## 1. "AI / MACHINE LEARNING WAIT TIME PREDICTION"
- **The Problem**: The actual implementation in predictions.py uses a deterministic mathematical heuristic (Score = (1 - utilization) * 100). There are no neural networks, trained models, or ML libraries (e.g., scikit-learn, PyTorch) in the backend.
- **Action Required**: Remove all mentions of "AI" or "Machine Learning".
- **Safe Alternative**: "Deterministic, capacity-aware utilization algorithm."

## 2. "REDUCES MANDI WAITING TIMES BY 60-70%"
- **The Problem**: While the software is designed to distribute loads, we have not conducted physical pilot tests at a real APMC yard to prove a 60% reduction.
- **Action Required**: Remove absolute performance guarantees.
- **Safe Alternative**: "Designed to significantly reduce yard congestion by distributing peak arrival loads."

## 3. "FULLY INTEGRATED WITH PFMS / UIDAI / e-NAM"
- **The Problem**: The system does not actively communicate with live government servers. It generates simulated DBT payment references and Aadhaar-linked mock profiles.
- **Action Required**: Never claim "fully integrated" or "live connection."
- **Safe Alternative**: "Features a domain-accurate, interoperable schema designed to hook into existing PFMS and e-NAM APIs."

## 4. "LIVE GOOGLE MAPS ROUTING"
- **The Problem**: The code strictly utilizes the Haversine mathematical formula (geoUtils.ts) on static Longitude/Latitude coordinates. We are not paying for or querying Google Maps APIs.
- **Action Required**: Remove mentions of Google Maps or live traffic routing.
- **Safe Alternative**: "Utilizes offline, mathematical distance computation (Haversine) to recommend the nearest active mandi."

## 5. "COMPLETELY FREE FOR NATIONWIDE DEPLOYMENT"
- **The Problem**: The current deployment relies on Vercel's Hobby tier (strictly non-commercial) and Render's Free tier (where PostgreSQL databases expire and delete all data after 30 days).
- **Action Required**: Do not claim the system scales nationally for .
- **Safe Alternative**: "Currently deployed on a zero-cost prototype stack, engineered to scale on state-level enterprise cloud infrastructure."

---

**Quick Links**
- [🌐 Farmer Portal](https://management-app-fawn-five.vercel.app/)
- [🏢 Operator Console](https://management-app-mugal1.vercel.app/)
- [⚡ Swagger API](https://kisanflow-backend.onrender.com/docs)
- [📖 ReDoc](https://kisanflow-backend.onrender.com/redoc)
- [📱 Expo App](https://expo.dev/accounts/mugazhv/projects/farmer-mobile)
- [💻 GitHub Repository](https://github.com/mugazhvan/cold-cipher-proc)

[← Back to Audit Index](README.md)
