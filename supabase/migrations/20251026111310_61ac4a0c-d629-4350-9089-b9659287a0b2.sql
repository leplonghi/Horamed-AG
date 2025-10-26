-- Criar tabela de auditoria de acessos (LGPD)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS para audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus próprios logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Apenas sistema pode inserir logs (via service role)
CREATE POLICY "Sistema pode inserir logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (false); -- Usuários normais não podem inserir

-- Criar tipo ENUM para finalidades de consentimento
CREATE TYPE public.consent_purpose AS ENUM (
  'health_data',
  'notifications', 
  'data_sharing',
  'marketing',
  'analytics'
);

-- Criar tabela de consentimentos (LGPD)
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose consent_purpose NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, purpose)
);

-- Índices
CREATE INDEX idx_consents_user_id ON public.consents(user_id);
CREATE INDEX idx_consents_purpose ON public.consents(purpose);

-- RLS para consents
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam seus consentimentos"
ON public.consents
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at em consents
CREATE TRIGGER update_consents_updated_at
BEFORE UPDATE ON public.consents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campos de trial na tabela subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price_variant TEXT DEFAULT 'A' CHECK (price_variant IN ('A', 'B', 'C')),
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;

-- Atualizar trigger para subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função auxiliar para verificar se usuário está no trial
CREATE OR REPLACE FUNCTION public.is_on_trial(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND trial_ends_at > now()
      AND status = 'active'
      AND trial_used = true
  );
$$;

-- Função auxiliar para verificar consentimento
CREATE OR REPLACE FUNCTION public.has_consent(p_user_id UUID, p_purpose consent_purpose)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.consents
    WHERE user_id = p_user_id
      AND purpose = p_purpose
      AND granted = true
      AND revoked_at IS NULL
  );
$$;