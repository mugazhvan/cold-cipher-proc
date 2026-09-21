# KisanFlow: Unsupported Claims (DO NOT USE)

This document contains claims that **must be removed** from the Smart India Hackathon (SIH) presentation and all official project documentation. These claims were investigated during the provenance audit and found to lack codebase evidence or verifiable external backing.

> [!WARNING]
> Presenting these claims to a technical jury could result in the project being penalized for hallucination or misrepresentation.

## 1. "AI / Machine Learning Wait Time Prediction"
*   **The Problem**: The actual implementation in `predictions.py` uses a deterministic mathematical heuristic (`Score = (1 - utilization) * 100`). There are no neural networks, trained models, or ML libraries (e.g., scikit-learn, PyTorch) in the backend.
*   **Action Required**: Remove all mentions of "AI" or "Machine Learning".
*   **Safe Alternative**: "Deterministic, capacity-aware utilization algorithm."

## 2. "Reduces Mandi Waiting Times by 60-70%"
*   **The Problem**: While the software is designed to distribute loads, we have not conducted physical pilot tests at a real APMC yard to prove a 60% reduction.
*   **Action Required**: Remove absolute performance guarantees.
*   **Safe Alternative**: "Designed to significantly reduce yard congestion by distributing peak arrival loads."

## 3. "Fully Integrated with PFMS / UIDAI / e-NAM"
*   **The Problem**: The system does not actively communicate with live government servers. It generates simulated DBT payment references and Aadhaar-linked mock profiles.
*   **Action Required**: Never claim "fully integrated" or "live connection."
*   **Safe Alternative**: "Features a domain-accurate, interoperable schema designed to hook into existing PFMS and e-NAM APIs."

## 4. "Live Google Maps Routing"
*   **The Problem**: The code strictly utilizes the Haversine mathematical formula (`geoUtils.ts`) on static Longitude/Latitude coordinates. We are not paying for or querying Google Maps APIs.
*   **Action Required**: Remove mentions of Google Maps or live traffic routing.
*   **Safe Alternative**: "Utilizes offline, mathematical distance computation (Haversine) to recommend the nearest active mandi."

## 5. "Completely Free for Nationwide Deployment"
*   **The Problem**: The current deployment relies on Vercel's Hobby tier (strictly non-commercial) and Render's Free tier (where PostgreSQL databases expire and delete all data after 30 days).
*   **Action Required**: Do not claim the system scales nationally for $0.
*   **Safe Alternative**: "Currently deployed on a zero-cost prototype stack, engineered to scale on state-level enterprise cloud infrastructure."
