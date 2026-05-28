# AI Phishing Detection Platform (SentinelScan AI)

SentinelScan AI is a full-stack cybersecurity web application designed to identify and analyze phishing threats in URLs, emails, and message templates. The architecture consists of a custom Node/Express gateway, a Python FastAPI machine learning engine, a Supabase SQL database, and two separate premium React/Vite frontends (one for standard users, one for system administrators).

---

## 📂 Project Structure

```txt
AI-Phishing-Detection-Platform/
 ├── backend-node/           # Express Gateway (JWT Auth, Supabase DB connector, scan pipelines)
 │    └── src/
 │         ├── config/       # Database configuration (Supabase SDK client initialization)
 │         ├── controllers/  # Controllers (auth, email, report, admin, history, analytics)
 │         ├── middleware/   # Token guard verification (protect, adminOnly role middleware)
 │         ├── routes/       # API routers (auth, email, url, report, admin, history, analytics)
 │         ├── services/     # Node.js backend services (VirusTotal, email analysis)
 │         ├── utils/        # Key detection rules & legacy wrappers (phishingKeywords, urlAnalyzer)
 │         └── index.js      # Node Express server entrypoint
 ├── backend-python/         # FastAPI ML Engine, Analytics Computations, and Search proxy
 │    └── app/
 │         ├── config.py     # Environment settings manager
 │         ├── main.py       # FastAPI router (Google lookup, analytics, filtered history/reports)
 │         ├── schemas/      # Request models validation (URLRequest)
 │         └── services/     # Python backend services (Safe Browsing lookup, Supabase db_query REST API helper)
 ├── frontend-user/          # User Dashboard Portal (Landing, Scanners, History, Reports, SVG Charts)
 └── frontend-admin/         # Admin Management Portal (User toggles, Scan Logs, Reports list, SVG Charts)
```

---

## 🚀 Getting Started

