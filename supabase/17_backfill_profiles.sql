-- SCRIPT TO BACKFILL PROFILES
-- Run this if 'public.profiles' is empty but you have users in 'Authentication'.

DO $$
DECLARE
    usuario_role_id uuid;
    admin_role_id uuid;
BEGIN
    -- 1. Get Role IDs
    SELECT id INTO usuario_role_id FROM public.roles WHERE name = 'usuario' LIMIT 1;
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin' LIMIT 1;

    -- 2. Insert Profiles for ALL existing users
    INSERT INTO public.profiles (id, name, email, role_id, status, created_at)
    SELECT 
        au.id,
        COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
        au.email,
        CASE 
            WHEN au.email ILIKE '%admin%' THEN admin_role_id -- Auto-assign admin if email contains 'admin'
            ELSE usuario_role_id 
        END,
        'Ativo',
        au.created_at
    FROM auth.users au
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id);

    -- 3. Validation Output
    RAISE NOTICE 'Profiles backfilled successfully.';
END $$;
