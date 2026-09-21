# KisanFlow: Claim vs. Source Matrix

This matrix verifies the primary claims made in presentations, READMEs, and pitches against the **actual implementation codebase** and external sources.

| Claim | Source / Evidence | Verified? | Safe to say in SIH? | Recommended Wording |
| :--- | :--- | :--- | :--- | :--- |
| **"Reduces mandi waiting times by 60-70%"** | Projected hypothesis. No field data exists. | ⚠️ No | ❌ NO | "Our slot-based heuristic scheduling is **designed to distribute peak loads**, targeting significant reductions in yard congestion." |
| **"AI-driven wait time prediction"** | `predictions.py` (Rule-based heuristic) | ⚠️ No | ❌ NO | "Uses a deterministic, capacity-aware heuristic algorithm to balance mandi loads and estimate wait times." |
| **"Zero overbooking at mandis"** | PostgreSQL `with_for_update()` row-locks & Concurrency tests (`test_concurrency.py`) | ✅ Yes | ✅ YES | "Guarantees exact capacity enforcement using ACID-compliant database row-level locking, preventing double-bookings." |
| **"Cryptographically secure e-Gate passes"** | `security.py` using HMAC-SHA256 & OWASP Guidelines | ✅ Yes | ✅ YES | "Uses HMAC-SHA256 signed QR codes to generate verifiable, tamper-resistant digital e-Gate passes." |
| **"Live Google Maps integration for routing"** | Not found in code. Only Haversine formula is used (`geoUtils.ts`). | ⚠️ No | ❌ NO | "Utilizes the mathematical Haversine formula to compute offline distance and recommend the nearest Mandi." |
| **"Integrates with PFMS / e-NAM / UIDAI"** | Codebase review (Uses simulated schemas) | ⚠️ No | ⚠️ CONDITIONAL | "Demonstrates a domain-accurate prototype architecture designed to interface seamlessly with PFMS and e-NAM APIs." |
| **"Replaces traditional J-Forms"** | `pdf_generator.py` generating dynamic outputs | ✅ Yes | ✅ YES | "Automates the generation of standard digital Form 'J' procurement receipts instantly upon weighbridge clearance." |
| **"Completely free to scale nationwide"** | Render Free Tier limits (Expires in 30 days) | ⚠️ No | ❌ NO | "Currently deployed on a zero-cost prototype stack (Vercel/Render), designed to scale on enterprise infrastructure." |
| **"Calculates precise MSP payments"** | Simulated arrays in `mockData.ts` (currently outdated to 2023-24 rates) | ⚠️ Yes, but stale | ⚠️ CONDITIONAL | "Dynamically calculates payouts based on configurable Minimum Support Price (MSP) schemas." |
