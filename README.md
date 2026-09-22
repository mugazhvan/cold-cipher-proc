<div align="center">

  # 🌾 COLD CIPHER &mdash; KISANFLOW
  ### Digital Procurement Coordination & Inbound Yard Logistics Platform

  <p align="center">
    <em>Eliminating agricultural procurement gridlock, uncertainty, and physical queue delays for Indian farmers.</em>
  </p>

  <br />

  <!-- Primary Metadata Badges -->
  <a href="https://github.com/mugazhvan/cold-cipher-proc"><img src="https://img.shields.io/badge/SIH_2026-Team_151660-2563EB?style=for-the-badge&logo=target&logoColor=white" alt="SIH 2026 Badge"/></a>
  <a href="https://github.com/mugazhvan/cold-cipher-proc"><img src="https://img.shields.io/badge/Problem_ID-SIH26032-7C3AED?style=for-the-badge&logo=hashnode&logoColor=white" alt="Problem Statement ID"/></a>
  <a href="https://github.com/mugazhvan/cold-cipher-proc"><img src="https://img.shields.io/badge/Prototype_Status-Active_Live-059669?style=for-the-badge&logo=statuspage&logoColor=white" alt="Status Badge"/></a>
  <a href="https://github.com/mugazhvan/cold-cipher-proc"><img src="https://img.shields.io/badge/Architecture-Cloud_Native-0F172A?style=for-the-badge&logo=render&logoColor=white" alt="Cloud Native"/></a>

  <br />
  <br />

  <!-- Action Buttons -->
  <p align="center">
    <a href="https://management-app-fawn-five.vercel.app/" target="_blank">
      <img src="https://img.shields.io/badge/🌾_Launch-Farmer_Portal-15803D?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Farmer App Button"/>
    </a>
    &nbsp;
    <a href="https://management-app-alpha-six.vercel.app/" target="_blank">
      <img src="https://img.shields.io/badge/👮_Launch-Operator_Console-1D4ED8?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Operator App Button"/>
    </a>
    &nbsp;
    <a href="https://kisanflow-backend.onrender.com/api/v1/docs" target="_blank">
      <img src="https://img.shields.io/badge/⚡_Explore-Swagger_API-0D9488?style=for-the-badge&logo=fastapi&logoColor=white" alt="Swagger API Button"/>
    </a>
    &nbsp;
    <a href="./sih_audit_reports" target="_blank">
      <img src="https://img.shields.io/badge/📑_Open-Evidence_Hub-4F46E5?style=for-the-badge&logo=gitbook&logoColor=white" alt="Evidence Hub Button"/>
    </a>
  </p>

</div>

<br />

---

## 📌 1. Project Snapshot

<table width="100%">
  <tr>
    <td width="25%"><strong>🎯 Problem Focus</strong></td>
    <td>Unpredictable procurement schedules leading to massive physical APMC queues, diesel waste, and crop exposure.</td>
  </tr>
  <tr>
    <td><strong>💡 Solution</strong></td>
    <td>A unified digital scheduling, slot-booking, cryptographic token entry, and real-time mandi yard progression platform.</td>
  </tr>
  <tr>
    <td><strong>👥 Target Users</strong></td>
    <td><strong>Farmers</strong> (Schedules & Queue Tracking) &bull; <strong>Mandi Operators</strong> (Yard Ingress, Assaying, Weighbridge).</td>
  </tr>
  <tr>
    <td><strong>🚀 Core Objective</strong></td>
    <td>Transform chaotic physical arrivals into guaranteed deterministic arrival windows with live queue transparency.</td>
  </tr>
  <tr>
    <td><strong>🚦 Prototype Status</strong></td>
    <td><code>🟢 Fully Functional Web Applications & Cloud REST API</code> <em>(Mobile Android builds currently out of public demo scope)</em>.</td>
  </tr>
</table>

<br />

---

## 🔍 2. The Problem Statement

During harvest seasons, agricultural procurement centers and APMC mandis experience acute congestion:

