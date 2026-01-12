-- Add archived column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Add archived column to requests table
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Add index for performance on filtering
CREATE INDEX IF NOT EXISTS idx_clients_archived ON public.clients(archived);
CREATE INDEX IF NOT EXISTS idx_requests_archived ON public.requests(archived);
