-- Adicionar tabela de consultas médicas
CREATE TABLE IF NOT EXISTS public.consultas_medicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  especialidade TEXT,
  medico_nome TEXT,
  local TEXT,
  data_consulta TIMESTAMP WITH TIME ZONE NOT NULL,
  motivo TEXT,
  observacoes TEXT,
  documento_id UUID REFERENCES public.documentos_saude(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultas_medicas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Usuários gerenciam suas consultas"
  ON public.consultas_medicas
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Adicionar tabela de exames laboratoriais com valores
CREATE TABLE IF NOT EXISTS public.exames_laboratoriais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  documento_id UUID REFERENCES public.documentos_saude(id) ON DELETE SET NULL,
  data_exame DATE NOT NULL,
  laboratorio TEXT,
  medico_solicitante TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exames_laboratoriais ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Usuários gerenciam seus exames"
  ON public.exames_laboratoriais
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Adicionar tabela de valores de exames
CREATE TABLE IF NOT EXISTS public.valores_exames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exame_id UUID NOT NULL REFERENCES public.exames_laboratoriais(id) ON DELETE CASCADE,
  parametro TEXT NOT NULL,
  valor NUMERIC,
  valor_texto TEXT,
  unidade TEXT,
  referencia_min NUMERIC,
  referencia_max NUMERIC,
  referencia_texto TEXT,
  status TEXT CHECK (status IN ('normal', 'alterado', 'critico')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.valores_exames ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Usuários veem valores de seus exames"
  ON public.valores_exames
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exames_laboratoriais
    WHERE exames_laboratoriais.id = valores_exames.exame_id
    AND exames_laboratoriais.user_id = auth.uid()
  ));

CREATE POLICY "Usuários inserem valores em seus exames"
  ON public.valores_exames
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exames_laboratoriais
    WHERE exames_laboratoriais.id = valores_exames.exame_id
    AND exames_laboratoriais.user_id = auth.uid()
  ));

CREATE POLICY "Usuários atualizam valores de seus exames"
  ON public.valores_exames
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.exames_laboratoriais
    WHERE exames_laboratoriais.id = valores_exames.exame_id
    AND exames_laboratoriais.user_id = auth.uid()
  ));

CREATE POLICY "Usuários deletam valores de seus exames"
  ON public.valores_exames
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.exames_laboratoriais
    WHERE exames_laboratoriais.id = valores_exames.exame_id
    AND exames_laboratoriais.user_id = auth.uid()
  ));

-- Adicionar tabela de sinais vitais
CREATE TABLE IF NOT EXISTS public.sinais_vitais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  data_medicao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pressao_sistolica INTEGER,
  pressao_diastolica INTEGER,
  frequencia_cardiaca INTEGER,
  temperatura NUMERIC(4,1),
  glicemia INTEGER,
  saturacao_oxigenio INTEGER,
  peso_kg NUMERIC(5,2),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sinais_vitais ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Usuários gerenciam seus sinais vitais"
  ON public.sinais_vitais
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_consultas_data ON public.consultas_medicas(data_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_consultas_user ON public.consultas_medicas(user_id);
CREATE INDEX IF NOT EXISTS idx_exames_data ON public.exames_laboratoriais(data_exame DESC);
CREATE INDEX IF NOT EXISTS idx_exames_user ON public.exames_laboratoriais(user_id);
CREATE INDEX IF NOT EXISTS idx_valores_exame ON public.valores_exames(exame_id);
CREATE INDEX IF NOT EXISTS idx_sinais_data ON public.sinais_vitais(data_medicao DESC);
CREATE INDEX IF NOT EXISTS idx_sinais_user ON public.sinais_vitais(user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_consultas_updated_at
  BEFORE UPDATE ON public.consultas_medicas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exames_updated_at
  BEFORE UPDATE ON public.exames_laboratoriais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();