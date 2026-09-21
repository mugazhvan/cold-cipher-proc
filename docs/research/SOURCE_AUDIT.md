# KisanFlow Source & Evidence Audit

> [!IMPORTANT]
> This document provides strict provenance and evidence tracking for the KisanFlow project. No sources or figures have been invented.

## Source Audit

| ID | Source Title | Organization / Author | Type | Date Checked | Exact Project Claim Supported | Used In Project? | Tier |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S01 | Minimum Support Prices (MSP) for Kharif & Rabi Crops | Dept. of Agriculture & Farmers Welfare, GoI | Official Gov | Sept 2026 | Supports MSP pricing logic. | YES (simulated in `mockData.ts`) | 1 |
| S02 | e-Kharid Haryana Portal | Govt. of Haryana | Gov Platform | Sept 2026 | Existing gate pass generation workflows. | RESEARCHED | 1 |
| S03 | Anaaj Kharid Punjab Portal | Punjab Mandi Board | Gov Platform | Sept 2026 | J-Form generation and farmer registration. | RESEARCHED | 1 |
| S04 | e-NAM (National Agriculture Market) | Ministry of Agriculture, GoI | Gov Platform | Sept 2026 | Digital trading and quality assaying steps. | RESEARCHED | 1 |
| S05 | AGMARKNET | DMI, Ministry of Agriculture | Gov Platform | Sept 2026 | Mandi data and commodity prices reporting. | RESEARCHED | 1 |
| S06 | JWT Security Cheat Sheet | OWASP | Security Standard | Sept 2026 | Safe JWT validation & HMAC-SHA256 signature verification. | YES (in `security.py`) | 3 |
| S07 | Haversine Formula | Mathematical standard | Algorithm | Sept 2026 | Distance calculation for nearest mandi recommendation. | YES (in `geoUtils.ts` & `predictions.py`) | 4 |
| S08 | Vercel Pricing (Hobby/Pro) | Vercel Inc. | Tech Docs | Sept 2026 | Hosting costs ($0 Hobby / $20/mo Pro). | PROPOSED/USED | 3 |
| S09 | Render Pricing (PostgreSQL) | Render | Tech Docs | Sept 2026 | DB hosting costs ($0 free tier / $7/mo basic). | PROPOSED/USED | 3 |
| S10 | Performance Evaluation of e-NAM | CCS NIAM | Academic / Report | Sept 2026 | Congestion, assaying bottlenecks, and waiting times in mandis. | RESEARCHED | 2 |

---

## Claim Evidence Matrix

| Claim | Source / Evidence | Verified? | Recommended Presentation Wording |
| :--- | :--- | :--- | :--- |
| "Reduces mandi waiting times by 60-70%" | `PPT_CODEBASE_EVIDENCE_REPORT.md` (Projected) | ⚠️ No | "Our slot-based heuristic scheduling is **designed to distribute peak loads**, targeting significant reductions in yard congestion." |
| "Cryptographically secure e-Gate passes" | `security.py` using HMAC-SHA256 & OWASP Guidelines (S06) | ✅ Yes | "Uses HMAC-SHA256 signed QR codes to generate verifiable, tamper-resistant digital e-Gate passes." |
| "Zero overbooking at mandis" | PostgreSQL `with_for_update()` row-locks & Concurrency Tests | ✅ Yes | "Guarantees exact capacity enforcement using ACID-compliant database row-level locking, preventing double-bookings." |
| "AI-driven wait time prediction" | `predictions.py` | ⚠️ No (Rule-based) | "Uses a deterministic, capacity-aware heuristic algorithm to balance mandi loads and estimate wait times." |
| "Integrates with PFMS / e-NAM" | Codebase review | ⚠️ No (Simulated) | "Demonstrates a domain-accurate prototype architecture designed to interface seamlessly with PFMS and e-NAM." |
| "Replaces traditional J-Forms" | Punjab Mandi Board / `pdf_generator.py` | ✅ Yes | "Automates the generation of standard digital Form 'J' procurement receipts instantly upon weighbridge clearance." |
