-- Migration Script for NGO User Workflow
-- Run this script in your Supabase SQL Editor.

-- 1. Upgrade the public.users table structure
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS organization_name character varying,
  ADD COLUMN IF NOT EXISTS contact_number character varying,
  ADD COLUMN IF NOT EXISTS location character varying,
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- 2. Upgrade the public.projects table structure
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS restoration_type character varying CHECK (restoration_type = ANY (ARRAY['mangrove', 'seagrass', 'salt_marsh'])),
  ADD COLUMN IF NOT EXISTS boundary_polygon jsonb;

-- 3. Modify projects status constraint to support 'draft'
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
  CHECK (status::text = ANY (ARRAY['draft'::character varying, 'pending'::character varying, 'under_review'::character varying, 'verified'::character varying, 'rejected'::character varying]::text[]));

-- 4. Modify project_images image_type constraint to support 'document'
ALTER TABLE public.project_images DROP CONSTRAINT IF EXISTS project_images_image_type_check;
ALTER TABLE public.project_images ADD CONSTRAINT project_images_image_type_check 
  CHECK (image_type::text = ANY (ARRAY['field'::character varying, 'drone'::character varying, 'satellite'::character varying, 'document'::character varying]::text[]));

-- 5. Update the handle_new_user trigger function to capture the new metadata fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    name, 
    email, 
    role, 
    organization_name, 
    contact_number, 
    location, 
    is_approved
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'community'),
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'contact_number',
    new.raw_user_meta_data->>'location',
    -- Default to false for NGOs/Communities, true for admins/auditors, or if specified in metadata
    COALESCE(
      (new.raw_user_meta_data->>'is_approved')::boolean, 
      CASE 
        WHEN COALESCE(new.raw_user_meta_data->>'role', 'community') IN ('admin', 'auditor') THEN true 
        ELSE false 
      END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Bind the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Disable Row Level Security (RLS) on all tables for mock auth compatibility
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_credits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports DISABLE ROW LEVEL SECURITY;


