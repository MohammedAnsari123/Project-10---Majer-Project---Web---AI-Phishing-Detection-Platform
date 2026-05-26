-- SQL Query to set up tables in your Supabase SQL Editor
-- Link to Supabase Dashboard -> Project -> SQL Editor -> New Query

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Hashed password stored from Express
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ALTERNATIVE: If you prefer keeping Row Level Security (RLS) enabled, 
-- comment out the line above and run these policies in the SQL Editor instead:
--
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public insert" ON public.users FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public select" ON public.users FOR SELECT USING (true);
-- CREATE POLICY "Allow public update" ON public.users FOR UPDATE USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow public delete" ON public.users FOR DELETE USING (true);

-- 2. Seed Default Admin Account (Optional helper)
-- Password is hashed version of "admin123" (bcrypt hash: $2a$10$y6q0YqR0gD1ZJskH9.yN1e.uQ/K17fNqW3eM45e54sBvqFhGvVn7u)
-- You can log in using: email: admin@sentinelscan.com, password: admin123
INSERT INTO public.users (name, email, password, role, status)
VALUES (
    'System Admin', 
    'admin@sentinelscan.com', 
    '$2a$10$y6q0YqR0gD1ZJskH9.yN1e.uQ/K17fNqW3eM45e54sBvqFhGvVn7u', 
    'ADMIN', 
    'ACTIVE'
) ON CONFLICT (email) DO NOTHING;

-- 3. Create or update scan_history table to support Day 11-14 integrations
CREATE TABLE IF NOT EXISTS public.scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0,
    risk_level VARCHAR(50) NOT NULL DEFAULT 'LOW',
    status VARCHAR(255) NOT NULL DEFAULT 'Safe',
    recommendation TEXT NOT NULL DEFAULT 'Safe to Continue',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist (for existing tables)
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS status VARCHAR(255);
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS recommendation TEXT;

-- Disable Row Level Security for standard scans proxy
ALTER TABLE public.scan_history DISABLE ROW LEVEL SECURITY;
