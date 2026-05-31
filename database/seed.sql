-- Seed Script for BlueCarbon-Registry test accounts
-- Execute this script in the Supabase SQL Editor.
-- All accounts will be created with the password: password123

-- Note: The trigger "on_auth_user_created" will automatically sync these entries into your "public.users" table.

-- Clear existing sample records to prevent collision if re-running
DELETE FROM auth.users WHERE email IN (
  'ngo@bluecarbon-registry.org',
  'community@bluecarbon-registry.org',
  'auditor@bluecarbon-registry.org',
  'admin@bluecarbon-registry.org'
);

-- Insert into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES
  -- 1. NGO Node
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'ngo@bluecarbon-registry.org',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Sundarbans NGO","role":"ngo"}',
    now(),
    now()
  ),
  -- 2. Community Node
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'community@bluecarbon-registry.org',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Coastal Panchayat","role":"community"}',
    now(),
    now()
  ),
  -- 3. Auditor Node
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'auditor@bluecarbon-registry.org',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Green MRV Auditor","role":"auditor"}',
    now(),
    now()
  ),
  -- 4. Admin Node
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'admin@bluecarbon-registry.org',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"BlueCarbon-Registry Admin","role":"admin"}',
    now(),
    now()
  );
