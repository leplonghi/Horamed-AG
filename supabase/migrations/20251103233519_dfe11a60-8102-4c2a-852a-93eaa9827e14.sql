-- Create trigger to create primary user profile when user signs up
CREATE OR REPLACE FUNCTION public.create_primary_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create primary profile for new user
  INSERT INTO public.user_profiles (
    user_id,
    name,
    relationship,
    is_primary
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuário'),
    'self',
    true
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created_profile'
  ) THEN
    CREATE TRIGGER on_auth_user_created_profile
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.create_primary_user_profile();
  END IF;
END
$$;