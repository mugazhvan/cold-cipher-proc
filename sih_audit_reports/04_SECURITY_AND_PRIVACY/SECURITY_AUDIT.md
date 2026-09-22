# Security Audit

## Overview
This document covers the security audit for KisanFlow (Team 151660). 
All claims within this document map directly to evidence in the codebase or project architecture.

## Conducted Audits & Tests

The following areas have been actively audited and tested in the codebase:

| Finding / Area | Evidence | Risk | Current Status | Recommendation |
|----------------|----------|------|----------------|----------------|
| **Role Based Access Control (RBAC)** | `test_rbac_idor.py` | HIGH | 🔵 VERIFIED | Ensure all new API routes inherit the `get_current_active_user` dependency. |
| **Insecure Direct Object Reference (IDOR)** | `test_rbac_idor.py` | HIGH | 🔵 VERIFIED | Tests confirm users cannot access other users' procurement data. |
| **QR Code Forgery** | `test_qr_security.py` | HIGH | 🔵 VERIFIED | Ensure QR tokens remain cryptographically signed and expire. |
| **JWT Token Handling** | `source/backend/app/core/security.py` | HIGH | 🟢 IMPLEMENTED | Secrets must be injected via secure `.env` in production. |
| **SQL Injection** | Alembic & SQLAlchemy ORM | HIGH | 🟢 IMPLEMENTED | ORM mitigates direct SQLi. Parameterized queries used. |
| **Rate Limiting** | Not verified in current codebase | MEDIUM | 🔴 NOT VERIFIED | Implement API Gateway or FastAPI limiter middleware. |
| **CORS** | `main.py` middleware | MEDIUM | 🟠 PARTIALLY IMPLEMENTED | Ensure allowed origins are strictly locked down in production. |

## Status Mapping
- 🟢 IMPLEMENTED
- 🔵 VERIFIED
- 🟡 DESIGN / PLANNED
- 🟠 PARTIALLY IMPLEMENTED
- 🔴 NOT VERIFIED

---

*Refer to the [Evidence Index](../00_EXECUTIVE_OVERVIEW/EVIDENCE_INDEX.md) for full traceability.*
