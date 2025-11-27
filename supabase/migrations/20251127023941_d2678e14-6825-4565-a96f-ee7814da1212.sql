-- Garantir que referral_code existe e tem um trigger para gerar automaticamente
-- Se já existir, não faz nada

-- Função para gerar código de referral único
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código no formato HR-XXXXXX
    new_code := 'HR-' || upper(substring(md5(random()::text) from 1 for 6));
    
    -- Verificar se código já existe
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE referral_code = new_code
    ) INTO code_exists;
    
    -- Se não existe, retornar
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Trigger para gerar referral_code automaticamente quando profile é criado
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se referral_code não foi definido, gerar um
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger se já existir e recriar
DROP TRIGGER IF EXISTS ensure_referral_code ON profiles;
CREATE TRIGGER ensure_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

-- Atualizar profiles existentes que não têm referral_code
UPDATE profiles 
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;