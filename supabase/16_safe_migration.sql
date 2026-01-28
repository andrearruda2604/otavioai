-- SAFE MIGRATION SCRIPT
-- RUN THIS IF YOU HAVE EXISTING DATA
-- This script uses ALTER TABLE and IF NOT EXISTS to avoid data loss.

-- 1. FIX CLIENTS TABLE
-- Ensure 'clients' has the necessary columns for the CRM
DO $$
BEGIN
    -- Add 'company_name' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'company_name') THEN
        ALTER TABLE public.clients ADD COLUMN company_name text;
    END IF;

    -- Add 'archived' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'archived') THEN
        ALTER TABLE public.clients ADD COLUMN archived boolean DEFAULT false;
    END IF;

    -- Add 'fup_done' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'fup_done') THEN
        ALTER TABLE public.clients ADD COLUMN fup_done boolean DEFAULT false;
    END IF;
END $$;

-- 2. FIX REQUESTS TABLE
DO $$
BEGIN
    -- Add 'archived' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'archived') THEN
        ALTER TABLE public.requests ADD COLUMN archived boolean DEFAULT false;
    END IF;
    
    -- Add 'total_price' if missing (some old schemas might be missing it)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'total_price') THEN
        ALTER TABLE public.requests ADD COLUMN total_price numeric;
    END IF;
END $$;

-- 3. RENAME TABLES (Safe if tables exist, but might break if code uses old name. We updated code already)
-- Try to rename pagesurl to pagesUrl if pagesurl exists and pagesUrl does NOT exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagesurl') AND
       NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagesUrl') THEN
        ALTER TABLE public.pagesurl RENAME TO "pagesUrl";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stockurl') AND
       NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stockUrl') THEN
        ALTER TABLE public.stockurl RENAME TO "stockUrl";
    END IF;
END $$;


-- 4. FIX "pagesUrl" COLUMNS (CamelCase consistency)
-- Ensure columns exist with correct casing. We can't easily "rename" columns if they conflict, so we add alias or ensure existence.
-- In Postgres, unquoted names are lowercase. Quoted are case-sensitive.
-- We want "Categoria_pai" and "sub_URLs".

DO $$
BEGIN
   -- Check if "pagesUrl" exists now
   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagesUrl') THEN
      
      -- Add Categoria_pai if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagesUrl' AND column_name = 'Categoria_pai') THEN
          -- Try to rename IF legacy column exists
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagesUrl' AND column_name = 'categoria_pai') THEN
              ALTER TABLE public."pagesUrl" RENAME COLUMN categoria_pai TO "Categoria_pai";
          ELSE
              ALTER TABLE public."pagesUrl" ADD COLUMN "Categoria_pai" text;
          END IF;
      END IF;

   END IF;
END $$;


-- 5. ENABLE RLS (Safe to re-run)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- 6. GRANT PERMISSIONS (Safe to re-run)
-- This ensures the constraints and policies from fix_permissions script are applied
DROP POLICY IF EXISTS "Enable all access for clients" ON public.clients;
CREATE POLICY "Enable all access for clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for requests" ON public.requests;
CREATE POLICY "Enable all access for requests" ON public.requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for requests_products" ON public.requests_products;
CREATE POLICY "Enable all access for requests_products" ON public.requests_products FOR ALL USING (true) WITH CHECK (true);

