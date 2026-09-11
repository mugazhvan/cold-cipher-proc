# KisanFlow Mobile Architecture & Free Cloud Deployment Plan

This document outlines the complete architectural design, screen flows, offline synchronization engine, and **100% Free Cloud Deployment strategy** for the **Farmer Mobile App** and **Operator Mobile App**.

---

## 1. System Architecture & Directory Structure

We will structure the mobile apps under `source/mobile/` to reuse shared API schemas and validation contracts while keeping them completely decoupled.

```
d:\SIH\KisanFlow-Production\source\mobile\
├── farmer-mobile/                # Farmer Expo Application (Target: Android/iOS)
│   ├── app/                      # Expo Router (File-based navigation)
│   │   ├── (auth)/
│   │   │   └── login.tsx         # Phone + Mock OTP Authentication
│   │   ├── (tabs)/
│   │   │   ├── index.tsx         # Farmer Dashboard & Active Slot
│   │   │   ├── book.tsx          # Mandi Selection & Slot Booking Flow
│   │   │   ├── epass.tsx         # Offline E-Gate Pass & QR Display
│   │   │   └── history.tsx       # Past Procurements, Payments & J-Forms
│   │   ├── _layout.tsx
│   │   └── queue/[id].tsx        # Real-time Live Queue Tracker
│   ├── src/
│   │   ├── components/           # UI Kit (Lucide Icons, Cards, Buttons)
│   │   ├── context/              # Auth & Offline Cache State (AsyncStorage)
│   │   └── lib/api.ts            # Axios client pointing to Render Backend
│   ├── app.json                  # Expo App Configuration & EAS Settings
│   ├── eas.json                  # Free EAS Build Configurations
│   └── package.json
│
└── operator-mobile/              # Mandi Gate & Weighbridge Operator App
    ├── app/
    │   ├── (auth)/
    │   │   └── login.tsx         # Operator Authentication
    │   ├── (tabs)/
    │   │   ├── index.tsx         # Daily Mandi Stats & Queue Overview
    │   │   ├── scan.tsx          # Native High-Speed Camera QR Scanner
    │   │   └── workflow.tsx      # Weighbridge, Grading & Payment Approval
    │   ├── _layout.tsx
    │   └── verify/[ref].tsx      # Gate Validation & Physical Token Generation
    ├── src/
    │   ├── components/
    │   ├── context/
    │   └── lib/api.ts
    ├── app.json
    ├── eas.json
    └── package.json
```

---

## 2. Core Feature Matrix

### 🚜 A. Farmer Mobile App (`farmer-mobile`)
1. **Zero-Friction Authentication**: Phone OTP login with persistent auth token stored via `expo-secure-store`.
2. **Interactive Mandi Slot Booking**:
   - Filter by Crop (Paddy, Wheat, etc.).
   - Smart Slot Recommendation based on real-time congestion scores.
3. **Offline-First E-Gate Pass**:
   - Stores QR code image and encrypted payload in local `AsyncStorage`.
   - Displays full pass with farmer photo, vehicle number, and slot time **even without an active internet connection**.
4. **Live Visual Queue Radar**:
   - Real-time token status indicator (`WAITING` ➔ `CALLED` ➔ `WEIGHING` ➔ `COMPLETED`).
   - Push / Haptic sound notification when the farmer's token is called.

### 🏢 B. Operator Mobile Terminal (`operator-mobile`)
1. **Ultra-Fast Native QR Scanning**:
   - Powered by `expo-camera` / `expo-barcode-scanner` with hardware-accelerated detection (< 300ms latency).
   - Instant vibration on successful scan.
2. **Gate Security Validation**:
   - Validates e-Pass cryptographic signature against the live Supabase database.
   - Rejects expired or forged QR passes with clear audio/visual alerts.
3. **Weighbridge & Quality Grading Workflow**:
   - Form for Gross Weight, Tare Weight, and Moisture %.
   - Auto-computes net MSP payout and releases digital J-Form.

---

## 3. How to Deploy & Distribute 100% For Free

You **do NOT need a $99 Apple Developer account or $25 Google Play Console account** to test, demonstrate, and distribute the mobile apps.

Here are the **3 Free Deployment Methods**:

### Method 1: Expo Go (Instant Testing & Presentation Demo) ⭐ *Recommended for Hackathon*
- **Cost**: **$0 (Free)**
- **How it works**:
  1. Install the free **"Expo Go"** app from Google Play Store or Apple App Store on your phone.
  2. Start the project locally:
     ```bash
     npx expo start
     ```
  3. Scan the QR code displayed in your terminal with your phone camera.
  4. The app boots immediately on your physical phone with full native camera and storage access!

---

### Method 2: Free Cloud APK Build via Expo Application Services (EAS) ⭐ *Shareable Android APK*
- **Cost**: **$0 (Free Tier includes 30 Android & iOS cloud builds per month)**
- **How it works**:
  1. Sign up for a free account at [expo.dev](https://expo.dev).
  2. Install EAS CLI:
     ```bash
     npm install -g eas-cli
     eas login
     ```
  3. Configure free standalone Android APK generation in `eas.json`:
     ```json
     {
       "cli": { "version": ">= 10.0.0" },
       "build": {
         "preview": {
           "distribution": "internal",
           "android": {
             "buildType": "apk"
           }
         }
       }
     }
     ```
  4. Run cloud build:
     ```bash
     eas build -p android --profile preview
     ```
  5. EAS Cloud builds the native APK on their servers for free and gives you a **shareable download link & QR code**.
  6. Anyone (judges, team members) can scan the QR code and install the `.apk` directly on any Android smartphone!

---

### Method 3: Expo Free Web & PWA Preview
- **Cost**: **$0 (Free on Vercel / Netlify)**
- Expo Router supports universal compilation:
  ```bash
  npx expo export -p web
  ```
- Generates a progressive web app that can be added to the mobile home screen as a standalone app.
