-- Módulo Cofre de Saúde: Tabelas, Índices, RLS e Storage

-- 1. Criar enum para tipos de eventos
CREATE TYPE public.health_event_type AS ENUM ('checkup', 'reforco_vacina', 'renovacao_exame', 'consulta');

-- 2. Tabela de categorias de documentos de saúde
CREATE TABLE public.categorias_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seeds de categorias
INSERT INTO public.categorias_saude (slug, label) VALUES
  ('exame', 'Exames'),
  ('receita', 'Receitas'),
  ('vacinacao', 'Vacinação'),
  ('consulta', 'Consultas'),
  ('outro', 'Outros');

-- 3. Tabela principal de documentos de saúde
CREATE TABLE public.documentos_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.categorias_saude(id) ON DELETE SET NULL,
  title TEXT,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  issued_at DATE,
  expires_at DATE,
  provider TEXT,
  notes TEXT,
  ocr_text TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_documentos_saude_user_profile_cat ON public.documentos_saude(user_id, profile_id, categoria_id);
CREATE INDEX idx_documentos_saude_expires ON public.documentos_saude(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_documentos_saude_fts ON public.documentos_saude USING GIN(to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(ocr_text, '')));

-- 4. Tabela de compartilhamentos
CREATE TABLE public.compartilhamentos_doc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documentos_saude(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  allow_download BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_compartilhamentos_token ON public.compartilhamentos_doc(token);

-- 5. Tabela de eventos de saúde (lembretes)
CREATE TABLE public.eventos_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  type public.health_event_type NOT NULL,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  related_document_id UUID REFERENCES public.documentos_saude(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_eventos_saude_user_date ON public.eventos_saude(user_id, due_date, type, completed_at);

-- 6. Trigger para atualizar updated_at em documentos_saude
CREATE TRIGGER update_documentos_saude_updated_at
  BEFORE UPDATE ON public.documentos_saude
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. View de compatibilidade com medical_exams
CREATE OR REPLACE VIEW public.medical_exams_v AS
SELECT 
  d.id,
  d.user_id,
  d.file_path as file_url,
  d.title as file_name,
  d.issued_at as exam_date,
  d.ocr_text as extracted_data,
  d.notes,
  d.created_at,
  d.updated_at
FROM public.documentos_saude d
JOIN public.categorias_saude c ON d.categoria_id = c.id
WHERE c.slug = 'exame';

-- 8. Row Level Security (RLS)

-- Categorias de saúde (públicas para leitura)
ALTER TABLE public.categorias_saude ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver categorias" ON public.categorias_saude
  FOR SELECT USING (true);

-- Documentos de saúde (owner-only)
ALTER TABLE public.documentos_saude ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus documentos" ON public.documentos_saude
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam seus documentos" ON public.documentos_saude
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam seus documentos" ON public.documentos_saude
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam seus documentos" ON public.documentos_saude
  FOR DELETE USING (auth.uid() = user_id);

-- Compartilhamentos (owner-only)
ALTER TABLE public.compartilhamentos_doc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus compartilhamentos" ON public.compartilhamentos_doc
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam seus compartilhamentos" ON public.compartilhamentos_doc
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam seus compartilhamentos" ON public.compartilhamentos_doc
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam seus compartilhamentos" ON public.compartilhamentos_doc
  FOR DELETE USING (auth.uid() = user_id);

-- Eventos de saúde (owner-only)
ALTER TABLE public.eventos_saude ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus eventos" ON public.eventos_saude
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam seus eventos" ON public.eventos_saude
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam seus eventos" ON public.eventos_saude
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam seus eventos" ON public.eventos_saude
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Storage Bucket para Cofre de Saúde
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cofre-saude',
  'cofre-saude',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
);

-- RLS para storage do cofre-saude
CREATE POLICY "Usuários podem fazer upload de seus documentos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cofre-saude' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem ver seus documentos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cofre-saude' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem atualizar seus documentos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'cofre-saude' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem deletar seus documentos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'cofre-saude' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );