-- Create primary profiles for existing users who don't have one
INSERT INTO public.user_profiles (user_id, name, relationship, is_primary)
SELECT 
  u.id as user_id,
  COALESCE(
    p.full_name,
    p.nickname,
    u.email,
    'Usuário'
  ) as name,
  'self' as relationship,
  true as is_primary
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up 
  WHERE up.user_id = u.id AND up.is_primary = true
);