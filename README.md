# KisanFlow

KisanFlow is an end-to-end procurement and management platform designed to streamline agricultural operations. It consists of a robust backend API, a web-based management portal for administrators and operators, and mobile applications for farmers and on-ground operators.

## Architecture & Project Structure

The project is structured into three main directories:

- `source/backend`: A Python FastAPI backend providing robust APIs for authentication, procurement management, farmer/crop records, and real-time slot booking.
- `source/frontend`: Contains the web applications, specifically the `management-app` built with React/Vite. This dashboard allows operators and admins to manage centres, verify gate entries, oversee real-time queues, and perform manual slot bookings.
- `source/mobile`: Contains two independent React Native/Expo applications:
  - `farmer-app`: Mobile application for farmers to view prices, book slots, and track their procurement status.
  - `operator-app`: Mobile application for ground operators to verify arrivals, update statuses, and generate J-Forms.

## Technologies Used

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy (SQLite/PostgreSQL), Pydantic, JWT Auth.
- **Frontend**: React, Vite, Tailwind CSS, Lucide React (Icons), React Router.
- **Mobile**: React Native, Expo, NativeWind (Tailwind for React Native).

## Getting Started

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd source/backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The API will be available at `http://localhost:8000`. Swagger UI documentation is available at `http://localhost:8000/docs`.

### 2. Frontend Setup (Management App)

1. Navigate to the frontend directory:
   ```bash
   cd source/frontend/management-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

### 3. Mobile Apps Setup

To develop or build the mobile applications, ensure you have `npx` installed.

1. Navigate to either `source/mobile/farmer-app` or `source/mobile/operator-app`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```

To build APKs for Android:
```bash
npx eas-cli build -p android --profile preview
```
*Note: You must be logged into Expo (`npx eas-cli login`) to use Expo Application Services for building.*

## Core Features

- **Farmer Mobile Portal**: Slot booking, crop pricing view, live queue status.
- **Operator Console**: Gate verification, dynamic queue management, J-Form generation, direct manual bookings.
- **Centre Management**: Admins can oversee multiple procurement centres, assign operators, and monitor overall throughput.