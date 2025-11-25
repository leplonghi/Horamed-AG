-- Add tracking fields to stock table
ALTER TABLE public.stock 
ADD COLUMN IF NOT EXISTS created_from_prescription_id uuid REFERENCES public.documentos_saude(id),
ADD COLUMN IF NOT EXISTS last_refill_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS consumption_history jsonb DEFAULT '[]'::jsonb;

-- Add comment explaining consumption_history structure
COMMENT ON COLUMN public.stock.consumption_history IS 'Array of {date: ISO string, amount: number, reason: "taken"|"adjusted"|"refill"|"lost"}';

-- Update projected_end_at calculation to be more accurate
CREATE OR REPLACE FUNCTION calculate_projected_end_at(
  p_stock_id uuid
) RETURNS timestamp with time zone AS $$
DECLARE
  v_units_left numeric;
  v_item_id uuid;
  v_daily_consumption numeric;
  v_days_remaining numeric;
BEGIN
  -- Get current stock info
  SELECT units_left, item_id INTO v_units_left, v_item_id
  FROM stock WHERE id = p_stock_id;
  
  IF v_units_left <= 0 THEN
    RETURN now();
  END IF;
  
  -- Calculate daily consumption based on last 7 days of doses
  SELECT COALESCE(
    COUNT(*)::numeric / 7.0, 
    0
  ) INTO v_daily_consumption
  FROM dose_instances
  WHERE item_id = v_item_id
    AND status = 'taken'
    AND taken_at >= now() - interval '7 days';
  
  -- If no consumption history, estimate based on schedules
  IF v_daily_consumption = 0 THEN
    SELECT COALESCE(
      SUM(array_length(times::text[], 1)),
      1
    ) INTO v_daily_consumption
    FROM schedules
    WHERE item_id = v_item_id
      AND is_active = true;
  END IF;
  
  -- Calculate days remaining
  v_days_remaining := v_units_left / NULLIF(v_daily_consumption, 0);
  
  IF v_days_remaining IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN now() + (v_days_remaining || ' days')::interval;
END;
$$ LANGUAGE plpgsql;