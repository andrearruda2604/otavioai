-- 1. Add is_ai_enabled to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_ai_enabled BOOLEAN DEFAULT true;

-- 2. Create ai_settings table
CREATE TABLE IF NOT EXISTS ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE, -- One setting per user (store)
    max_discount_margin INTEGER DEFAULT 10,
    tone_of_voice TEXT DEFAULT 'friendly', -- 'friendly' | 'technical'
    system_prompt TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS Policies for ai_settings
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
    ON ai_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON ai_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON ai_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. Create messages table if not exists (assuming it exists based on requirements, but safe to verify/create for local testing)
-- Real application likely already has this. Just ensuring the script doesn't fail if we reference it later.
-- Skipping creation of messages as it's a core table likely present.
