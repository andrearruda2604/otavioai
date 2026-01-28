-- ============================================
-- Script 3: Trigger para Criar Perfil Automático
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Função que cria o perfil automaticamente ao criar usuário
-- Função que cria o perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    role_record RECORD;
BEGIN
    -- Busca o ID do papel 'usuario' (padrão)
    SELECT id INTO role_record FROM public.roles WHERE name = 'usuario' LIMIT 1;

    INSERT INTO public.profiles (id, name, email, role_id, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        role_record.id,
        'Ativo' -- Cria como ativo para facilitar teste, ou 'Pendente' se quiser aprovação
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
