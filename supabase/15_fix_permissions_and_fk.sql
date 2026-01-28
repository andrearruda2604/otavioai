-- FIX SCRIPT: Permissions and Integrity
-- Run this to allow the test data script to work and fix database relationships.

-- 1. Truncate orphaned data in requests_products
TRUNCATE TABLE public.requests_products;

-- 2. Restore Foreign Key between requests_products and requests
-- (This link was broken when 'requests' was dropped/recreated)
ALTER TABLE public.requests_products 
DROP CONSTRAINT IF EXISTS requested_parts_request_id_fkey;

ALTER TABLE public.requests_products
ADD CONSTRAINT requested_parts_request_id_fkey 
FOREIGN KEY (request_id) 
REFERENCES public.requests(request_id)
ON DELETE CASCADE;

-- 3. Fix Permissions for Clients
-- We enable RLS but add a policy to allow ANYONE to insert/select for now (Validation Mode)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for clients" ON public.clients;
CREATE POLICY "Enable all access for clients" ON public.clients
FOR ALL USING (true) WITH CHECK (true);

-- 4. Fix Permissions for Requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for requests" ON public.requests;
CREATE POLICY "Enable all access for requests" ON public.requests
FOR ALL USING (true) WITH CHECK (true);

-- 5. Fix Permissions for Requests Products
ALTER TABLE public.requests_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for requests_products" ON public.requests_products;
CREATE POLICY "Enable all access for requests_products" ON public.requests_products
FOR ALL USING (true) WITH CHECK (true);

-- 6. Ensure Sequences are accurate (Optional but good practice)
SELECT setval(pg_get_serial_sequence('"public"."clients"', 'client_id'), coalesce(max(client_id), 1), max(client_id) IS NOT null) FROM "public"."clients";
SELECT setval(pg_get_serial_sequence('"public"."requests"', 'request_id'), coalesce(max(request_id), 1), max(request_id) IS NOT null) FROM "public"."requests";
