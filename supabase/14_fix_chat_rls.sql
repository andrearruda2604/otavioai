-- Enable RLS on the chat history table
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Creating policies to allow access (Adjust as needed for security)
-- For now, allowing Authenticated users to Read and Insert (for the Chat UI to work)

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.n8n_chat_histories;
CREATE POLICY "Allow read access for authenticated users" ON public.n8n_chat_histories
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow insert access for authenticated users" ON public.n8n_chat_histories;
CREATE POLICY "Allow insert access for authenticated users" ON public.n8n_chat_histories
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Also checking clients table just in case
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.clients;
CREATE POLICY "Allow read access for authenticated users" ON public.clients
FOR SELECT USING (auth.role() = 'authenticated');

-- Ensure permissions are granted to the role
GRANT SELECT, INSERT, UPDATE ON public.n8n_chat_histories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clients TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.n8n_chat_histories_id_seq TO authenticated;
