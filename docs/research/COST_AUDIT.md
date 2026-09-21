# KisanFlow Infrastructure Cost Audit

> [!NOTE]
> All prices checked as of **September 2026**. Costs represent infrastructure services to run the application, not the underlying open-source technology which is free.

| Component | Provider | Plan / Product | Price (USD) | Free Tier | Limits / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Hosting** | Vercel | Hobby (Used) | $0/mo | Yes | Personal/Non-commercial use. Soft limits on bandwidth. |
| **Frontend Hosting** | Vercel | Pro (Proposed) | $20/seat/mo | No | Includes $20 usage credits. Required for commercial/Gov deployments. |
| **Backend API Hosting** | Render | Free Web Service | $0/mo | Yes | Spins down after 15 minutes of inactivity. |
| **Database Hosting** | Render | Free PostgreSQL | $0/mo | Yes | **Expires after 30 days.** Max 1GB storage. Not for production. |
| **Database Hosting** | Render | Basic-256MB | ~$7/mo | No | 1GB storage included. Predictable pricing model. |
| **Geospatial / Maps** | Mathematical | Haversine Formula | $0 | N/A | Calculated locally. **No external Google Maps / Mapbox APIs are billed.** |
