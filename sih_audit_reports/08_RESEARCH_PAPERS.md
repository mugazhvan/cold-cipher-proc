# KisanFlow: Academic & Government Research Papers

This document lists the foundational research that validates the **problem statement** (Mandi congestion and wait times) and justifies the **KisanFlow solution** (algorithmic slot booking).

## 1. Performance Evaluation of e-National Agriculture Market (e-NAM)
*   **Organization**: CCS National Institute of Agricultural Marketing (NIAM)
*   **Context**: e-NAM is the flagship digital trading platform for farmers in India.
*   **Key Findings**:
    *   While e-NAM successfully digitized trading, physical bottlenecks remain at the mandi gates and assaying labs.
    *   Farmers often experience severe congestion because arrivals are uncoordinated.
    *   Assaying (quality testing) takes significant time, leading to physical yard gridlock.
*   **How KisanFlow Uses This**: This report justifies our pivot away from "just another trading app" toward a **physical logistics orchestrator**. We solve the exact physical congestion bottlenecks that NIAM identified as holding back e-NAM's full potential.

## 2. Minimum Support Prices (MSP) Announcements
*   **Organization**: Department of Agriculture & Farmers Welfare, GoI
*   **Context**: Official release of MSPs for Kharif and Rabi crops.
*   **How KisanFlow Uses This**: The schema inside `mockData.ts` and the `Crop` database models are built directly using the government's official taxonomy. This ensures our DBT (Direct Benefit Transfer) simulations are domain-accurate. *(Note: Our internal mock data is currently set to the 2023-24 rates, e.g., Paddy Common at ₹2,203/Qtl, and requires a minor update to the 2024-25 rate of ₹2,300/Qtl for the live pitch).*

## 3. State-Level Procurement Workflows
*   **Organizations**: Haryana State Government (e-Kharid), Punjab Mandi Board (Anaaj Kharid)
*   **Context**: Existing state-level digital portals.
*   **How KisanFlow Uses This**: We reverse-engineered the standard workflows (Farmer Registration -> Gate Pass -> Weighment -> Form J -> Payment) from these portals to ensure KisanFlow's 5-stage token tracking completely aligns with established real-world practices. 

> **Important**: Do not claim we are officially endorsed by NIAM or these state boards. We merely used their public documentation and academic reports as domain research to build a highly accurate prototype.
