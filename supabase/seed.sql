-- Seed de desenvolvimento local
-- Cria usuário admin com todos os campos obrigatórios do Supabase Auth

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user,
  is_anonymous,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  phone_change_token,
  reauthentication_token,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'michel.bottan@gmail.com',
  crypt('devpassword123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  false,
  false,
  '',
  '',
  '',
  '',
  '',
  '',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Identity necessária para autenticação por email funcionar
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'michel.bottan@gmail.com',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"michel.bottan@gmail.com","email_verified":true,"provider":"email"}',
  'email',
  now(),
  now(),
  now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- Marca como admin
INSERT INTO public.admins (user_id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Acesso bundle para dev (testa o EAD sem precisar comprar)
INSERT INTO public.user_products (user_id, product)
VALUES ('00000000-0000-0000-0000-000000000001', 'bundle')
ON CONFLICT DO NOTHING;
