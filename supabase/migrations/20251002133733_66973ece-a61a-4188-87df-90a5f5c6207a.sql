-- Add category to items
ALTER TABLE public.items 
ADD COLUMN category TEXT DEFAULT 'medicamento' CHECK (category IN ('medicamento', 'suplemento', 'vitamina', 'pet'));

-- Add notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_number TEXT,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for notification_preferences
CREATE POLICY "Users can view own notification preferences" 
ON public.notification_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" 
ON public.notification_preferences FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" 
ON public.notification_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update items RLS policies to use auth
DROP POLICY IF EXISTS "Enable all access for items" ON public.items;
CREATE POLICY "Users can view own items" ON public.items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON public.items FOR DELETE USING (auth.uid() = user_id);

-- Update schedules RLS to use auth through items
DROP POLICY IF EXISTS "Enable all access for schedules" ON public.schedules;
CREATE POLICY "Users can view own schedules" ON public.schedules FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = schedules.item_id AND items.user_id = auth.uid()));

CREATE POLICY "Users can insert own schedules" ON public.schedules FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.items WHERE items.id = schedules.item_id AND items.user_id = auth.uid()));

CREATE POLICY "Users can update own schedules" ON public.schedules FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = schedules.item_id AND items.user_id = auth.uid()));

CREATE POLICY "Users can delete own schedules" ON public.schedules FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = schedules.item_id AND items.user_id = auth.uid()));

-- Update dose_instances RLS to use auth through items
DROP POLICY IF EXISTS "Enable all access for dose_instances" ON public.dose_instances;
CREATE POLICY "Users can view own dose_instances" ON public.dose_instances FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = dose_instances.item_id AND items.user_id = auth.uid()));

CREATE POLICY "Users can insert own dose_instances" ON public.dose_instances FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.items WHERE items.id = dose_instances.item_id AND items.user_id = auth.uid()));

CREATE POLICY "Users can update own dose_instances" ON public.dose_instances FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = dose_instances.item_id AND items.user_id = auth.uid()));

CREATE POLICY "Users can delete own dose_instances" ON public.dose_instances FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = dose_instances.item_id AND items.user_id = auth.uid()));

-- Update stock RLS to use auth through items
DROP POLICY IF EXISTS "Enable all access for stock" ON public.stock;
CREATE POLICY "Users can view own stock" ON public.stock FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = stock.item_id AND items.user_id = auth.uid()));

CREATE POLICY "Users can insert own stock" ON public.stock FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.items WHERE items.id = stock.item_id AND items.user_id = auth.uid()));

CREATE POLICY "Users can update own stock" ON public.stock FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = stock.item_id AND items.user_id = auth.uid()));

CREATE POLICY "Users can delete own stock" ON public.stock FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.items WHERE items.id = stock.item_id AND items.user_id = auth.uid()));

-- Trigger for notification_preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();