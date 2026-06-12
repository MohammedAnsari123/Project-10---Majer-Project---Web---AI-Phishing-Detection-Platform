-- SQL update migration to add new features to the database

-- 1. Extend Users Table with Verification & Reset Fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_password_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMPTZ;

-- 2. Create url_scans Table
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

-- 3. Create email_scans Table (if not exists)
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

-- 5. Create phishing_keywords Table
CREATE TABLE IF NOT EXISTS public.phishing_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(255) UNIQUE NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.phishing_keywords DISABLE ROW LEVEL SECURITY;

-- Seed some default dynamic phishing keywords
INSERT INTO public.phishing_keywords (keyword, severity, category) VALUES
('verify your bank account', 'HIGH', 'banking'),
('urgent password update', 'HIGH', 'credentials'),
('hacked webcam video', 'HIGH', 'extortion'),
('claims free rewards', 'MEDIUM', 'scam'),
('metamask seed recovery', 'HIGH', 'crypto')
ON CONFLICT (keyword) DO NOTHING;

-- 6. Create reports Table (if not exists)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_email TEXT DEFAULT 'guest',
    report_type VARCHAR(50) NOT NULL DEFAULT 'URL' CHECK (report_type IN ('URL', 'EMAIL')),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- 7. Create activity_logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_email TEXT,
    activity TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

-- 8. Create blacklist and whitelist Tables
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