```
[ 🚜 Farmers Arrive Unannounced ] ➔ [ 🛑 Physical Bottleneck at Gate ] ➔ [ ⏳ Multi-Day Lineups & Fuel Waste ] ➔ [ 📉 Crop Spoilage ]
```

- **Schedule Blindspots:** Farmers arrive without knowing center capacity, leading to miles of tractor trailers waiting on highways.
- **Resource Depletion:** Farmers spend days idling in lines, spending excess diesel and missing subsequent farm operations.
- **Asymmetric Information:** Lack of visibility into weighbridge and moisture assaying queues creates confusion and administrative delays.

> [!NOTE]
> **The Logistics Gap:** While platforms like e-NAM solve commodity trading and bidding, **KisanFlow solves the physical inbound yard logistics and arrival coordination** that happens before trading can take place.

<br />

---

## ⚡ 3. Our Solution & Workflow

KisanFlow introduces a synchronous coordination protocol between the farmer and the mandi gate:

```mermaid
flowchart TD
    classDef farmer fill:#ECFDF5,stroke:#059669,stroke-width:2px,color:#065F46;
    classDef mandi fill:#EFF6FF,stroke:#2563EB,stroke-width:2px,color:#1E40AF;
    classDef system fill:#F5F3FF,stroke:#7C3AED,stroke-width:2px,color:#5B21B6;

    A[👨‍🌾 Farmer Authentication]:::farmer --> B[📅 Smart Slot Booking]:::farmer
    B --> C[🎟️ Cryptographic E-Pass Issued]:::system
    C --> D[🚜 Mandi Gate Arrival]:::farmer
    D --> E[📷 QR Code Gate Scan]:::mandi
    E --> F[🚦 Live In-Yard Queue Queueing]:::system
    F --> G[🔬 Assaying & Moisture Check]:::mandi
    G --> H[⚖️ Weighbridge Gross/Tare Logging]:::mandi
    H --> I[📄 Digital J-Form Record Generated]:::system
```

<br />

---

## ✨ 4. Key Platform Features

<table>
  <thead>
    <tr>
      <th width="30%">Module / Capability</th>
      <th>Technical Specification & Operational Purpose</th>
      <th width="18%">Verification</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>🔐 Farmer Authentication</strong></td>
      <td>Lightweight OTP-based session management designed for low-friction farmer login.</td>
      <td><code>🟢 IMPLEMENTED</code></td>
    </tr>
    <tr>
      <td><strong>📅 Dynamic Slot Booking</strong></td>
      <td>Calculates available mandi quota by crop tonnage and prevents over-allocation.</td>
      <td><code>🟢 IMPLEMENTED</code></td>
    </tr>
    <tr>
      <td><strong>🎟️ Cryptographic E-Pass (QR)</strong></td>
      <td>Generates offline-verifiable <code>HMAC-SHA256</code> signed tokens to prevent queue forgery.</td>
      <td><code>🟢 IMPLEMENTED</code></td>
    </tr>
    <tr>
      <td><strong>🚦 Live Queue Tracker</strong></td>
      <td>Real-time state progression engine (<code>Booked</code> ➔ <code>In-Yard</code> ➔ <code>Assaying</code> ➔ <code>Weighed</code>).</td>
      <td><code>🟢 IMPLEMENTED</code></td>
    </tr>
    <tr>
      <td><strong>⚙️ Mandi Capacity Engine</strong></td>
      <td>Allows administrators to set dynamic daily throughput limits and gate processing speeds.</td>
      <td><code>🟢 IMPLEMENTED</code></td>
    </tr>
    <tr>
      <td><strong>📊 District Command Console</strong></td>
      <td>Aggregated visibility for District Collectors / Mandi Board into procurement volume.</td>
      <td><code>🟢 IMPLEMENTED</code></td>
    </tr>
    <tr>
      <td><strong>📑 Digital Procurement Records</strong></td>
      <td>Automated digital record generation for moisture parameters, dockage, and weight.</td>
      <td><code>🟢 IMPLEMENTED</code></td>
    </tr>
    <tr>
      <td><strong>📲 SMS & IVR Alerts</strong></td>
      <td>Automated push notifications for slot arrival reminders.</td>
      <td><code>🟡 PLANNED</code></td>
    </tr>
    <tr>
      <td><strong>💳 Live DBT Bank Settlement</strong></td>
      <td>End-to-end PFMS direct benefit bank disbursement integration.</td>
      <td><code>🟡 SIMULATED</code></td>
    </tr>
  </tbody>
