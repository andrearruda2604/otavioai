-- ============================================
-- Script 21: Conceder Admin para deco260483@gmail.com
-- ============================================

DO $$
DECLARE
    v_user_id UUID := '114b479f-db3d-43db-99f3-d5ae240a1cb2';
    v_email TEXT := 'deco260483@gmail.com';
    v_admin_role_id UUID;
BEGIN
    -- 1. Buscar o ID da role 'admin'
    SELECT id INTO v_admin_role_id
    FROM public.roles
    WHERE name = 'admin';

    IF v_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role admin não encontrada!';
    END IF;

    -- 2. Garantir que o perfil existe (Upsert)
    -- Caso o perfil não exista (erro PGRST116), nós o criamos aqui
    INSERT INTO public.profiles (id, email, role_id, status, name)
    VALUES (
        v_user_id,
        v_email,
        v_admin_role_id,
        'Ativo',
        'Administrador (Deco)'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        role_id = v_admin_role_id,
        status = 'Ativo',
        email = CASE WHEN public.profiles.email IS NULL THEN EXCLUDED.email ELSE public.profiles.email END;

    RAISE NOTICE 'Usuário % atualizado para Admin com sucesso.', v_email;
END $$;