### 1. Database Configuration (Supabase)
1. Go to your [Supabase Dashboard](https://supabase.com/) and create a new project.
2. Navigate to the **SQL Editor** tab -> Click **New Query**.
3. Copy the contents of [`supabase_setup.sql`](./supabase_setup.sql) and paste it into the editor.
4. Click **Run** to generate the `users` and `scan_history` tables.
5. Create additional tables to support Week 3 email scans and security threat reports:
   ```sql
   -- 1. Email scans history table
   CREATE TABLE IF NOT EXISTS public.email_scans (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
       user_email TEXT,
       content TEXT NOT NULL,
       risk_score INTEGER NOT NULL DEFAULT 0,
       risk_level VARCHAR(50) NOT NULL DEFAULT 'LOW',
       result JSONB NOT NULL DEFAULT '{}'::jsonb,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ALTER TABLE public.email_scans DISABLE ROW LEVEL SECURITY;

   -- 2. Reports table
   CREATE TABLE IF NOT EXISTS public.reports (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
       user_email TEXT,
       report_type VARCHAR(50) NOT NULL, -- 'URL' or 'EMAIL'
       details JSONB NOT NULL DEFAULT '{}'::jsonb,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
   ```
6. **Security & RLS Configuration:** Ensure Row-Level Security (RLS) is disabled for local API proxy connections:
   ```sql
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.scan_history DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.email_scans DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
   ```

### 2. Express Server Setup
1. In the `backend-node/` folder, ensure the `.env` file is created and configured.
2. Navigate to `/backend-node` and run:
   ```bash
   npm install
   npm run dev
   ```

### 3. Python FastAPI Setup
1. In the `backend-python/` folder, ensure the `.env` file is configured with the Google Safe Browsing API key and Supabase credentials.
2. Navigate to `/backend-python` and run:
   ```bash
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload --port 8000
   ```

### 4. User Frontend Setup
1. In the `frontend-user/` folder, ensure the `.env` file is configured.
2. Navigate to `/frontend-user` and run:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

### 5. Admin Frontend Setup
1. In the `frontend-admin/` folder, ensure the `.env` file is configured.
2. Navigate to `/frontend-admin` and run:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5174` in your browser.

---

## ⚙️ Environment Configurations (.env Files)

To keep API keys and secrets secure, separate `.env` files are maintained in each project directory:

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
SUPABASE_URL=https://hfwpxahdseyuxywenwph.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmd3B4YWhkc2V5dXh5d2Vud3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTI2MjEsImV4cCI6MjA5NTEyODYyMX0.oYjzmII85ijsYFR9MRrsAmxK5HbvfFZvT5BkkAQNI5E
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
*   **Express Entry & Security Policies**: Setup Express HTTP gateway with Cors/Helmet security policies.
*   **Heuristic URL Analyzer**: Implemented a structural threat detection engine evaluating HTTPS presence, suspicious keywords (login, verify, secure, banking, paypal, etc.), excessive hyphens count (>= 3), length bounds (> 60), and raw IP address host patterns.
*   **VirusTotal API Integration (Day 11)**: Added a lookup reputation service (`src/services/virusTotalService.js`) returning vendor detection scores. Falls back to a mock mode checking suspicious strings if no key is configured.
*   **Combined Risk Engine (Day 12)**: Implemented scoring calculation (HTTPS missing: +15, Keywords: +20, VirusTotal flagged: +40, Google flagged: +50) capped at 100%. Returns risk levels (HIGH, MEDIUM, LOW) and recommendations.
*   **Email Analyzer Logic (Days 15 & 16)**:
    *   Created `phishingKeywords.js` defining weights: Urgency keywords (+10), Banking keywords (+15), Credential keywords (+20), and Scam keywords (+10).
    *   Created `emailAnalysisService.js` to process email bodies, match terms, calculate cumulative scores (capped at 100), risk levels, and custom recommendations.
    *   Created `emailController.js` and `emailRoutes.js` exposing `POST /api/scan/email` (protected by JWT middleware, writes logs to `email_scans` table and report details to `reports` table).
*   **Automatic Reports Logger (Day 17)**: Configured URL and Email scanners to automatically generate and save detailed threat diagnostics reports in the `reports` table.
*   **Administrative Control Routes (Day 18)**:
    *   `GET /api/admin/dashboard`: Compiles user volumes, total URL/email scans, and high-risk incidents.
    *   `GET /api/admin/users`: Returns registered user accounts.
    *   `PUT /api/admin/users/:id/status`: Allows administrators to suspend/activate standard user accounts.
    *   `GET /api/admin/logs`: Fetches consolidated scan activity logs.
*   **Analytics Gateway & Proxy Fallbacks (Day 19 & 21)**:
    *   Exposes `GET /api/analytics` and proxies it to the Python server.
    *   Exposes `GET /api/history` and `GET /api/reports` proxying search requests to the Python server.
    *   Added local database queries as fallbacks for all proxy routes in Node.js to ensure the system remains operational if the Python server is offline.

### 🐍 Python Reputation microservice & Search Engine (`backend-python`)
*   **FastAPI Project Structure**: Organized into standard folder structure containing `app/main.py`, `app/config.py`, `app/schemas/url.py`, and `app/services/db_query.py`.
*   **Google Safe Browsing Integration (Day 12)**: Exposes a `/scan-url` POST endpoint that queries Google Safe Browsing API v4. Includes a mock checking fallback that flags threats in suspicious domains when running without an API key.
*   **Database REST API Connector (Day 19)**: Exposes a direct SQL-less database lookup service (`db_query.py`) that queries Supabase table endpoints via HTTP REST.
*   **FastAPI Analytics computations (Day 19)**: Exposes `GET /api/analytics` returning threat distribution segments (Safe vs Suspicious vs Dangerous) and daily scan timeline datasets.
*   **FastAPI Search and Filters API (Day 20)**: Exposes search endpoints `/api/history` and `/api/reports` supporting query filters:
    *   `risk`: ALL, LOW, MEDIUM, HIGH
    *   `type`: ALL, URL, EMAIL
    *   `date`: ALL, TODAY, 7DAYS, 30DAYS
    *   `search`: Keyword search text matching domains, preview, and reasons

### 🌐 User Frontend Portal (`frontend-user`)
*   **Fixed Navigation Sidebar & offset Main Layout**: Fixed-height sidebar aligned next to content layouts with responsive offset margins (`md:pl-64`).
*   **Auth Interfaces**: register and login screens with inline validations.
*   **Email Analyzer Interface (Day 15 & 16)**: Paste email text box, severity gauges indicating risk percentages, and indicator highlight pills.
*   **Security Threat Reports Page (Day 17)**: Threat intelligence logs at `/reports` showing collapsible report cards for URL heuristics (antivirus positive counts, Google Safebrowsing, heuristics checklist) and email preview indicators.
*   **Scan History Page (Day 20)**: Audit history featuring Type (URL vs Email) selectors, date filters, risk level tags, and tabular pagination.
*   **Dynamic Dashboard (Day 19)**: User overview page rendering:
    *   **Automated Metrics Cards**: Total scans volume, safe items count, threats flagged, and email scans volume.
    *   **Daily Scan Activity Chart**: SVG bar chart showing the last 14 days of scanning volume, complete with hover tooltips displaying URL and Email breakdown.
    *   **Threat Distribution Chart**: Donut progress ring rendering low, medium, and high severity divisions.

### 🛡️ Admin Management Portal (`frontend-admin`)
*   **System Overview Dashboard (Day 18 & 19)**: Dashboard showing recent blocked attacks, total users, scan volumes, active threat timelines (SVG charts), and audit options.
*   **User Management Console (Day 18)**: Table listing registered users, showing user details (name, email, role, date), and active controls allowing operators to toggle statuses (suspend or activate accounts).
*   **Scan Audit Logs Page (Day 18 & 20)**: Unified system logs listing showing scan types, operator email addresses, scanned contents, risk levels, and timestamps, supported by full type, risk, and keyword search filters.
