-- Seed Script for BlueCarbon-Registry test accounts
-- Execute this script in the Supabase SQL Editor.
-- All accounts will be created with the password: password123

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clear existing sample records to prevent collision if re-running
DELETE FROM auth.identities WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

DELETE FROM public.users WHERE email IN (
  'ngo@bluecarbon-registry.org',
  'community@bluecarbon-registry.org',
  'auditor@bluecarbon-registry.org',
  'admin@bluecarbon-registry.org'
);

DELETE FROM auth.users WHERE email IN (
  'ngo@bluecarbon-registry.org',
  'community@bluecarbon-registry.org',
  'auditor@bluecarbon-registry.org',
  'admin@bluecarbon-registry.org'
);

-- Insert into auth.users with all GoTrue scanner mandatory text columns initialized to '' instead of NULL
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
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  is_super_admin,
  is_sso_user
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
    '{"name":"Sundarbans NGO","role":"ngo","organization_name":"Sundarbans Conservation Society","contact_number":"+91-9876543210","location":"Sundarbans Delta","is_approved":true}',
    now(),
    now(),
    '', '', '', '', '', '', '', '',
    false,
    false
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
    '{"name":"Coastal Panchayat","role":"community","organization_name":"Kundapura Coastal Council","contact_number":"+91-9876543211","location":"Kundapura Coast","is_approved":true}',
    now(),
    now(),
    '', '', '', '', '', '', '', '',
    false,
    false
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
    '{"name":"Green MRV Auditor","role":"auditor","is_approved":true}',
    now(),
    now(),
    '', '', '', '', '', '', '', '',
    false,
    false
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
    '{"name":"BlueCarbon-Registry Admin","role":"admin","is_approved":true}',
    now(),
    now(),
    '', '', '', '', '', '', '', '',
    false,
    false
  );

-- Insert into auth.identities (vital to link with auth.users for GoTrue login)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub": "11111111-1111-1111-1111-111111111111", "email": "ngo@bluecarbon-registry.org"}',
    'email',
    '11111111-1111-1111-1111-111111111111',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub": "22222222-2222-2222-2222-222222222222", "email": "community@bluecarbon-registry.org"}',
    'email',
    '22222222-2222-2222-2222-222222222222',
    now(),
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '{"sub": "33333333-3333-3333-3333-333333333333", "email": "auditor@bluecarbon-registry.org"}',
    'email',
    '33333333-3333-3333-3333-333333333333',
    now(),
    now(),
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    '{"sub": "44444444-4444-4444-4444-444444444444", "email": "admin@bluecarbon-registry.org"}',
    'email',
    '44444444-4444-4444-4444-444444444444',
    now(),
    now(),
    now()
  );

-- Explicit insert into public.users (with is_approved = true) to bypass trigger delay or failure
INSERT INTO public.users (id, name, email, role, organization_name, contact_number, location, is_approved, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sundarbans NGO', 'ngo@bluecarbon-registry.org', 'ngo', 'Sundarbans Conservation Society', '+91-9876543210', 'Sundarbans Delta', true, now()),
  ('22222222-2222-2222-2222-222222222222', 'Coastal Panchayat', 'community@bluecarbon-registry.org', 'community', 'Kundapura Coastal Council', '+91-9876543211', 'Kundapura Coast', true, now()),
  ('33333333-3333-3333-3333-333333333333', 'Green MRV Auditor', 'auditor@bluecarbon-registry.org', 'auditor', null, null, null, true, now()),
  ('44444444-4444-4444-4444-444444444444', 'BlueCarbon-Registry Admin', 'admin@bluecarbon-registry.org', 'admin', null, null, null, true, now())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role, is_approved = EXCLUDED.is_approved;
