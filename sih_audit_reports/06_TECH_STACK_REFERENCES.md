# KisanFlow — 06 Tech Stack References

> **SIH 2026 · SIH26032 · Cold Cipher**

[← Audit Index](README.md) · [01 Source Audit](01_SOURCE_AUDIT.md) · [02 Claim Matrix](02_CLAIM_SOURCE_MATRIX.md) · [03 Implementation](03_IMPLEMENTATION_PROVENANCE.md) · [04 Systems](04_EXISTING_SYSTEM_COMPARISON.md) · [05 Cost](05_PRICING_COST_AUDIT.md) · [06 Tech Stack](06_TECH_STACK_REFERENCES.md) · [07 Security](07_SECURITY_AUDIT.md) · [08 Research](08_RESEARCH_PAPERS.md) · [09 Bibliography](09_FULL_BIBLIOGRAPHY.md) · [10 Unsupported](10_UNSUPPORTED_CLAIMS.md) · [11 Defense](11_JUDGE_DEFENSE.md) · [12 Slide 6](12_SLIDE_6_RESEARCH_REFERENCES.md)

**Purpose:** Verifies the exact software stack used to build KisanFlow based on the package.json, equirements.txt, and source code.

| Field | Value |
|---|---|
| Project | KisanFlow |
| SIH Problem | SIH26032 |
| Team | Cold Cipher |
| Document Type | Technical Audit |
| Verification Scope | Current repository |
| Last Audit Status | Verified |

---

## 1. FRONTEND TECHNOLOGIES

| Technology | Actually Used? | Version | Purpose in Project | Official Reference |
| :--- | :--- | :--- | :--- | :--- |
| **React** | ✅ IMPLEMENTED | ^18.2.0 | Core UI library for both Farmer and Operator web portals. | 🔗 [react.dev](https://react.dev/) |
| **TypeScript** | ✅ IMPLEMENTED | ^5.2.2 | Static typing for enterprise-grade frontend reliability. | 🔗 [typescriptlang.org](https://www.typescriptlang.org/) |
| **Vite** | ✅ IMPLEMENTED | ^5.1.6 | Lightning-fast build tool and development server. | 🔗 [vitejs.dev](https://vitejs.dev/) |
| **Tailwind CSS** | ✅ IMPLEMENTED | ^3.4.1 | Utility-first CSS framework for responsive styling. | 🔗 [tailwindcss.com](https://tailwindcss.com/) |
| **Lucide React** | ✅ IMPLEMENTED | ^0.359.0 | SVG icon library for consistent iconography. | 🔗 [lucide.dev](https://lucide.dev/) |
| **React Native (Expo)** | ✅ IMPLEMENTED | ^50.0.0 (approx) | Mobile app framework for the farmer mobile client. | 🔗 [expo.dev](https://expo.dev/) |

## 2. BACKEND TECHNOLOGIES

| Technology | Actually Used? | Version | Purpose in Project | Official Reference |
| :--- | :--- | :--- | :--- | :--- |
| **FastAPI** | ✅ IMPLEMENTED | >=0.110.0 | High-performance async Python web framework for API layer. | 🔗 [fastapi.tiangolo.com](https://fastapi.tiangolo.com/) |
| **Pydantic** | ✅ IMPLEMENTED | >=2.6.0 | Data validation and parsing using Python type hints. | 🔗 [docs.pydantic.dev](https://docs.pydantic.dev/) |
| **SQLAlchemy** | ✅ IMPLEMENTED | >=2.0.28 | Async ORM mapping Python objects to PostgreSQL rows. | 🔗 [sqlalchemy.org](https://www.sqlalchemy.org/) |
| **PostgreSQL (asyncpg)** | ✅ IMPLEMENTED | >=0.29.0 | High-performance, async PostgreSQL database driver. | 🔗 [magicstack.github.io/asyncpg](https://magicstack.github.io/asyncpg/current/) |
| **PyJWT** | ✅ IMPLEMENTED | >=2.8.0 | Generating and validating JSON Web Tokens (E-Gate passes). | 🔗 [pyjwt.readthedocs.io](https://pyjwt.readthedocs.io/) |
| **Passlib (Bcrypt)** | ✅ IMPLEMENTED | >=1.7.4 | Secure password hashing. | 🔗 [passlib.readthedocs.io](https://passlib.readthedocs.io/) |
| **FPDF2** | ✅ IMPLEMENTED | >=2.7.7 | Generating digital PDF Form 'J' procurement receipts. | 🔗 [py-pdf.github.io/fpdf2](https://py-pdf.github.io/fpdf2/) |
| **Pytest** | ✅ IMPLEMENTED | >=8.0.0 | Unit and integration testing framework. | 🔗 [pytest.org](https://pytest.org/) |

---

## STACK CLARIFICATIONS FOR SIH PITCH

> [!IMPORTANT]
> - **No Heavy ML Libraries**: The backend equirements.txt does not include scikit-learn, 	ensorflow, or pytorch. Any mention of "Wait Time Prediction" must correctly refer to the deterministic algorithmic heuristic, not Machine Learning.
> - **Open Source Foundations**: The entire software stack is built on free, open-source software (FOSS). There are no proprietary software licensing costs (e.g., Oracle, proprietary mapping SDKs).

---

**Quick Links**
- [🌐 Farmer Portal](https://management-app-fawn-five.vercel.app/)
- [🏢 Operator Console](https://management-app-mugal1.vercel.app/)
- [⚡ Swagger API](https://kisanflow-backend.onrender.com/docs)
- [📖 ReDoc](https://kisanflow-backend.onrender.com/redoc)
- [📱 Expo App](https://expo.dev/accounts/mugazhv/projects/farmer-mobile)
- [💻 GitHub Repository](https://github.com/mugazhvan/cold-cipher-proc)

[← Back to Audit Index](README.md)
