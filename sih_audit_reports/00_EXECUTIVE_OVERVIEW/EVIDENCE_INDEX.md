# Evidence Index

## Overview
This document covers the evidence index for KisanFlow (Team 151660). 
All claims within this document map directly to evidence in the codebase or project architecture.

## Master Evidence Table

| ID | Claim / Feature | Evidence | Status | Location |
|----|-----------------|----------|--------|----------|
| **EV-001** | Farmer slot booking | Source code / live app | 🟢 IMPLEMENTED | `source/backend/app/api/` / Vercel |
| **EV-002** | Operator queue management | Source code / live app | 🟢 IMPLEMENTED | `source/backend/app/api/` / Vercel |
| **EV-003** | Concurrent Queue Processing | Test Execution | 🔵 VERIFIED | `source/backend/tests/test_concurrency.py` |
| **EV-004** | Role Based Access Control (RBAC) | Test Execution | 🔵 VERIFIED | `source/backend/tests/test_rbac_idor.py` |
| **EV-005** | State Machine Workflow | Test Execution | 🔵 VERIFIED | `source/backend/tests/test_state_machine.py` |
| **EV-006** | Stress / Load Handling | Test Execution | 🔵 VERIFIED | `source/backend/tests/test_m10_stress.py` |
| **EV-007** | E-Pass PDF Generation | Test Execution | 🔵 VERIFIED | `source/backend/tests/test_epass_pdf.py` |
| **EV-008** | Multi-Centre Operations | Architecture | 🟡 DESIGN | `source/backend/app/models/` |
| **EV-009** | Nationwide Scalability | Architecture design | 🟡 FUTURE | `07_SCALABILITY/SCALABILITY_STRATEGY.md` |
| **EV-010** | External Government DB Sync | N/A | 🔴 NOT VERIFIED | External limitation |

## Status Mapping
- 🟢 IMPLEMENTED
- 🔵 VERIFIED
- 🟡 DESIGN / PLANNED
- 🟠 PARTIALLY IMPLEMENTED
- 🔴 NOT VERIFIED

---

*Refer back to the [Root README](../README.md) to navigate.*
