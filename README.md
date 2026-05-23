# AI Phishing Detection Platform (SentinelScan AI)

SentinelScan AI is a full-stack cybersecurity web application designed to identify and analyze phishing threats in URLs, emails, and message templates. The architecture consists of a custom Node/Express gateway, a Python FastAPI machine learning engine, a Supabase SQL database, and two separate premium React/Vite frontends (one for standard users, one for system administrators).

---

## 📂 Project Structure

```txt
AI-Phishing-Detection-Platform/
 ├── backend-node/           # Express Gateway (JWT Auth, Supabase DB connector, Scan pipeline)
 ├── backend-python/         # FastAPI ML Engine (Heuristic checks, TF-IDF NLP model)
 ├── frontend-user/          # User Dashboard Portal (Landing, Scanners, History, Profiles)
 └── frontend-admin/         # Admin Management Portal (User toggles, Logs, Keyword dictionary)
```

---

## 🚀 Getting Started

### 1. Database Configuration (Supabase)
1. Go to your [Supabase Dashboard](https://supabase.com/) and create a new project.
2. Navigate to the **SQL Editor** tab -> Click **New Query**.
3. Copy the contents of [`supabase_setup.sql`](./supabase_setup.sql) and paste it into the editor.
4. Click **Run** to generate the `users` table and seed the default administrator account.
5. **Security & RLS Configuration:** By default, Supabase enables Row-Level Security (RLS) on new tables. To permit registrations/logins from our Express middleware proxy, you must run this command in the Supabase SQL editor:
   ```sql
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ```
   *(Alternatively, if you want to keep RLS active, uncomment and run the RLS policies defined at the top of [`supabase_setup.sql`](./supabase_setup.sql).)*

### 2. Express Server Setup
1. In the `backend-node/` folder, ensure the `.env` file is created and configured with the connection credentials.
2. Navigate to `/backend-node` and run:
   ```bash
   npm install
   npm run dev
   ```

### 3. User Frontend Setup
1. In the `frontend-user/` folder, ensure the `.env` file is created and configured with the client keys.
2. Navigate to `/frontend-user` and run:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

### 4. Admin Frontend Setup
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
```

### 2. User Frontend Client (located in the `frontend-user/` folder)
The `.env` file in the `frontend-user/` folder must contain:
```env
VITE_SUPABASE_URL=https://hfwpxahdseyuxywenwph.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_49CYsJeNiWYb1VRUnRhTMw_I51N5xuY
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmd3B4YWhkc2V5dXh5d2Vud3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTI2MjEsImV4cCI6MjA5NTEyODYyMX0.oYjzmII85ijsYFR9MRrsAmxK5HbvfFZvT5BkkAQNI5E
```

### 3. Admin Frontend Client (located in the `frontend-admin/` folder)
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

### 🌐 User Frontend Portal (`frontend-user`)
*   **Vite & Tailwind CSS v4**: Fully configured Vite build setup with new `@tailwindcss/vite` plugin and modern default styles.
*   **Navigation & Router**: Wired routes using `react-router-dom` mapping `/`, `/login`, `/register`, and `/dashboard`.
*   **Landing Page**: Interactive dark-themed gateway showcasing core features.
*   **Auth Interfaces**: Dynamic screens for Register and Login forms with inline validation messages.
*   **User Dashboard**: Responsive dashboard with statistical tracking blocks (Total scans, safe vs dangerous count, email logs) and quick navigation paths.
*   **Axios Client Wrapper**: Interceptor module that extracts JWT tokens from localStorage and injects them into Authorization headers automatically.

### 🛡️ Admin Management Portal (`frontend-admin`)
*   **Vite & Tailwind CSS v4 Setup**: Complete high-performance development environment with custom red/amber accents.
*   **Admin Registration**: Created a register form to securely provision and scale administrator operator profiles (`role: 'ADMIN'`).
*   **Admin Login Console**: Designed login validation with strict role boundaries (automatically blocks non-admin account logins).
*   **System Overview Dashboard**: Interactive layout displaying recent threat feeds, stopped attacks volume, active user metrics, and navigation sidebars.
*   **Axios Interceptor**: Automatic token extraction (`adminToken`) and header embedding.
