-- Migration: Remove nota_interna field from requests table
-- Created: 2026-01-19
-- Description: Removes the nota_interna column as it's no longer needed

-- Drop the column if it exists
ALTER TABLE requests 
DROP COLUMN IF EXISTS nota_interna;

-- Verify the column was removed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requests' 
AND column_name = 'nota_interna';
-- Should return 0 rows
