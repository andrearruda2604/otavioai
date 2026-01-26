-- Migration: Add Knowledge Base Support
-- This adds URL columns to ai_settings and creates the knowledge_files table

-- 1. Add URL columns to ai_settings table (DEPRECATED: Table removed)
-- ALTER TABLE ai_settings 
-- ADD COLUMN IF NOT EXISTS site_url TEXT,
-- ADD COLUMN IF NOT EXISTS instagram_url TEXT,
-- ADD COLUMN IF NOT EXISTS facebook_url TEXT,
-- ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- 2. Create knowledge_files table for document storage metadata
CREATE TABLE IF NOT EXISTS knowledge_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on knowledge_files
ALTER TABLE knowledge_files ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for knowledge_files
CREATE POLICY "Users can view their own files"
    ON knowledge_files FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
    ON knowledge_files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
    ON knowledge_files FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_files_user_id ON knowledge_files(user_id);

-- 6. Note: You must also create a Supabase Storage bucket named 'knowledge-files'
-- This is done via the Supabase Dashboard:
-- 1. Go to Storage > New Bucket
-- 2. Name: "knowledge-files"
-- 3. Public: false (or true if you want public URLs)
-- 4. Add policies for authenticated users to upload/read their own files
