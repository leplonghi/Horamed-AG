-- Create table for extraction cache
CREATE TABLE IF NOT EXISTS public.extraction_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_hash TEXT NOT NULL,
  extraction_type TEXT NOT NULL CHECK (extraction_type IN ('medication', 'document', 'exam')),
  extracted_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, image_hash, extraction_type)
);

-- Enable RLS
ALTER TABLE public.extraction_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for extraction_cache
CREATE POLICY "Users can view their own extraction cache"
ON public.extraction_cache
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extraction cache"
ON public.extraction_cache
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_extraction_cache_lookup ON public.extraction_cache(user_id, image_hash, extraction_type);

-- Create index for cleanup of old entries
CREATE INDEX idx_extraction_cache_created_at ON public.extraction_cache(created_at);