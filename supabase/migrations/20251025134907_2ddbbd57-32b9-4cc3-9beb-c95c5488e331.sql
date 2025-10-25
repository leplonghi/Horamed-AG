-- Criar tabela de feature flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy: todos podem ler feature flags (são globais)
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags
  FOR SELECT
  USING (true);

-- Inserir flags padrão (TODAS DESABILITADAS)
INSERT INTO public.feature_flags (key, enabled, config) VALUES
  ('badges', false, '{"description": "Gamificação complexa com badges Bronze/Prata/Ouro/Diamante"}'),
  ('emergency', false, '{"description": "Modo emergência guiada e ajuste de dose"}'),
  ('prices', false, '{"description": "Pesquisa de preços em farmácias"}'),
  ('advancedDash', false, '{"description": "Dashboards e gráficos avançados"}'),
  ('interactions', false, '{"description": "Análise de interações medicamentosas"}'),
  ('aiStreaming', false, '{"description": "Streaming token-by-token de IA"}')
ON CONFLICT (key) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();