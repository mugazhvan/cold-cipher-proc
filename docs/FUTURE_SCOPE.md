# KisanFlow Future Scope

This document outlines the planned technical expansions and future integrations for the KisanFlow platform beyond the current prototype.

## 1. Advanced AI/ML Forecasting
Currently, wait-time estimation relies on deterministic, rule-based heuristics that calculate active queue utilization. In the future, we plan to ingest historical harvest data and seasonal patterns to train machine learning models. This will allow for more accurate predictions of congestion and proactive recommendations for capacity adjustments before a bottleneck forms.

## 2. API Integration with PFMS & UIDAI
While the current database schema accurately models direct benefit transfer (DBT) schemas and Aadhaar references, it acts as a simulation layer. True deployment will require integration with:
- **Public Financial Management System (PFMS)** for real-time validation of bank accounts and processing of agricultural payments.
- **UIDAI (Aadhaar)** for secure, biometric-based verification of farmers during registration and at the mandi gate.

## 3. Integration with e-NAM
KisanFlow is designed to be the logistics orchestrator that precedes the actual commodity trading on the e-NAM platform. Future versions will directly push weight and assaying quality results via API to the state or national e-NAM databases, allowing for a seamless transition from logistics to electronic bidding.

## 4. Scalable Infrastructure
The current prototype runs on Vercel (Hobby) and Render (Free Tier) services for demonstration purposes. National-level scaling will necessitate migration to enterprise-grade Kubernetes clusters, dedicated managed PostgreSQL instances with geo-replication, and a robust CI/CD pipeline.

## 5. Omnichannel Notifications (SMS/WhatsApp)
To cater to farmers without smartphones or reliable internet connectivity, we plan to integrate services like Twilio or Karix to send SMS and WhatsApp broadcast messages. This will ensure that all farmers receive critical queue updates and e-Gate passes regardless of their hardware capabilities.
