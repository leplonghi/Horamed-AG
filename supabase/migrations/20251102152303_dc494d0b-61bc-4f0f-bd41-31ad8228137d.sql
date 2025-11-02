-- Criar tabela de compartilhamento médico
CREATE TABLE IF NOT EXISTS public.medical_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Usuários gerenciam seus compartilhamentos"
  ON public.medical_shares
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_medical_shares_token ON public.medical_shares(token);
CREATE INDEX IF NOT EXISTS idx_medical_shares_user ON public.medical_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_shares_expires ON public.medical_shares(expires_at);