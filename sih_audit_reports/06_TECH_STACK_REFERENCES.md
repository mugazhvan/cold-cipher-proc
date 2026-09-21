# KisanFlow: Technical Stack References

This document verifies the exact software stack used to build the KisanFlow platform, based on the actual `package.json`, `requirements.txt`, and source code.

## 1. Frontend Technologies

| Technology | Actually Used? | Version | Purpose in Project | Official Reference |
| :--- | :--- | :--- | :--- | :--- |
| **React** | YES | `^18.2.0` | Core UI library for both Farmer and Operator web portals. | [react.dev](https://react.dev/) |
| **TypeScript** | YES | `^5.2.2` | Static typing for enterprise-grade frontend reliability. | [typescriptlang.org](https://www.typescriptlang.org/) |
| **Vite** | YES | `^5.1.6` | Lightning-fast build tool and development server. | [vitejs.dev](https://vitejs.dev/) |
| **Tailwind CSS** | YES | `^3.4.1` | Utility-first CSS framework for responsive styling. | [tailwindcss.com](https://tailwindcss.com/) |
| **Lucide React** | YES | `^0.359.0` | SVG icon library for consistent iconography. | [lucide.dev](https://lucide.dev/) |
| **React Native (Expo)** | YES | `^50.0.0` (approx) | Mobile app framework for the farmer mobile client. | [expo.dev](https://expo.dev/) |

## 2. Backend Technologies

| Technology | Actually Used? | Version | Purpose in Project | Official Reference |
| :--- | :--- | :--- | :--- | :--- |
| **FastAPI** | YES | `>=0.110.0` | High-performance async Python web framework for the API layer. | [fastapi.tiangolo.com](https://fastapi.tiangolo.com/) |
| **Pydantic** | YES | `>=2.6.0` | Data validation and parsing using Python type hints. | [docs.pydantic.dev](https://docs.pydantic.dev/) |
| **SQLAlchemy** | YES | `>=2.0.28` | Async ORM mapping Python objects to PostgreSQL rows. | [sqlalchemy.org](https://www.sqlalchemy.org/) |
| **PostgreSQL (asyncpg)** | YES | `>=0.29.0` | High-performance, async PostgreSQL database driver. | [magicstack.github.io/asyncpg](https://magicstack.github.io/asyncpg/current/) |
| **PyJWT** | YES | `>=2.8.0` | Generating and validating JSON Web Tokens (including E-Gate passes). | [pyjwt.readthedocs.io](https://pyjwt.readthedocs.io/) |
| **Passlib (Bcrypt)** | YES | `>=1.7.4` | Secure password hashing. | [passlib.readthedocs.io](https://passlib.readthedocs.io/) |
| **FPDF2** | YES | `>=2.7.7` | Generating digital PDF Form 'J' procurement receipts. | [py-pdf.github.io/fpdf2](https://py-pdf.github.io/fpdf2/) |
| **Pytest** | YES | `>=8.0.0` | Unit and integration testing framework. | [pytest.org](https://pytest.org/) |

## Stack Clarifications for SIH Pitch

*   **No Heavy ML Libraries**: The backend `requirements.txt` does not include `scikit-learn`, `tensorflow`, or `pytorch`. Any mention of "Wait Time Prediction" must correctly refer to the deterministic algorithmic heuristic, not Machine Learning.
*   **Open Source Foundations**: The entire software stack is built on free, open-source software (FOSS). There are no proprietary software licensing costs (e.g., Oracle, proprietary mapping SDKs).
