
-- Enable RLS updates for authenticated and anon users on 'requests' and 'clients' for the 'archived' column
-- This is necessary to allow the app to set archived = true

-- Policy for 'requests' table
CREATE POLICY "Allow update on requests"
ON public.requests
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy for 'clients' table
CREATE POLICY "Allow update on clients"
ON public.clients
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Alternatively, if policies already exist, we might need to alter them. 
-- But adding a broad update policy usually fixes simple issues.
-- Note: This matches the "Allow insert" policies usually found in dev environments.
