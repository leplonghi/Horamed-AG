-- Atualizar constraint para incluir 'missed'
ALTER TABLE public.dose_instances 
DROP CONSTRAINT IF EXISTS dose_instances_status_check;

ALTER TABLE public.dose_instances 
ADD CONSTRAINT dose_instances_status_check 
CHECK (status = ANY (ARRAY['scheduled'::text, 'taken'::text, 'missed'::text, 'skipped'::text]));