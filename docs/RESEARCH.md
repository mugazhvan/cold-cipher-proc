# 🔬 KisanFlow Research Provenance

This document outlines the foundational research and provenance tracking that informed the architecture and design of the KisanFlow platform.

## 1. Agricultural Supply Chain Bottlenecks
Extensive research into the APMC (Agricultural Produce Market Committee) mandi operations highlighted that the lack of inbound logistics coordination is the primary cause of post-harvest losses and farmer distress during peak procurement seasons.
- **Key Finding:** Farmers wait an average of 1-3 days in queues.
- **Reference:** Government of India Agricultural Logistics Reports.

## 2. e-NAM and Decentralized Procurement
We studied the National Agriculture Market (e-NAM) integration. KisanFlow does not replace e-NAM; rather, it serves as the logistics orchestrator that precedes the actual commodity trading. 

## 3. Cryptographic Queue Management
Our research led to the adoption of HMAC-SHA256 signed QR codes for offline verifiable slot booking. This ensures that farmers in low-connectivity areas can present tamper-proof E-Passes at the mandi gates.

## 4. UI/UX Principles for Rural Adoption
We implemented high-contrast, strictly monochromatic (Black/White/Grayscale) interfaces with iconography to cater to users with varying literacy levels and to ensure high visibility under direct sunlight in the fields.

---
*For a complete list of all references and literature, please see our internal ALL_REFERENCES document.*
