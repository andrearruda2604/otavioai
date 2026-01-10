-- ============================================
-- Script 7: Tabela de Role Permissions (RBAC)
-- Execute este script no SQL Editor do Supabase
-- IMPORTANTE: Execute APÓS 06_create_roles_table.sql
-- ============================================

-- Tabela de permissões por role
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    route_key TEXT NOT NULL,  -- 'dashboard', 'insights', 'users', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, route_key)
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS role_permissions_role_id_idx ON public.role_permissions(role_id);

-- Habilitar RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura (todos podem ler)
DROP POLICY IF EXISTS "Anyone can read role_permissions" ON public.role_permissions;
CREATE POLICY "Anyone can read role_permissions"
    ON public.role_permissions FOR SELECT
    TO authenticated
    USING (true);

-- Apenas admins podem gerenciar permissões
DROP POLICY IF EXISTS "Admins can manage role_permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role_permissions"
    ON public.role_permissions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- ============================================
-- Inserir permissões padrão para cada role
-- ============================================

-- Admin: todas as permissões
INSERT INTO public.role_permissions (role_id, route_key)
SELECT r.id, perm
FROM public.roles r,
     UNNEST(ARRAY[
         'dashboard', 'insights', 'pipeline', 'chat', 'leads', 'knowledge', 'users'
     ]) AS perm
WHERE r.name = 'admin'
ON CONFLICT (role_id, route_key) DO NOTHING;

-- Gerente: quase todas (exceto users)
INSERT INTO public.role_permissions (role_id, route_key)
SELECT r.id, perm
FROM public.roles r,
     UNNEST(ARRAY[
         'dashboard', 'insights', 'pipeline', 'chat', 'leads', 'knowledge'
     ]) AS perm
WHERE r.name = 'gerente'
ON CONFLICT (role_id, route_key) DO NOTHING;

-- Técnico: acesso básico
INSERT INTO public.role_permissions (role_id, route_key)
SELECT r.id, perm
FROM public.roles r,
     UNNEST(ARRAY[
         'dashboard', 'chat', 'leads', 'knowledge'
     ]) AS perm
WHERE r.name = 'tecnico'
ON CONFLICT (role_id, route_key) DO NOTHING;
