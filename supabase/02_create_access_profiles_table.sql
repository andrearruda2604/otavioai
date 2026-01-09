-- ============================================
-- Script 2: Tabela de Perfis de Acesso
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Tabela de definições de perfis de acesso
CREATE TABLE IF NOT EXISTS public.access_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    permissions_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir perfis padrão (se não existirem)
INSERT INTO public.access_profiles (name, description, is_system, permissions_count) VALUES
    ('admin', 'Administrador do sistema - acesso total', true, 11),
    ('tecnico', 'Técnico de campo - acesso básico', true, 6),
    ('gerente', 'Gerente de equipe - acesso intermediário', true, 8)
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.access_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Access profiles are viewable by authenticated" ON public.access_profiles;
CREATE POLICY "Access profiles are viewable by authenticated"
    ON public.access_profiles FOR SELECT 
    TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "Admins can manage access profiles" ON public.access_profiles;
CREATE POLICY "Admins can manage access profiles"
    ON public.access_profiles FOR ALL 
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
