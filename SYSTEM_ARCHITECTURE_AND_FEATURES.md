# KisanFlow System Master Documentation & Architecture Manual

## 1. System Overview & Purpose
**KisanFlow** is a next-generation decentralized mandi slot booking, token queue management, and crop procurement intelligence platform designed to eliminate multi-day mandi traffic congestion, prevent distress selling, automate quality grading/weighing, and streamline direct benefit transfer (DBT / J-Form) payouts for Indian farmers.

---

## 2. Comprehensive Tech Stack

### 2.1 Frontend Architecture
* **Framework**: React 18 with TypeScript (`v5.5.3`)
* **Build Tool & Bundler**: Vite (`v5.4.2`)
* **Monorepo / Workspace**: NPM Workspaces (`frontend/farmer-app`, `frontend/management-app`, `frontend/shared`)
* **Styling & Design System**: Tailwind CSS (`v3.4.1`), PostCSS, Autoprefixer, Custom Glassmorphism UI tokens, Lucide React icons (`v0.344.0`)
* **State & Networking**: React Context API, React Hooks, Axios (`v1.7.9`)
* **Charts & Visualizations**: Recharts (`v2.12.0`)
* **Internationalization (i18n)**: Multilingual support (English, Hindi `हिन्दी`, Punjabi `ਪੰਜਾਬੀ`)
* **Production Web Server**: NGINX Alpine (`nginx:alpine`) serving optimized static single-page application (SPA) bundles with fallback routing.

### 2.2 Backend Architecture
* **Framework**: FastAPI (`v0.104.1`) on Python 3.11+
* **ASGI Server**: Uvicorn with async event loops
* **Database ORM**: SQLAlchemy 2.0 (AsyncIO engine with `asyncpg` driver)
* **Migrations**: Alembic (`alembic upgrade head`)
* **Data Validation & Schemas**: Pydantic v2
* **Security & Auth**: OAuth2 with Password Bearer, PassLib (Bcrypt password hashing), Python-Jose (JWT tokens - HS256)
* **API Documentation**: OpenAPI / Swagger UI (`/api/v1/docs`), ReDoc (`/api/v1/redoc`)

### 2.3 Database & Storage
* **Primary Database**: PostgreSQL 15 Alpine (`postgres:15-alpine`)
* **Relational Schema**: Normalized tables for Users, Farmers, Mandi Centres, Crop Types, Slots, Bookings, Queue Tokens, Quality Inspections, Weighbridge Records, and J-Forms.

### 2.4 DevOps & Containerization
* **Orchestration**: Docker Compose v3.8
* **Containers**:
  1. `db`: PostgreSQL 15 on port `5432:5432`
  2. `backend`: FastAPI backend on port `8000:8000`
  3. `farmer-app`: NGINX web server on port `3000:80`
  4. `management-app`: NGINX web server on port `3001:80`

---

## 3. Login & Authentication Flow

### 3.1 Operator / DCA Admin Login (`http://localhost:3001`)
* **Input Fields**:
  * `Username / Email`: Operator username or email (e.g. `operator1` or `admin@kisanflow.gov.in`)
  * `Password`: Password (e.g. `password123`)
* **Actions & Buttons**:
  * `Sign In / Login` Button: Dispatches OAuth2 password flow request to `POST /api/v1/auth/login`.
  * `Quick Demo Login (Operator)`: One-click bypass loading mock/demo session credentials.
  * `Quick Demo Login (DCA Admin)`: One-click session switch to District Level Intelligence mode.
* **Token Storage**: Persists JWT Access Token in `localStorage` and injects `Authorization: Bearer <token>` on all outbound Axios requests.

### 3.2 Farmer Login (`http://localhost:3000`)
* **Input Fields**:
  * `Aadhaar / Mobile Number`: 10-digit mobile number or 12-digit Aadhaar UID (e.g. `9876543210`)
  * `OTP Verification`: 6-digit one-time verification code (e.g. `123456`)