</table>

<br />

---

## 🏛️ 5. System Architecture

```mermaid
graph TB
    subgraph Clients[" 💻 Presentation Layer (Vercel Edge CDN) "]
        FA["🌾 Farmer Portal<br/><code>React 18 / Vite / TypeScript</code>"]
        MA["👮 Operator Console<br/><code>React 18 / Vite / Tailwind</code>"]
    end

    subgraph BackendServices[" ⚙️ Application & Logic Layer (Render Cloud) "]
        API["⚡ FastAPI REST Engine<br/><code>Python 3.10+ / Asyncio / Uvicorn</code>"]
        AUTH["🔐 OAuth2 & JWT Auth"]
        SEC["🛡️ HMAC-SHA256 Token Verifier"]
        QUEUE["🚦 State Machine & Queue Manager"]
    end

    subgraph DataStorage[" 🗄️ Persistence & Database Layer "]
        DB[("🐘 PostgreSQL 15 Engine<br/>Relational & Spatial Models")]
    end

    FA -->|"HTTPS / REST"| API
    MA -->|"HTTPS / REST"| API
    API --> AUTH
    API --> SEC
    API --> QUEUE
    AUTH & SEC & QUEUE --> DB

    style FA fill:#22c55e,stroke:#15803d,stroke-width:2px,color:#ffffff
    style MA fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#ffffff
    style API fill:#0d9488,stroke:#0f766e,stroke-width:2px,color:#ffffff
    style DB fill:#334155,stroke:#1e293b,stroke-width:2px,color:#ffffff
```

<br />

---

## 🔄 6. Detailed User Workflows

<details open>
<summary><strong>👨‍🌾 Farmer Journey &bull; Click to expand/collapse</strong></summary>

<br />

```
[1. Login] ➔ [2. Select Mandi & Crop] ➔ [3. Book Time Slot] ➔ [4. Save QR E-Pass] ➔ [5. Arrive & Track Yard Queue]
```

1. **Authentication:** Fast mobile number entry with session persistence.
2. **Radar & Center Discovery:** View nearest procurement centers with live quota status.
3. **Slot Reservation:** Choose an open arrival window suited to transport availability.
4. **Pass Generation:** Instant digital E-Pass generated with QR code.
5. **Real-Time Tracking:** Check live vehicle queue status from the tractor seat while approaching.

</details>

<details open>
<summary><strong>👮‍♂️ Mandi Operator & DCA Journey &bull; Click to expand/collapse</strong></summary>

<br />

```
[1. Operator Login] ➔ [2. Gate Ingress Scan] ➔ [3. Queue Transition] ➔ [4. Record Moisture/Weight] ➔ [5. Finalize Procurement]
```

1. **Gate Ingress:** Scan incoming farmer QR codes to validate arrival against daily capacity.
2. **Yard Routing:** Admitted vehicles move into active queue status automatically.
3. **Quality & Assay:** Log moisture percentage and quality grade.
4. **Weighbridge Operation:** Record gross and tare vehicle weights.
5. **Procurement Finalization:** Generate signed digital receipt and release vehicle.

</details>

<br />

---

## 💻 7. Technology Stack

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <br />
  <img src="https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL_15-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white" />
</p>

