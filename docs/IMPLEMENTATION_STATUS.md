# KisanFlow Implementation Status

This matrix precisely classifies major project features into categories based on the actual codebase forensics: **IMPLEMENTED**, **SIMULATED**, **PROPOSED**, and **RESEARCHED**.

| Feature | Status | Code Evidence | Safe Presentation Wording |
| :--- | :--- | :--- | :--- |
| **Farmer Registration & Login** | ✅ IMPLEMENTED | `POST /api/v1/auth/login` | "Farmers can securely register and log in via phone-based authentication." |
| **Slot Booking & Discovery** | ✅ IMPLEMENTED | `POST /api/v1/bookings` | "Farmers can discover active mandis and book guaranteed delivery slots." |
| **Capacity Management (Zero Overbooking)** | ✅ IMPLEMENTED | DB CheckConstraint `booked_count <= capacity` | "PostgreSQL row-level locking ensures strict daily yard capacities." |
| **Queue Management & State Machine** | ✅ IMPLEMENTED | `QueueToken` model, `POST /queue/{id}/call` | "Live 5-stage token tracking orchestrates farmer movement from gate to weighbridge." |
| **QR Generation & Verification** | ✅ IMPLEMENTED | `security.py` (HMAC-SHA256) | "Issues offline-verifiable, cryptographically signed E-Gate passes." |
| **Nearby Centre Discovery** | ✅ IMPLEMENTED | `geoUtils.ts` (Haversine formula) | "Calculates distance to nearest active procurement centres dynamically." |
| **Wait-time Estimation** | ✅ IMPLEMENTED | `predictions.py` (Utilization math) | "Deterministic, capacity-aware utilization logic estimates active yard congestion." |
| **Document Generation (J-Form)** | ✅ IMPLEMENTED | `pdf_generator.py` | "Automates standard digital Form 'J' procurement receipts instantly." |
| **Payment Status / Calculation** | 🔄 SIMULATED | Returns fake `DBT-YYYYMMDD-XXXX` | "Generates domain-accurate DBT payment references upon weighment." |
| **e-NAM / AGMARKNET Integration** | 🔄 SIMULATED | N/A (Schema only) | "Features a schema designed for seamless interoperability with e-NAM." |
| **UIDAI (Aadhaar) / PFMS** | 🔄 SIMULATED | N/A (Schema only) | "Data architecture is structured to support future PFMS/UIDAI hooks." |
| **Notifications (SMS / WhatsApp)** | 💡 PROPOSED | UI displays mock "SMS Sent" toasts | "UI simulates real-time SMS broadcast notifications for non-smartphone users." |
| **AI / ML Recommendations** | ❌ NOT IMPLEMENTED | `predictions.py` contains no ML logic | *(Do not claim AI/ML. Claim "Algorithm" or "Heuristic" instead)* |
