-- ============================================
-- Script 4: Criar Usuário Admin Inicial
-- Execute este script APÓS criar o usuário pelo Supabase Auth
-- ============================================

-- IMPORTANTE: Primeiro crie o usuário admin via:
-- 1. Supabase Dashboard > Authentication > Users > Add User
-- 2. Ou via sign up na aplicação

-- Depois, atualize o perfil para admin:
UPDATE public.profiles 
SET role = 'admin', name = 'Administrador'
WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = 'admin@otavio.ai'  -- Altere para o email do admin
    LIMIT 1
);

-- Verificar se foi atualizado
SELECT p.*, u.email 
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
