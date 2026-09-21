# KisanFlow — 05 Pricing & Cost Audit

> **SIH 2026 · SIH26032 · Cold Cipher**

[? Audit Index](README.md) · [01 Source Audit](01_SOURCE_AUDIT.md) · [02 Claim Matrix](02_CLAIM_SOURCE_MATRIX.md) · [03 Implementation](03_IMPLEMENTATION_PROVENANCE.md) · [04 Systems](04_EXISTING_SYSTEM_COMPARISON.md) · [05 Cost](05_PRICING_COST_AUDIT.md) · [06 Tech Stack](06_TECH_STACK_REFERENCES.md) · [07 Security](07_SECURITY_AUDIT.md) · [08 Research](08_RESEARCH_PAPERS.md) · [09 Bibliography](09_FULL_BIBLIOGRAPHY.md) · [12 Slide 6](12_SLIDE_6_RESEARCH_REFERENCES.md)

**Purpose:** Details the pricing and cost audit for the infrastructure and technologies used in the KisanFlow project.

| Field | Value |
|---|---|
| Project | KisanFlow |
| SIH Problem | SIH26032 |
| Team | Cold Cipher |
| Document Type | Technical Audit |
| Verification Scope | Current repository & Deployment |
| Last Audit Status | Verified |

---

## INFRASTRUCTURE & HOSTING COSTS

| Service / Component | Provider | Plan / Tier | Current Price | Free Tier Limits | Status in Project |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Web Hosting** | Vercel | Hobby | \ / mo | Non-commercial use, 100GB bandwidth | ? IMPLEMENTED (Currently deployed) |
| **Frontend Web Hosting** | Vercel | Pro | \ / user / mo | None | ??? PROPOSED (Required for production scale) |
| **Backend API Hosting** | Render | Free Web Service | \ / mo | Spins down after 15m inactivity | ? IMPLEMENTED (Currently deployed) |
| **Database (PostgreSQL)** | Render | Free Postgres | \ / mo | 1GB Storage, **Expires in 30 days** | ? IMPLEMENTED (Currently deployed) |
| **Database (PostgreSQL)** | Render | Basic-256MB | ~\ / mo | N/A (1GB storage included) | ??? PROPOSED (Required for persistence) |

## THIRD-PARTY APIs & INTEGRATIONS

| Technology / Integration | Provider | Usage in KisanFlow | Pricing | Open Source Alternative Used? |
| :--- | :--- | :--- | :--- | :--- |
| **Geolocation & Routing** | Google Maps API | Mandi distance calculation | ~\ per 1000 requests | ? NO (Not used in code) |
| **Geolocation (Haversine)** | Mathematical Formula | Mandi distance calculation | \ (Calculated locally) | ? YES (Implemented in geoUtils.ts) |
| **SMS / Notifications** | Twilio / MSG91 | Farmer alerts | ~\.005 per message | ? NO (Simulated locally via UI) |
| **Authentication** | Auth0 / Firebase | User login / JWT | ~\ / mo (Pro tiers) | ? NO (Custom built using bcrypt & pyjwt) |
| **Document Generation** | DocuSign / Adobe | Digital J-Forms | Paid per envelope | ? NO (Custom built using FPDF2) |

---

## IMPORTANT COST LIMITATIONS FOR SIH PITCH

> [!WARNING]
> 1. **"Completely Free Nationwide Deployment"**: Do not claim this. The current zero-cost stack relies on Vercel's Hobby tier (strictly non-commercial) and Render's Free PostgreSQL (which **deletes data after 30 days**).
> 2. **Mapping Costs**: We save significant operational costs by strictly using the mathematical **Haversine formula** to compute distances between static lat/lon coordinates. We are *not* incurring Google Maps API routing charges. This is a massive cost-saving feature.
> 3. **Authentication Costs**: By implementing our own OAuth2/JWT issuing service with passlib and pyjwt, we avoid vendor lock-in and monthly fees associated with Auth0 or Firebase Auth.

---

**Quick Links**
- [?? Farmer Portal](https://management-app-fawn-five.vercel.app/)
- [?? Operator Console](https://management-app-mugal1.vercel.app/)
- [? Swagger API](https://kisanflow-backend.onrender.com/docs)
- [?? ReDoc](https://kisanflow-backend.onrender.com/redoc)
- [?? Expo App](https://expo.dev/accounts/mugazhv/projects/farmer-mobile)
- [?? GitHub Repository](https://github.com/mugazhvan/cold-cipher-proc)

[? Back to Audit Index](README.md)
