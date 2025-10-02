-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  weight_kg NUMERIC,
  height_cm NUMERIC,
  birth_date DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create medical_exams table
CREATE TABLE public.medical_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extracted_data JSONB,
  exam_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_exams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_exams
CREATE POLICY "Users can view own medical exams"
  ON public.medical_exams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical exams"
  ON public.medical_exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical exams"
  ON public.medical_exams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical exams"
  ON public.medical_exams FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for medical exams
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-exams', 'medical-exams', false);

-- Storage policies for medical exams
CREATE POLICY "Users can upload own medical exams"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-exams' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own medical exams"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-exams' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own medical exams"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical-exams' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Trigger for updating updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_exams_updated_at
  BEFORE UPDATE ON public.medical_exams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();