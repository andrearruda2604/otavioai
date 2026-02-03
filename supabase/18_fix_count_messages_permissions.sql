-- Enable RLS on count_messages if not already enabled
ALTER TABLE IF EXISTS public.count_messages ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT SELECT ON TABLE public.count_messages TO authenticated;
GRANT SELECT ON TABLE public.count_messages TO anon;

-- Create policy for reading
DROP POLICY IF EXISTS "Allow read access for all users" ON public.count_messages;
CREATE POLICY "Allow read access for all users" ON public.count_messages
    FOR SELECT USING (true);

-- Optional: Allow update/insert if needed, but for now just read
-- Ensure rows exist (upsert)
INSERT INTO public.count_messages (id, messages_counter)
VALUES 
    (1, 0),
    (2, 0)
ON CONFLICT (id) DO NOTHING;