* **Actions & Buttons**:
  * `Send OTP` Button: Triggers simulated/SMS OTP dispatch.
  * `Verify & Proceed` Button: Authenticates farmer and creates session state.
  * `Demo Quick Login (Rajesh Kumar)`: Quick login shortcut for testing.

---

## 4. Farmer Web Application (`http://localhost:3000`)

### 4.1 Header & Global Navigation
* **Buttons & Controls**:
  * `Language Selector Dropdown`: Switch between `English`, `हिन्दी (Hindi)`, and `ਪੰਜਾਬੀ (Punjabi)`.
  * `Notification Bell Icon`: Opens interactive dropdown showing live queue reminders and J-form payment alerts.
  * `Farmer Profile Badge`: Displays farmer name, verified Aadhaar tag, and location.
  * `Logout Button`: Clears session token and returns to login screen.

### 4.2 Tab 1: Slot Booking (`SlotBooking.tsx`)
* **Form Inputs & Controls**:
  * `Select Mandi Centre Dropdown`: Choose procurement hub (e.g. *Khanna Grain Market*, *Sirsa Mandi*, *Karnal Central Hub*).
  * `Select Crop Dropdown`: Choose commodity (Wheat, Paddy, Mustard, Cotton, Maize).
  * `Estimated Quantity (Quintals)`: Numeric input with live capacity validation.
  * `Vehicle Type Selection`: Radio cards for *Tractor Trolley*, *Mini Truck (Pickup)*, *Full Truck (6-10 Wheeler)*, *Bullock Cart*.
  * `Vehicle Registration Number`: Text input (e.g. `PB-10-CZ-4412`).
  * `Date Picker`: Date selection showing open procurement dates.
  * `Time Slot Grid`: Interactive morning/afternoon slot cards (e.g., `08:00 - 10:00 AM`, `10:00 - 12:00 PM`, `02:00 - 04:00 PM`) with color-coded live congestion indicators (*Available*, *Fast Filling*, *Full*).
* **Action Buttons**:
  * `Find Optimal AI Slot`: Auto-recommends least congested slot using predictive load balancing.
  * `Confirm & Generate Token`: Submits booking to `POST /api/v1/bookings/` and opens Digital Token Pass Modal.

### 4.3 Tab 2: Live Token Tracker (`LiveTokenTracker.tsx`)
* **Features & Displays**:
  * `Token Search / Input Field`: Lookup token details by ID (e.g. `TK-2024-001`).
  * `Live Progress Stepper`: Real-time visual timeline across 5 stages:
    1. *Token Issued & Slot Confirmed*
    2. *Gate Entry & RFID Verified*
    3. *Quality Testing & Moisture Grading*
    4. *Weighbridge Gross & Tare Weighing*
    5. *Unloading & Digital J-Form Generated*
  * `Queue Position Indicator`: Displays exact queue rank (e.g. *"3 vehicles ahead of you"*).
  * `Estimated Wait Time (ETA)`: Dynamic countdown based on live weighbridge throughput.
* **Action Buttons**:
  * `Refresh Status Button`: Polls `/api/v1/queue/tokens/{token_id}`.
  * `View / Print Token Pass`: Opens printable digital gate pass modal.
  * `Directions to Gate`: Navigation link to procurement centre entrance.

### 4.4 Tab 3: Nearby Mandi Congestion Board (`NearbyMandiBoard.tsx`)
* **Features & Displays**:
  * `Live Radius Search`: Filter mandis within 10km, 25km, 50km.
  * `Mandi Status Cards`: Compares multiple mandis showing:
    * Current wait time (minutes)
    * Open unloading bays
    * Current prevailing MSP rate
    * Price difference indicators
* **Action Buttons**:
  * `Switch Mandi / Book Here`: Quick redirect to book at alternative low-congestion mandi.

