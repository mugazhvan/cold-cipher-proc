# KisanFlow: Pricing & Cost Audit

This document details the pricing and cost audit for the infrastructure and technologies used in the KisanFlow project.

> **Verification Date**: September 2026

## Infrastructure & Hosting Costs

| Service / Component | Provider | Plan / Tier | Current Price | Free Tier Limits | Status in Project |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Web Hosting** | Vercel | Hobby | $0 / mo | Non-commercial use, 100GB bandwidth | **USED** (Currently deployed) |
| **Frontend Web Hosting** | Vercel | Pro | $20 / user / mo | None | **PROPOSED** (Required for production scale) |
| **Backend API Hosting** | Render | Free Web Service | $0 / mo | Spins down after 15m inactivity, 500 build mins | **USED** (Currently deployed) |
| **Database (PostgreSQL)** | Render | Free Postgres | $0 / mo | 1GB Storage, **Expires in 30 days** | **USED** (Currently deployed) |
| **Database (PostgreSQL)** | Render | Basic-256MB | ~$7 / mo | N/A (1GB storage included) | **PROPOSED** (Required for persistence) |

## Third-Party APIs & Integrations

| Technology / Integration | Provider | Usage in KisanFlow | Pricing | Open Source Alternative Used? |
| :--- | :--- | :--- | :--- | :--- |
| **Geolocation & Routing** | Google Maps API | Mandi distance calculation | ~$5 per 1000 requests | **NO** (Not used in code) |
| **Geolocation (Haversine)** | Mathematical Formula | Mandi distance calculation | $0 (Calculated locally) | **YES** (Implemented in `geoUtils.ts`) |
| **SMS / Notifications** | Twilio / MSG91 | Farmer alerts | ~$0.005 per message | **NO** (Simulated locally via UI) |
| **Authentication** | Auth0 / Firebase | User login / JWT | ~$23 / mo (Pro tiers) | **NO** (Custom built using bcrypt & pyjwt) |
| **Document Generation** | DocuSign / Adobe | Digital J-Forms | Paid per envelope | **NO** (Custom built using FPDF2) |

## Important Cost Limitations for SIH Pitch

1.  **"Completely Free Nationwide Deployment"**: Do not claim this. The current zero-cost stack relies on Vercel's Hobby tier (strictly non-commercial) and Render's Free PostgreSQL (which **deletes data after 30 days**).
2.  **Mapping Costs**: We save significant operational costs by strictly using the mathematical **Haversine formula** to compute distances between static lat/lon coordinates. We are *not* incurring Google Maps API routing charges. This is a massive cost-saving feature.
3.  **Authentication Costs**: By implementing our own OAuth2/JWT issuing service with `passlib` and `pyjwt`, we avoid vendor lock-in and monthly fees associated with Auth0 or Firebase Auth.
