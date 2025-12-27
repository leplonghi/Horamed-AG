-- Add notification preference per medication
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS notification_type text DEFAULT 'push';

-- Add comment explaining the options
COMMENT ON COLUMN public.items.notification_type IS 'Notification type: silent (no notification), push (push only), alarm (full alarm sound)';