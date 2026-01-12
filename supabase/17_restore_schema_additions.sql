
-- RESTORE SCHEMA ADDITIONS
-- This script restores columns and permissions that may have been lost if tables were recreated.

-- 1. Add 'archived' column back (if missing)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- 2. Add 'company_name' to clients (Required for Dashboard)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_name text;

-- 3. Re-create Indexes
CREATE INDEX IF NOT EXISTS idx_clients_archived ON public.clients(archived);
CREATE INDEX IF NOT EXISTS idx_requests_archived ON public.requests(archived);

-- 4. FIX PERMISSIONS (RLS)
-- Allow updates on 'archived' for all users
GRANT UPDATE (archived) ON public.requests TO anon, authenticated, service_role;
GRANT UPDATE (archived) ON public.clients TO anon, authenticated, service_role;
GRANT UPDATE (company_name) ON public.clients TO anon, authenticated, service_role;

-- Re-apply Policies (Safe Drop/Create)
DROP POLICY IF EXISTS "Allow update on requests" ON public.requests;
CREATE POLICY "Allow update on requests" ON public.requests FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on clients" ON public.clients;
CREATE POLICY "Allow update on clients" ON public.clients FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Ensure Read Access is still there (just in case)
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.requests;
CREATE POLICY "Allow read access for authenticated users" ON public.requests FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.clients;
CREATE POLICY "Allow read access for authenticated users" ON public.clients FOR SELECT TO public USING (true);
