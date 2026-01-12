
-- Safe RLS update script
-- Defines policies to allow updating the 'archived' status

-- 1. REQUESTS TABLE
DROP POLICY IF EXISTS "Allow update on requests" ON public.requests;

CREATE POLICY "Allow update on requests"
ON public.requests
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Explicitly grant update permission on the column (sometimes needed for Anon role)
GRANT UPDATE (archived) ON public.requests TO anon;
GRANT UPDATE (archived) ON public.requests TO authenticated;
GRANT UPDATE (archived) ON public.requests TO service_role;


-- 2. CLIENTS TABLE
DROP POLICY IF EXISTS "Allow update on clients" ON public.clients;

CREATE POLICY "Allow update on clients"
ON public.clients
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

GRANT UPDATE (archived) ON public.clients TO anon;
GRANT UPDATE (archived) ON public.clients TO authenticated;
GRANT UPDATE (archived) ON public.clients TO service_role;

-- 3. VERIFY
-- This query doesn't change data but confirms keys are set
SELECT count(*) FROM public.requests WHERE archived IS TRUE;
