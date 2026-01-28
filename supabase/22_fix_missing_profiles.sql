-- ============================================
-- Script 22: Corrigir Perfis Faltantes (Erro PGRST116)
-- ============================================

DO $$
DECLARE
    v_usuario_role_id uuid;
    v_admin_role_id uuid;
BEGIN
    -- 1. Buscar IDs das roles
    SELECT id INTO v_usuario_role_id FROM public.roles WHERE name = 'usuario' LIMIT 1; -- Fallback role
    SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'admin' LIMIT 1;
    
    -- Se não encontrar role 'usuario', tenta usar 'admin' ou qualquer uma disponivel para não quebrar
    IF v_usuario_role_id IS NULL THEN
         SELECT id INTO v_usuario_role_id FROM public.roles LIMIT 1;
    END IF;

    -- 2. Inserir Profiles para usuários da Auth que NÃO estão em Profiles
    INSERT INTO public.profiles (id, name, email, role_id, status, created_at)
    SELECT 
        au.id,
        COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
        au.email,
        CASE 
            WHEN au.email ILIKE '%andre.lsarruda%' THEN v_admin_role_id -- Opcional: Já garante admin para o Andre se quiser
            WHEN au.email ILIKE '%admin%' THEN v_admin_role_id 
            ELSE v_usuario_role_id 
        END,
        'Ativo',
        au.created_at
    FROM auth.users au
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id);

    RAISE NOTICE 'Perfis corrigidos com sucesso!';
END $$;
