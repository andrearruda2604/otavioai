-- ============================================
-- Script 5: Atualização do Schema para CRUD Completo
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Adicionar colunas para soft delete e aprovação em profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Atualizar constraint de status para incluir 'Pendente'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('Pendente', 'Ativo', 'Inativo'));

-- 3. Adicionar coluna de permissões em access_profiles
ALTER TABLE public.access_profiles 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
    "dashboard": true,
    "insights": false,
    "pipeline": false,
    "chat": false,
    "leads": false,
    "knowledge": false,
    "users": false
}'::jsonb;

-- 4. Atualizar permissões dos perfis padrão
UPDATE public.access_profiles SET permissions = '{
    "dashboard": true,
    "insights": true,
    "pipeline": true,
    "chat": true,
    "leads": true,
    "knowledge": true,
    "users": true
}'::jsonb WHERE name = 'admin';

UPDATE public.access_profiles SET permissions = '{
    "dashboard": true,
    "insights": true,
    "pipeline": true,
    "chat": true,
    "leads": true,
    "knowledge": true,
    "users": false
}'::jsonb WHERE name = 'gerente';

UPDATE public.access_profiles SET permissions = '{
    "dashboard": true,
    "insights": false,
    "pipeline": false,
    "chat": true,
    "leads": true,
    "knowledge": true,
    "users": false
}'::jsonb WHERE name = 'tecnico';

-- 5. Atualizar trigger para novos usuários ficarem pendentes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico'),
        'Pendente'  -- Novos usuários ficam pendentes até aprovação
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Políticas para soft delete
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT 
    TO authenticated 
    USING (true);  -- Permite ver todos (incluindo deletados para admin)

-- 7. Política para admins/gerentes aprovarem usuários
DROP POLICY IF EXISTS "Managers can approve users" ON public.profiles;
CREATE POLICY "Managers can approve users"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'gerente')
            AND deleted_at IS NULL
        )
    );

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx ON public.profiles(deleted_at);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles(status);