### 4.5 Tab 4: Digital J-Form & Payment Receipts (`DigitalJForm.tsx`)
* **Features & Displays**:
  * `Official Government J-Form Layout`: Formatted procurement slip featuring:
    * Unique J-Form Number (`JF-2024-XXXX`)
    * Farmer Aadhaar & Bank Account details
    * Gross Weight, Tare Weight, Net Procured Weight (Quintals)
    * Quality Deductions (Moisture %, Foreign Matter %)
    * Net Payable Amount (₹ INR) calculated via official MSP formula
    * QR Code for bank / portal verification
* **Action Buttons**:
  * `Download J-Form PDF`: Triggers instant PDF/print generation.
  * `Share via WhatsApp / SMS`: Dispatches copy to farmer's mobile number.
  * `Check Direct Bank Transfer (DBT) Status`: Checks clearing status with PFMS / NPCI gateway.

---

## 5. Management & Operator Console (`http://localhost:3001`)

### 5.1 Global Dashboard & Live Overview
* **Header Controls**:
  * `Centre Selector Dropdown`: Switch between *Khanna Main Yard*, *Sirsa Mandi*, *All District Mandis*.
  * `Guided Demo Tour Button`: Triggers interactive step-by-step UI onboarding overlay.
  * `System Notifications Bell`: Displays high moisture alerts, gate bottlenecks, and system updates.
  * `User Profile & Role Pill`: Displays `OPERATOR` or `DISTRICT_ADMIN`.

### 5.2 KPI Stats Ribbon
* **Live Dynamic Cards**:
  1. `Total Daily Bookings`: Real-time count of scheduled arrivals.
  2. `Active Queue at Gate`: Current vehicles queued in yard.
  3. `Total Tonnage Procured`: Cumulative metric tons weighed today.
  4. `Average Processing Time`: Average cycle time from entry gate to J-form dispatch.

### 5.3 Live Mandi Operational Queue Table
* **Table Columns**:
  * `Token ID & Priority Badge`
  * `Farmer Details & Contact`
  * `Crop & Declared Weight`
  * `Vehicle Reg. No. & Type`
  * `Slot Time & Arrival Status`
  * `Current Processing Stage`
  * `Action Triggers`
* **Row-Level Action Buttons**:
  * `Gate Check-In`: Marks arrival, verifies QR/RFID token, moves status to *In-Yard*.
  * `Quality Lab`: Opens Quality Inspection Grading Modal.
  * `Weighbridge`: Opens Gross / Tare Weight Recording Modal.
  * `Generate J-Form`: Finalizes procurement transaction and signs digital receipt.
  * `Operator Receipt`: Opens official operator copy receipt.

### 5.4 Quality Lab Grading Modal
* **Form Inputs & Live Calculations**:
  * `Moisture Content (%)`: Auto-computes grade (Grade A <= 12%, Grade B <= 14%, Rejection > 14%).
  * `Foreign Matter (%)`: Percentage contamination input.
  * `Damaged / Discolored Grains (%)`: Visual defect input.
  * `Assigned Quality Grade`: Automatic dropdown classification (*Grade A*, *Grade B*, *Rejected*).
  * `Moisture Cut / Price Adjustment`: Real-time rupee deduction calculation based on mandi regulations.
* **Buttons**:
  * `Save & Approve Quality Score`: Commits inspection data to backend and moves token to weighbridge.
  * `Reject Consignment`: Flags token as rejected with official rejection rationale.

### 5.5 Weighbridge Terminal Modal
* **Inputs & Actions**:
  * `Gross Weight (kg)`: Automatically captures loaded vehicle weight from digital scale or manual input.
  * `Tare Weight (kg)`: Records empty vehicle weight after unloading.
  * `Net Weight (Quintals)`: Auto-calculated `(Gross - Tare) / 100`.
  * `Confirm & Record Weight`: Commits record to database and unlocks J-Form generation.

