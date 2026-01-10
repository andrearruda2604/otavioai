-- ============================================
-- Script 8: Migração de profiles.role para role_id
-- Execute este script no SQL Editor do Supabase
-- IMPORTANTE: Execute APÓS 06 e 07
-- ============================================

-- 1. Adicionar coluna role_id
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- 2. Migrar dados existentes (role TEXT -> role_id UUID)
UPDATE public.profiles p
SET role_id = r.id
FROM public.roles r
WHERE p.role = r.name AND p.role_id IS NULL;

-- 3. Para profiles sem role_id, definir como 'tecnico'
UPDATE public.profiles p
SET role_id = (SELECT id FROM public.roles WHERE name = 'tecnico')
WHERE p.role_id IS NULL;

-- 4. Adicionar coluna email em profiles (para facilitar consultas)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- 5. Atualizar trigger para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Buscar o role_id do técnico (padrão para novos usuários)
    SELECT id INTO default_role_id FROM public.roles WHERE name = 'tecnico';
    
    INSERT INTO public.profiles (id, name, email, role_id, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(
            (SELECT id FROM public.roles WHERE name = COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico')),
            default_role_id
        ),
        'Pendente'  -- Novos usuários ficam pendentes até aprovação
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Atualizar política de update para usar role_id
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.name = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.name = 'admin'
        )
    );

-- 7. Política para gerentes/admins aprovarem usuários
DROP POLICY IF EXISTS "Managers can approve users" ON public.profiles;
CREATE POLICY "Managers can approve users"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'gerente')
            AND p.deleted_at IS NULL
        )
    );
