-- ============================================
-- Script 6: Tabela de Roles (Perfis de Acesso)
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Tabela de roles (define os perfis de acesso)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,       -- 'admin', 'gerente', 'tecnico'
    description TEXT,
    is_system BOOLEAN DEFAULT false, -- Perfis do sistema não podem ser deletados
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir roles padrão
INSERT INTO public.roles (name, description, is_system) VALUES
    ('admin', 'Administrador do sistema - acesso total', true),
    ('gerente', 'Gerente de equipe - acesso intermediário', true),
    ('tecnico', 'Técnico de campo - acesso básico', true)
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura (todos podem ler)
DROP POLICY IF EXISTS "Anyone can read roles" ON public.roles;
CREATE POLICY "Anyone can read roles"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

-- Apenas admins podem gerenciar roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "Admins can manage roles"
    ON public.roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );
