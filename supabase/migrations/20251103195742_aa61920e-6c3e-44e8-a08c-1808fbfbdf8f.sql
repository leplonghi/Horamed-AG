-- Adicionar campos de tratamento à tabela items
ALTER TABLE public.items 
ADD COLUMN treatment_duration_days integer,
ADD COLUMN total_doses integer,
ADD COLUMN treatment_start_date date,
ADD COLUMN treatment_end_date date;

COMMENT ON COLUMN public.items.treatment_duration_days IS 'Duração do tratamento em dias (ex: 7, 14, 30 dias)';
COMMENT ON COLUMN public.items.total_doses IS 'Número total de doses a serem tomadas durante o tratamento';
COMMENT ON COLUMN public.items.treatment_start_date IS 'Data de início do tratamento';
COMMENT ON COLUMN public.items.treatment_end_date IS 'Data de término do tratamento (pode ser calculada automaticamente)';