| Component | Technology | Specification & Role |
| :--- | :--- | :--- |
| **Frontend Framework** | `React 18 (Vite SPA)` | Client-side reactive UI with modular component hierarchy. |
| **Styling & Icons** | `Tailwind CSS` + `Lucide React` | High-contrast, mobile-first accessible interface. |
| **Backend Framework** | `FastAPI` + `SQLAlchemy Async` | Asynchronous, non-blocking REST endpoints with OpenAPI specs. |
| **Database Engine** | `PostgreSQL 15` | Relational consistency, foreign key constraints, and spatial indexes. |
| **Cryptographic Layer**| `HMAC-SHA256` + `JWT (Bcrypt)` | Tamper-proof token serialization and secure credential storage. |
| **Testing Framework** | `Pytest` + `HTTPX` | Rigorous state machine, concurrency, and RBAC integration test suite. |
| **Deployment Edge** | `Vercel` (Frontends) + `Render` (API) | Globally distributed CDN edge with continuous integration. |

<br />

---

## 🌐 8. Live Demonstration & Portals

<div align="center">

| Application | Live URL | Access Credentials |
| :--- | :--- | :--- |
| 🌾 **Farmer Portal** | [**management-app-fawn-five.vercel.app**](https://management-app-fawn-five.vercel.app/) | *Open Access / Phone Demo* |
| 👮 **Operator Console** | [**management-app-alpha-six.vercel.app**](https://management-app-alpha-six.vercel.app/) | `operator1` / `password123` |
| 🛡️ **DCA Admin Dashboard**| [**management-app-alpha-six.vercel.app**](https://management-app-alpha-six.vercel.app/) | `admin@kisanflow.gov.in` / `password123` |
| ⚡ **Swagger API Docs** | [**kisanflow-backend.onrender.com/api/v1/docs**](https://kisanflow-backend.onrender.com/api/v1/docs) | *Public Interactive OpenAPI* |

</div>

<br />

---

## 📑 9. Research, Audits & Evaluation Evidence Hub

All claims, architectural patterns, and validation benchmarks are rigorously tracked inside our public documentation hub:

<p align="center">
  <a href="./sih_audit_reports">
    <img src="https://img.shields.io/badge/📂_EXPLORE_THE_FULL_EVIDENCE_REPOSITORY-sih__audit__reports-4F46E5?style=for-the-badge&logo=gitbook&logoColor=white" alt="Evidence Hub Banner"/>
  </a>
</p>

| Evidence Report | Subject & Focus Area | Direct Link |
| :--- | :--- | :---: |
| 🚀 **Project Quick Start** | Rapid 2-minute architectural and operational briefing. | [**Read Document**](sih_audit_reports/00_EXECUTIVE_OVERVIEW/PROJECT_QUICK_START.md) |
| 🔍 **Master Evidence Index** | Direct traceability mapping between features and source code lines. | [**Read Document**](sih_audit_reports/00_EXECUTIVE_OVERVIEW/EVIDENCE_INDEX.md) |
| 🏛️ **System Architecture** | Comprehensive technical deep dive into backend modules and schemas. | [**Read Document**](sih_audit_reports/03_TECHNICAL_ARCHITECTURE/SYSTEM_ARCHITECTURE.md) |
| 🛡️ **Security Audit** | Formal review of RBAC, IDOR vulnerability tests, and crypto passes. | [**Read Document**](sih_audit_reports/04_SECURITY_AND_PRIVACY/SECURITY_AUDIT.md) |
| 📊 **Impact Analysis** | Quantified reduction of diesel waste and procurement bottlenecks. | [**Read Document**](sih_audit_reports/08_IMPACT/IMPACT_ANALYSIS.md) |
| ⚠️ **Current Limitations** | Transparent accounting of prototype boundaries vs. production goals. | [**Read Document**](sih_audit_reports/11_LIMITATIONS_AND_FUTURE/CURRENT_LIMITATIONS.md) |

<br />

---

## 🧪 10. Automated Validation & Test Suite

The platform logic is enforced by automated test suites in `source/backend/tests`:

```
source/backend/tests/
 ├── test_state_machine.py    # Prevents invalid queue jumps and out-of-order transitions
 ├── test_concurrency.py      # Verifies atomic slot quota reservations under race conditions
 ├── test_rbac_idor.py        # Proves strict role isolation between Farmers, Operators & DCA
 └── test_m10_stress.py       # Validates high-volume request handling under burst loads
```

| Validation Category | Test Suite File | Result | Verified Capability |
| :--- | :--- | :---: | :--- |
| **State Transitions** | `test_state_machine.py` | 🟢 `PASSED` | Enforces single-direction vehicle progression. |
| **Concurrency Locks** | `test_concurrency.py` | 🟢 `PASSED` | Prevents overbooking beyond daily mandi quota. |
| **Security & RBAC** | `test_rbac_idor.py` | 🟢 `PASSED` | Proves farmers cannot inspect or tamper other bookings. |
| **Burst Capacity** | `test_m10_stress.py` | 🟢 `PASSED` | Validates async throughput under simulated mandi peak. |

<br />

---

## 🔒 11. Security, Privacy & Integrity

- **Role-Based Access Control (RBAC):** Strict JWT separation ensures farmers cannot access operator or admin routes.
- **Cryptographic Anti-Tamper E-Passes:** QR payloads are signed with `HMAC-SHA256` keys, preventing fake token generation.
- **Zero Credentials Exposure:** Zero API secrets or credentials committed in version control; environment variables injected dynamically.
- **Password Protection:** Operator and administrative credentials secured with `Bcrypt` multi-round hashing.

<br />

---

## 📈 12. Scalability Architecture

- **Stateless Services:** The FastAPI backend is completely stateless, enabling horizontal scaling across worker nodes.
- **Hierarchical Tenancy:** The data model natively structures Mandis by State, District, Center, and Gate, supporting seamless nationwide rollout.
- **Edge Content Delivery:** Static frontend assets are served via Vercel's global CDN, ensuring millisecond response times even over rural mobile connections.

<br />

---

## ⚠️ 13. Current Limitations

1. **Government Sync:** Direct sync with live e-NAM and PFMS state databases is currently architectural and simulated.
2. **Offline Mode:** The operator app requires active internet connectivity to mutate queue records in the centralized database.
3. **Mobile Builds:** Android Expo native APK builds are currently undergoing build toolchain stabilization and are excluded from this evaluation demo.

<br />

---

## 👥 14. Team & Hackathon Information

<div align="center">

| Project Identity | Details |
| :--- | :--- |
| **Team Name** | **Cold Cipher** |
| **Team ID** | **151660** |
| **Hackathon** | **Smart India Hackathon 2026** |
| **Problem Statement ID** | **SIH26032** |
| **Repository** | [`github.com/mugazhvan/cold-cipher-proc`](https://github.com/mugazhvan/cold-cipher-proc) |

</div>

<br />

---

<div align="center">

  ### 🔗 Quick Navigation

  [![Farmer App](https://img.shields.io/badge/🌾_Farmer_App-Visit-15803D?style=for-the-badge)](https://management-app-fawn-five.vercel.app/)
  &nbsp;
  [![Operator App](https://img.shields.io/badge/👮_Operator_App-Launch-1D4ED8?style=for-the-badge)](https://management-app-alpha-six.vercel.app/)
  &nbsp;
  [![API Docs](https://img.shields.io/badge/⚡_Swagger_Docs-Explore-0D9488?style=for-the-badge)](https://kisanflow-backend.onrender.com/api/v1/docs)
  &nbsp;
  [![Evidence Hub](https://img.shields.io/badge/📑_Evidence_Hub-Inspect-4F46E5?style=for-the-badge)](./sih_audit_reports)
  &nbsp;
  [![GitHub Repo](https://img.shields.io/badge/💻_Source_Code-GitHub-0F172A?style=for-the-badge&logo=github)](https://github.com/mugazhvan/cold-cipher-proc)

  <br />
  <br />

  <sub>Cold Cipher &bull; Smart India Hackathon 2026 &bull; Team ID: 151660 &bull; Problem Statement: SIH26032</sub>

</div>
