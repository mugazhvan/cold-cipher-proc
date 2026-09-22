# Judge Quick Start

## Overview
This document covers the judge quick start for KisanFlow (Team 151660). 
All claims within this document map directly to evidence in the codebase or project architecture.

## What We Built
KisanFlow is a digital procurement coordination platform designed to improve visibility and coordination around farmer registration, slot booking, procurement-centre queues, procurement progress, and related operational workflows.

## Why It Matters
Our platform mitigates long queues and inefficient physical coordination at procurement centres by giving farmers digital slot-booking and giving operators visibility into upcoming arrivals.

## How to Experience It
**Farmer App (Live):**
[https://management-app-fawn-five.vercel.app/](https://management-app-fawn-five.vercel.app/)

**Operator App (Live):**
[https://management-app-alpha-six.vercel.app/](https://management-app-alpha-six.vercel.app/)

*(Note: There is currently NO public demo video).*

## Where the Code Is
**GitHub Repository:**
[https://github.com/mugazhvan/cold-cipher-proc](https://github.com/mugazhvan/cold-cipher-proc)

## Where the Evidence Is
**Research & Audit Reports:**
[https://github.com/mugazhvan/cold-cipher-proc/tree/main/sih_audit_reports](https://github.com/mugazhvan/cold-cipher-proc/tree/main/sih_audit_reports)

## What Has Been Tested
- 🟢 **Concurrency:** Simulated concurrent API requests for queue management (see `test_concurrency.py`).
- 🟢 **Stress Testing:** High-load API request testing (`test_m10_stress.py`).
- 🟢 **Security (IDOR & RBAC):** Validated role-based access control against authorization bypass (`test_rbac_idor.py`).
- 🟢 **State Machine:** Validated strict state transitions for procurement statuses (`test_state_machine.py`).

## What Remains Prototype-Scope
- 🟡 **Nationwide Infrastructure Deployment:** Scalability architecture is designed but not yet physically provisioned across nationwide clusters.
- 🟡 **Offline Capability:** Not yet fully tested for edge cases without internet connection.
- 🔴 **Government Data Integration:** Not yet integrated with live external e-NAM or land registry databases.

---

*Refer to the [Evidence Index](../00_EXECUTIVE_OVERVIEW/EVIDENCE_INDEX.md) for full traceability.*
