-- Add Row-Level Security policies to storage.objects for defense-in-depth
-- Drop existing policies first if they exist

-- Drop existing policies for cofre-saude bucket
DROP POLICY IF EXISTS "Users access own health documents" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own health documents" ON storage.objects;
DROP POLICY IF EXISTS "Users update own health documents" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own health documents" ON storage.objects;

-- Drop existing policies for avatars bucket
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatars" ON storage.objects;

-- Drop existing policies for medical-exams bucket
DROP POLICY IF EXISTS "Users access own medical exams" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own medical exams" ON storage.objects;
DROP POLICY IF EXISTS "Users update own medical exams" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own medical exams" ON storage.objects;

-- Create policies for cofre-saude bucket (health documents)
CREATE POLICY "Users access own health documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cofre-saude' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users upload own health documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cofre-saude' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update own health documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cofre-saude' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own health documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cofre-saude' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policies for avatars bucket (public read, authenticated write)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policies for medical-exams bucket
CREATE POLICY "Users access own medical exams"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-exams' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users upload own medical exams"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-exams' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update own medical exams"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-exams' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own medical exams"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-exams' AND
  (storage.foldername(name))[1] = auth.uid()::text
);