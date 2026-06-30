-- ====================================================================
-- SentinelScan AI Platform Unified Database Schema & Initial Seed
-- ====================================================================
-- Instructions:
-- 1. Sign in to your Supabase Dashboard.
-- 2. Go to your Project -> SQL Editor -> Click "New Query".
-- 3. Copy the entire contents of this file, paste it into the editor, and click "Run".
-- ====================================================================

-- 1. Create Users Table (Combined schema with 2FA & Verification columns)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Bcrypt hashed password
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Two-Factor Authentication (2FA) Columns
    tfa_enabled BOOLEAN DEFAULT FALSE,
    tfa_secret TEXT,
    -- Email Verification & Reset Password Columns
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    reset_password_token TEXT,
    reset_password_expires TIMESTAMPTZ
);

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;


-- 2. Create Scan History Table (Combined schema with Geolocation columns)
CREATE TABLE IF NOT EXISTS public.scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0,
    risk_level VARCHAR(50) NOT NULL DEFAULT 'LOW',
    status VARCHAR(255) NOT NULL DEFAULT 'Safe',
    recommendation TEXT NOT NULL DEFAULT 'Safe to Continue',
    country_code VARCHAR(10),
    country_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_history DISABLE ROW LEVEL SECURITY;


-- 3. Create HTTP-only Session Refresh Tokens Table
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.refresh_tokens DISABLE ROW LEVEL SECURITY;


-- 4. Create System Operator Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_user_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_audit_logs DISABLE ROW LEVEL SECURITY;


-- 5. Create URL Scans Table
CREATE TABLE IF NOT EXISTS public.url_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_email TEXT DEFAULT 'guest',
    url TEXT NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0,
    risk_level VARCHAR(50) NOT NULL DEFAULT 'LOW',
    virustotal_result JSONB DEFAULT '{}'::jsonb,
    safe_browsing_result JSONB DEFAULT '{}'::jsonb,
    whois_data JSONB DEFAULT '{}'::jsonb,
    dns_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.url_scans DISABLE ROW LEVEL SECURITY;


-- 6. Create Email Scans Table
CREATE TABLE IF NOT EXISTS public.email_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_email TEXT DEFAULT 'guest',
    content TEXT NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0,
    risk_level VARCHAR(50) NOT NULL DEFAULT 'LOW',
    result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_scans DISABLE ROW LEVEL SECURITY;


-- 7. Create Phishing Keywords Table
CREATE TABLE IF NOT EXISTS public.phishing_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(255) UNIQUE NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.phishing_keywords DISABLE ROW LEVEL SECURITY;


-- 8. Create Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_email TEXT DEFAULT 'guest',
    report_type VARCHAR(50) NOT NULL DEFAULT 'URL' CHECK (report_type IN ('URL', 'EMAIL')),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;


-- 9. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_email TEXT,
    activity TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;


-- 10. Create Blacklist and Whitelist Tables
CREATE TABLE IF NOT EXISTS public.blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_or_ip VARCHAR(255) UNIQUE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blacklist DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_or_ip VARCHAR(255) UNIQUE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whitelist DISABLE ROW LEVEL SECURITY;


-- ====================================================================
-- SEED DATA MIGRATION
-- ====================================================================

-- Seed Default Admin Account (Helper credentials)
-- Default Email: admin@sentinelscan.com | Password: admin123
INSERT INTO public.users (name, email, password, role, status, is_verified)
VALUES (
    'System Admin', 
    'admin@sentinelscan.com', 
    '$2a$10$y6q0YqR0gD1ZJskH9.yN1e.uQ/K17fNqW3eM45e54sBvqFhGvVn7u', -- bcrypt hash of "admin123"
    'ADMIN', 
    'ACTIVE',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Seed Default Dynamic Phishing Keywords
INSERT INTO public.phishing_keywords (keyword, severity, category) VALUES
('verify your bank account', 'HIGH', 'banking'),
('urgent password update', 'HIGH', 'credentials'),
('hacked webcam video', 'HIGH', 'extortion'),
('claims free rewards', 'MEDIUM', 'scam'),
('metamask seed recovery', 'HIGH', 'crypto')
ON CONFLICT (keyword) DO NOTHING;
