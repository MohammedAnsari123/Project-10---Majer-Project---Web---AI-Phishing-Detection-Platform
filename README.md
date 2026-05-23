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

### 2. Express Server Setup
1. Open [`backend-node/.env`](./backend-node/.env) and enter your Supabase connection strings:
   ```env
   PORT=5000
   JWT_SECRET=supersecretjwtkeyforphishguard123!
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-project-anon-public-key
   ```
2. Navigate to `/backend-node` and run:
   ```bash
   npm install
   npm run dev
   ```

### 3. User Frontend Setup
1. Navigate to `/frontend-user` and run:
   ```bash
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.

### 4. Admin Frontend Setup
1. Navigate to `/frontend-admin` and run:
   ```bash
   npm install
   npm run dev
   ```
2. Open `http://localhost:5174` in your browser.

---

## 📊 Project Roadmap: What's Done vs. What's Left

Below is a detailed status breakdown of all core deliverables.

### 🔑 Authentication & Database
*   **Completed (100% Done):**
    *   [x] Designed Supabase PostgreSQL schema with roles (`USER` & `ADMIN`) and account flags (`ACTIVE` & `SUSPENDED`).
    *   [x] Built Express JWT token generator, parsing middleware, and route guards (`protect` & `adminOnly`).
    *   [x] Implemented password encryption using `bcryptjs` hashing.
    *   [x] Coded the Supabase SDK database connection wrapper.
    *   [x] Setup default user and seed admin scripts.

---

### 🌐 User Frontend Portal (`frontend-user`)
*   **Completed (Done):**
    *   [x] Integrated Tailwind CSS v4 using the new high-performance `@tailwindcss/vite` compiler plugin.
    *   [x] Set up Axios API client interceptor to attach JWT Authorization headers automatically.
    *   [x] Configured SPA Router routing landing page, login page, registration page, and main layout.
    *   [x] Built premium, dark-themed responsive layout with sidebars and quick action widgets.
    *   [x] Coded dynamic statistics dashboard widgets (Scans volume, Safe items, Danger indicators, Email count).
*   **Remaining (Left to Build):**
    *   [ ] **URL Scanner UI:** Build an input form that displays a scanning progress state and outputs threat score breakdowns (Lexical features, VirusTotal, Google Safe Browsing, Custom keyword logs).
    *   [ ] **Email Content Analyzer UI:** Create a text editor where users paste email templates, which automatically highlights detected scam keywords (e.g., "Urgent", "Verify Account") and outputs a risk level gauge.
    *   [ ] **Searchable Scan History:** Create a paginated data table showing the user's previous scans, with filters for threat level and scan type.
    *   [ ] **Profile Settings Screen:** Enable users to edit their credentials and request password resets.

---

### 🛡️ Admin Management Portal (`frontend-admin`)
*   **Completed (Done):**
    *   [x] Built the Vite configuration with Tailwind CSS v4 support.
    *   [x] Programmed the Axios API wrapper to attach authorization credentials.
    *   [x] Designed an Admin Register view to register brand-new system operators.
    *   [x] Designed an Admin Login portal which validates client role credentials.
    *   [x] Created the Administrator shell layout with secure, restricted sidebar navigation.
    *   [x] Built a System Overview dashboard showcasing recent database flags, average threat rates, and total user metrics.
*   **Remaining (Left to Build):**
    *   [ ] **User Accounts Management:** Build a data table displaying registered users, with actions to suspend/activate accounts or delete them.
    *   [ ] **Global Detection Logs:** Create a master log list of all scans run on the platform, filterable by risk rating and user tags.
    *   [ ] **Custom Keyword Config Dictionary:** Develop a CRUD panel where administrators can add, update, or remove high-risk words from the global phishing lookup list.
    *   [ ] **Advanced Analytics Visualizations:** Use interactive Recharts graphs to plot daily scan rates, common phishing domains, and trigger-word distributions.

---

### ⚙️ Backend Logic Gateway (`backend-node`)
*   **Completed (Done):**
    *   [x] Created Express routers for authentication processes (`/api/auth/register`, `/api/auth/login`, `/api/auth/profile`).
    *   [x] Implemented Helmet security protection, CORS wrappers, and global Express error handling.
*   **Remaining (Left to Build):**
    *   [ ] **URL Scan Processing Engine:** Write URL parser to inspect domain patterns, query VirusTotal / Google Safe Browsing APIs concurrently, and fetch ML risk grades.
    *   [ ] **Email Text Threat Analyzer:** Match inputs against local keyword dictionaries, send templates to Python FastAPI NLP classifiers, and calculate threat percentages.
    *   [ ] **Admin Controls APIs:** Set up user suspension toggles, logging filters, and custom keyword dictionary actions.
    *   [ ] **Export Reports Engine:** Add PDF/CSV generation scripts allowing users to download detailed threat summaries.

---

### 🧠 Python AI Classifier Service (`backend-python`)
*   **Remaining (Left to Build):**
    *   [ ] **Environment Setup:** Configure dependencies (`fastapi`, `uvicorn`, `scikit-learn`, `pandas`, `joblib`).
    *   [ ] **Model Training Pipeline:** Train a supervised ML text classifier (e.g., Logistic Regression or Naive Bayes) using pre-processed email phishing datasets.
    *   [ ] **Lexical Feature Extractor:** Write code to compute lexical features on incoming URL strings (length, dot count, subdomain depths, specific characters).
    *   [ ] **Prediction Endpoints:** Expose `POST /api/predict/url` and `POST /api/predict/email` to provide risk probability scores to the Node gateway.