### 5.6 Tab: DCA District Intelligence Dashboard (`DepartmentAnalytics.tsx`)
* **District-Level Visualizations**:
  * `Procurement Target vs. Actual Gauges`: Tracks district MSP quota fulfillment.
  * `Hourly Mandi Congestion Heatmap`: Visualizes peak traffic congestion hours across yards.
  * `Inter-Mandi Crop Inflow Charts`: Bar & area charts comparing intake across mandis.
  * `Quality Compliance Distribution`: Donut chart showing percentage of Grade A vs Grade B crops.
* **Control Buttons**:
  * `Dynamic Quota Redistribution`: Shifts incoming slot capacities between adjacent mandis.
  * `Export District Report (CSV / PDF)`: Exports procurement audit log for government records.

---

## 6. Backend API Routes & Endpoints

| Category | Method | Path | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | `POST` | `/api/v1/auth/login` | OAuth2 password token generation |
| | `POST` | `/api/v1/auth/register` | Register new user / farmer |
| | `GET` | `/api/v1/auth/me` | Fetch authenticated user profile |
| **Bookings & Slots** | `GET` | `/api/v1/bookings/` | List bookings (supports filtering by centre/date) |
| | `POST` | `/api/v1/bookings/` | Create a new slot booking |
| | `GET` | `/api/v1/bookings/{id}` | Get booking details |
| | `GET` | `/api/v1/farmer/slots` | Fetch available slot capacities |
| | `POST` | `/api/v1/farmer/slots/recommend` | AI predictive slot recommendation |
| **Queue Management** | `GET` | `/api/v1/queue/` | Fetch live operator mandi queue |
| | `POST` | `/api/v1/queue/tokens` | Issue new queue token |
| | `GET` | `/api/v1/queue/tokens/{id}` | Fetch token live stage & progress |
| | `PUT` | `/api/v1/queue/tokens/{id}/status` | Update token stage (Check-in, Lab, Weigh, Done) |
| **Procurement Centres** | `GET` | `/api/v1/centres/` | List all procurement mandis |
| | `GET` | `/api/v1/crops/` | List all supported crop types & MSP rates |
| **Operator & Lab** | `POST` | `/api/v1/management/quality` | Submit quality lab inspection results |
| | `POST` | `/api/v1/management/weighbridge` | Record gross and tare weights |
| | `POST` | `/api/v1/management/j-forms` | Generate and sign digital J-Form |
| | `GET` | `/api/v1/management/dashboard-stats`| Fetch live KPI overview metrics |
| **DCA Intelligence** | `GET` | `/api/v1/intelligence/district` | Fetch district analytics and load distribution |
| **System** | `GET` | `/api/v1/health` | Docker container health check |

---

## 7. Build, Deployment & Execution Procedures

### 7.1 Dockerized Build & Execution (Recommended)
```bash
# Navigate to the production repository root
cd d:\SIH\KisanFlow-Production

# Build all container images and start the full stack
docker-compose up --build -d

# Verify container status
docker-compose ps

# View live backend logs
docker-compose logs -f backend
```

### 7.2 Service Access Endpoints
* **Farmer Web Application**: `http://localhost:3000`
* **Operator Management Console**: `http://localhost:3001`
* **FastAPI Backend API**: `http://localhost:8000/api/v1`
* **Interactive OpenAPI Swagger Documentation**: `http://localhost:8000/api/v1/docs`
* **PostgreSQL Database Server**: `localhost:5432` (User: `postgres`, DB: `kisanflow`)

---

## 8. Build-up & Architectural Decisions
1. **NPM Workspaces Structure**: Decouples the Farmer mobile/web interface from the High-Density Operator console while sharing TypeScript types, API client Axios configurations, and shared formatting utilities in `frontend/shared`.
2. **Predictive Capacity Engine**: Algorithms compute current vehicle volume and processing speed to prevent gate bottlenecks before farmers leave their farms.
3. **Fail-Safe Offline/Demo Resilience**: Seamless fallback between live async PostgreSQL backend APIs and rich offline mock presets for robust live hackathon demonstrations.
4. **Government Form Compliance**: Accurate adherence to Punjab/Haryana digital J-Form and MSP deduction standards.
