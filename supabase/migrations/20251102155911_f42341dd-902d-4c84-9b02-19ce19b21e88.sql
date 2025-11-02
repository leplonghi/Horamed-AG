-- Criar tabela para logs de notificações
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dose_id UUID REFERENCES dose_instances(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'scheduled',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_dose_id ON public.notification_logs(dose_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_scheduled_at ON public.notification_logs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_delivery_status ON public.notification_logs(delivery_status);

-- Habilitar RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem suas próprias notificações
CREATE POLICY "Usuários veem suas notificações"
  ON public.notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para o sistema inserir notificações
CREATE POLICY "Sistema insere notificações"
  ON public.notification_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para o sistema atualizar status de entrega
CREATE POLICY "Sistema atualiza notificações"
  ON public.notification_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Comentários descritivos
COMMENT ON TABLE public.notification_logs IS 'Registro de todas as notificações agendadas e enviadas';
COMMENT ON COLUMN public.notification_logs.delivery_status IS 'Status: scheduled, sent, failed, cancelled';
COMMENT ON COLUMN public.notification_logs.metadata IS 'Dados adicionais sobre a notificação';