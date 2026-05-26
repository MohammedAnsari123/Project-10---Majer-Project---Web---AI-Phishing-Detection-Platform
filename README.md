# AI Phishing Detection Platform (SentinelScan AI)

SentinelScan AI is a full-stack cybersecurity web application designed to identify and analyze phishing threats in URLs, emails, and message templates. The architecture consists of a custom Node/Express gateway, a Python FastAPI machine learning engine, a Supabase SQL database, and two separate premium React/Vite frontends (one for standard users, one for system administrators).

---

## 📂 Project Structure

```txt
AI-Phishing-Detection-Platform/
 ├── backend-node/           # Express Gateway (JWT Auth, Supabase DB connector, Scan pipeline)
 ├── backend-python/         # FastAPI Google Safe Browsing microservice
 │    └── app/
 │         ├── config.py     # Environment loader and settings manager
 │         ├── main.py       # FastAPI router entry point
 │         ├── schemas/      # Request models validation (URLRequest)
 │         └── services/     # Safe Browsing lookup and mock fallbacks
 ├── frontend-user/          # User Dashboard Portal (Landing, Scanners, History, Profiles)
 └── frontend-admin/         # Admin Management Portal (User toggles, Logs, Keyword dictionary)
```

---

## 🚀 Getting Started

### 1. Database Configuration (Supabase)
1. Go to your [Supabase Dashboard](https://supabase.com/) and create a new project.
2. Navigate to the **SQL Editor** tab -> Click **New Query**.
3. Copy the contents of [`supabase_setup.sql`](./supabase_setup.sql) and paste it into the editor.
4. Click **Run** to generate the `users` and `scan_history` tables and seed the default administrator account.
5. **Security & RLS Configuration:** By default, Supabase enables Row-Level Security (RLS) on new tables. To permit registrations/logins from our Express middleware proxy, you must run this command in the Supabase SQL editor:
   ```sql
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.scan_history DISABLE ROW LEVEL SECURITY;
   ```
   *(Alternatively, if you want to keep RLS active, uncomment and run the RLS policies defined at the top of [`supabase_setup.sql`](./supabase_setup.sql).)*

### 2. Express Server Setup
1. In the `backend-node/` folder, ensure the `.env` file is created and configured with the connection credentials.
2. Navigate to `/backend-node` and run:
   ```bash
   npm install
   npm run dev
   ```

### 3. Python FastAPI Setup
1. In the `backend-python/` folder, ensure the `.env` file is created and configured with the Google Safe Browsing API key.
2. Navigate to `/backend-python` and run:
   ```bash
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

### 4. User Frontend Setup
1. In the `frontend-user/` folder, ensure the `.env` file is created and configured with the client keys.
2. Navigate to `/frontend-user` and run:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

### 5. Admin Frontend Setup
1. In the `frontend-admin/` folder, ensure the `.env` file is created and configured with the admin client keys.
2. Navigate to `/frontend-admin` and run:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5174` in your browser.

---

## ⚙️ Environment Configurations (.env Files)

To keep API keys and secrets secure, separate `.env` files are maintained in each project directory. Below is the folder location and required content for each file:

### 1. Backend Gateway (located in the `backend-node/` folder)
The `.env` file in the `backend-node/` folder must contain:
```env
PORT=5000
JWT_SECRET=supersecretjwtkeyforphishguard123!
SUPABASE_URL=https://hfwpxahdseyuxywenwph.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmd3B4YWhkc2V5dXh5d2Vud3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTI2MjEsImV4cCI6MjA5NTEyODYyMX0.oYjzmII85ijsYFR9MRrsAmxK5HbvfFZvT5BkkAQNI5E
VIRUSTOTAL_API_KEY=2e995ab3c1a5c8ba7a8b9d69c1920609c1715ab441717f5c721d4af01ab4d3ab
PYTHON_BACKEND_URL=http://localhost:8000
```

### 2. Python FastAPI Server (located in the `backend-python/` folder)
The `.env` file in the `backend-python/` folder must contain:
```env
GOOGLE_SAFE_BROWSING_API_KEY=AIzaSyAk5M061ewIf9QSda_Ln77ZIGmM23AODX0
```

### 3. User Frontend Client (located in the `frontend-user/` folder)
The `.env` file in the `frontend-user/` folder must contain:
```env
VITE_SUPABASE_URL=https://hfwpxahdseyuxywenwph.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_49CYsJeNiWYb1VRUnRhTMw_I51N5xuY
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmd3B4YWhkc2V5dXh5d2Vud3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTI2MjEsImV4cCI6MjA5NTEyODYyMX0.oYjzmII85ijsYFR9MRrsAmxK5HbvfFZvT5BkkAQNI5E
```

### 4. Admin Frontend Client (located in the `frontend-admin/` folder)
The `.env` file in the `frontend-admin/` folder must contain:
```env
VITE_SUPABASE_URL=https://hfwpxahdseyuxywenwph.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_49CYsJeNiWYb1VRUnRhTMw_I51N5xuY
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmd3B4YWhkc2V5dXh5d2Vud3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTI2MjEsImV4cCI6MjA5NTEyODYyMX0.oYjzmII85ijsYFR9MRrsAmxK5HbvfFZvT5BkkAQNI5E
```

---

## 📊 Completed Implementation List

This section details all components and systems that are currently implemented and functional:

### 🔑 Authentication & Database (100% Done)
*   **Supabase Integration**: Designed database structures, prepared SQL seed scripts, and integrated the official `@supabase/supabase-js` SDK inside Express.
*   **Secure Password Hashing**: Integrated `bcryptjs` hashing for storing and verifying password values during registration and logins.
*   **JWT Tokens**: Implemented Bearer token authorization, sign/verify loops, and middleware guards (`protect` & `adminOnly`).
*   **Role-Based Access Control (RBAC)**: Separated user actions from admin scopes via Express token claims and state routing.

### 🔌 Backend API Gateway & Heuristic Scanner (`backend-node`)
*   **Express Entry & Test Route**: Setup Express HTTP gateway with Cors/Helmet security policies and a helper verification route (`GET /api/test`).
*   **Alias Scanning Endpoints**: Implemented scanning routers that concurrently support both `/api/scan-url` and `/api/scan/url` `POST` requests.
*   **Heuristic URL Analyzer**: Implemented a structural threat detection engine evaluating HTTPS presence, suspicious keywords (login, verify, secure, banking, paypal, etc.), excessive hyphens count (>= 3), length bounds (> 60), and raw IP address host patterns.
*   **VirusTotal API Integration (Day 11)**: Added a lookup reputation service (`src/services/virusTotalService.js`) returning vendor detection scores. Falls back to a mock mode checking suspicious strings if no key is configured.
*   **Combined Risk Engine (Day 12)**: Implemented scoring calculation (HTTPS missing: +15, Keywords: +20, VirusTotal flagged: +40, Google flagged: +50) capped at 100%. Returns risk levels (HIGH, MEDIUM, LOW) and recommendations.
*   **Database History Logging (Day 14)**: Configured insertion scripts using user email matching fields (`user_email`, `content`, `result`, `risk_level`, `risk_score`) to match Supabase schema columns.
*   **User Scans Audit Route (Day 14)**: Added a protected `GET /api/history` endpoint that pulls the logged-in user's scans, and maps database fields to the exact JSON structure expected by the frontend client.

### 🐍 Python Reputation Microservice (`backend-python`)
*   **FastAPI Project Structure**: Organized into standard folder structure containing `app/main.py`, `app/config.py`, `app/schemas/url.py`, and `app/services/safe_browsing.py`.
*   **Google Safe Browsing Integration (Day 12)**: Exposes a `/scan-url` POST endpoint that queries Google Safe Browsing API v4. Includes a mock checking fallback that flags threats in suspicious domains when running without an API key.

### 🌐 User Frontend Portal (`frontend-user`)
*   **Vite & Tailwind CSS v4**: Fully configured Vite build setup with new `@tailwindcss/vite` plugin and modern default styles.
*   **Navigation & Router**: Wired routes using `react-router-dom` mapping `/`, `/login`, `/register`, `/dashboard`, `/url-scanner`, and `/history`.
*   **Fixed Navigation Sidebar**: Created a sticky Navigation Sidebar component fixed to the screen height with explicit z-index controls.
*   **Offset Main Layout**: Adjusted main content panels with page-padding offsets (`md:pl-64`) to align beautifully next to the fixed sidebar without visual overlaps.
*   **Landing Page**: Interactive dark-themed gateway showcasing core features.
*   **Auth Interfaces**: Dynamic screens for Register and Login forms with inline validation messages.
*   **Dynamic User Dashboard (Day 14)**: Responsive dashboard pulling live DB data through `/api/history`. Aggregates and displays scans count, safe metrics, and dangerous warnings count.
*   **Upgraded URL Scanner (Day 13)**: Input scanner interface equipped with:
    - **Visual Risk Score Bar**: Color-coded progress meter indicating risk percentage.
    - **Threat Badges**: Glowing indicator cards displaying LOW, MEDIUM, or HIGH risk.
    - **API Detection Card**: Real-time checklist showing Heuristic, VirusTotal, and Google Safe Browsing matches.
    - **Action Plan Recommendation Box**: Advisory recommendations guiding the user.
*   **Enhanced Scan History Page (Day 14)**: Dedicated logs portal at `/history` containing:
    - **Live search input box** to search logs by URL.
    - **Risk category tab buttons** (All, High, Medium, Low) to filter log rows instantly.
    - **Tabular grid layout** columns for URL, Risk Level, Status, and Scan Date.
*   **Axios Client Wrapper**: Interceptor module that extracts JWT tokens from localStorage and injects them into Authorization headers automatically.

### 🛡️ Admin Management Portal (`frontend-admin`)
*   **Vite & Tailwind CSS v4 Setup**: Complete high-performance development environment with custom red/amber accents.
*   **Fixed Navigation Sidebar**: Positioned admin-specific menu overview sidebar (`fixed top-0 left-0 h-screen z-30`) paired with relative viewport offsets to structure control settings.
*   **Admin Registration**: Created a register form to securely provision and scale administrator operator profiles (`role: 'ADMIN'`).
*   **Admin Login Console**: Designed login validation with strict role boundaries (automatically blocks non-admin account logins).
*   **System Overview Dashboard**: Interactive layout displaying recent threat feeds, stopped attacks volume, active user metrics, and navigation sidebars.
*   **Axios Interceptor**: Automatic token extraction (`adminToken`) and header embedding.
