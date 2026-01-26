-- 1. Create chats table if not exists
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_name TEXT NOT NULL,
    company_name TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create messages table if not exists
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add is_ai_enabled to chats table (idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'is_ai_enabled') THEN
        ALTER TABLE chats ADD COLUMN is_ai_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. Enable RLS for chats and messages (Simple open policy for demo/testing, refine for production)
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON chats FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON messages FOR ALL USING (auth.role() = 'authenticated');

-- 5. Create ai_settings table (DEPRECATED)
-- CREATE TABLE IF NOT EXISTS ai_settings (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE, -- One setting per user (store)
--     max_discount_margin INTEGER DEFAULT 10,
--     tone_of_voice TEXT DEFAULT 'friendly', -- 'friendly' | 'technical'
--     system_prompt TEXT DEFAULT '',
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- 6. RLS Policies for ai_settings (DEPRECATED)
-- ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent errors on re-run
-- DROP POLICY IF EXISTS "Users can view their own settings" ON ai_settings;
-- DROP POLICY IF EXISTS "Users can update their own settings" ON ai_settings;
-- DROP POLICY IF EXISTS "Users can insert their own settings" ON ai_settings;

-- CREATE POLICY "Users can view their own settings"
--     ON ai_settings FOR SELECT
--     USING (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own settings"
--     ON ai_settings FOR UPDATE
--     USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert their own settings"
--     ON ai_settings FOR INSERT
--     WITH CHECK (auth.uid() = user_id);

-- 7. Insert Mock Data for Chats/messages if empty
INSERT INTO chats (contact_name, company_name, is_ai_enabled)
SELECT 'Ana Souza', 'Auto Peças Central', true
WHERE NOT EXISTS (SELECT 1 FROM chats);

INSERT INTO chats (contact_name, company_name, is_ai_enabled)
SELECT 'Henrique Silva', 'Marinho & Filhos', false
WHERE NOT EXISTS (SELECT 1 FROM chats WHERE contact_name = 'Henrique Silva');

-- Add mock messages for analytics (Lost Sales simulation)
DO $$
DECLARE
    chat_id_val UUID;
BEGIN
    SELECT id INTO chat_id_val FROM chats WHERE contact_name = 'Ana Souza' LIMIT 1;
    IF chat_id_val IS NOT NULL THEN
        INSERT INTO messages (chat_id, role, content)
        SELECT chat_id_val, 'user', 'Vocês tem o parachoque do HB20 2023?'
        WHERE NOT EXISTS (SELECT 1 FROM messages WHERE content = 'Vocês tem o parachoque do HB20 2023?');

        INSERT INTO messages (chat_id, role, content)
        SELECT chat_id_val, 'assistant', 'Desculpe, não encontrei o parachoque do HB20 2023 em nosso estoque no momento.'
        WHERE NOT EXISTS (SELECT 1 FROM messages WHERE content = 'Desculpe, não encontrei o parachoque do HB20 2023 em nosso estoque no momento.');
    END IF;
END $$;
