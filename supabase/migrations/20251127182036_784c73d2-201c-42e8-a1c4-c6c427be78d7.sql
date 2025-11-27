-- Configurar contas de teste com planos específicos

-- Configurar conta free@horamed.com como FREE
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'free@horamed.com'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Deletar subscription existente se houver
    DELETE FROM public.subscriptions WHERE user_id = v_user_id;
    
    -- Inserir subscription FREE
    INSERT INTO public.subscriptions (
      user_id,
      plan_type,
      status,
      started_at,
      expires_at,
      trial_ends_at,
      trial_used
    ) VALUES (
      v_user_id,
      'free',
      'active',
      now(),
      now() + interval '30 days',
      now() + interval '7 days',
      false
    );
  END IF;
END $$;

-- Configurar conta premium@horamed.com como PREMIUM
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'premium@horamed.com'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Deletar subscription existente se houver
    DELETE FROM public.subscriptions WHERE user_id = v_user_id;
    
    -- Inserir subscription PREMIUM
    INSERT INTO public.subscriptions (
      user_id,
      plan_type,
      status,
      started_at,
      expires_at,
      stripe_customer_id,
      stripe_subscription_id
    ) VALUES (
      v_user_id,
      'premium',
      'active',
      now(),
      now() + interval '1 year',
      'test_customer_premium',
      'test_sub_premium'
    );
  END IF;
END $$;