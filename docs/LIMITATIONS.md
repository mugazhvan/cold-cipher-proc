# KisanFlow Prototype Limitations

> [!WARNING]
> Please review these limitations carefully to understand the boundaries of the current prototype.

1. **"We use AI/Machine Learning for wait time prediction."**
    *   *Reality:* The code uses a deterministic, rule-based mathematical heuristic (`(1 - utilization) * 100`). Claiming AI will fail technical scrutiny.
2. **"Reduces mandi waiting times by 60-70%."**
    *   *Reality:* This is an untested hypothesis. We have load-tested the *software*, but we have no physical pilot data proving a 60% real-world reduction. Rephrase as "Designed to reduce..."
3. **"Fully integrated with PFMS and UIDAI (Aadhaar)."**
    *   *Reality:* The code uses mock references and simulated DB tables. We must state: "Features a domain-accurate simulation layer ready for PFMS/UIDAI API integration."
4. **"Live Google Maps integration for routing."**
    *   *Reality:* We use the mathematical Haversine formula on static coordinates (`geoUtils.ts`). Do not claim we are paying for or using Google Maps APIs.
5. **"Completely free to scale nationwide."**
    *   *Reality:* Render Free Tier databases expire in 30 days. National scale requires Kubernetes/Enterprise cloud hosting.
