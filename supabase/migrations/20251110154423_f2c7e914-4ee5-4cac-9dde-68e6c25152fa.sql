-- Adicionar campos de extração automática à tabela documentos_saude
ALTER TABLE documentos_saude 
ADD COLUMN IF NOT EXISTS status_extraction TEXT DEFAULT 'pending_review' 
  CHECK (status_extraction IN ('pending_review', 'confirmed', 'failed', 'not_extracted')),
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extraction_attempted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extraction_error TEXT;

-- Índice para buscar documentos pendentes de revisão
CREATE INDEX IF NOT EXISTS idx_documentos_status_extraction 
ON documentos_saude(user_id, status_extraction) 
WHERE status_extraction = 'pending_review';

-- Índice para documentos vencendo
CREATE INDEX IF NOT EXISTS idx_documentos_expiring 
ON documentos_saude(user_id, expires_at) 
WHERE expires_at IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN documentos_saude.status_extraction IS 'Status da extração: pending_review (precisa revisar), confirmed (confirmado), failed (falhou), not_extracted (não foi extraído)';
COMMENT ON COLUMN documentos_saude.confidence_score IS 'Score de confiança da extração (0.0 a 1.0)';
COMMENT ON COLUMN documentos_saude.reviewed_at IS 'Data em que o usuário revisou/confirmou os dados extraídos';
COMMENT ON COLUMN documentos_saude.extraction_attempted_at IS 'Data da última tentativa de extração';