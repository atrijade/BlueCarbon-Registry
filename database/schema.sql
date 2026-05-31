-- Unified SQL Schema for BlueCarbon-Registry (Supabase PostgreSQL)
-- Safe to execute in the Supabase SQL Editor.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['ngo'::character varying, 'admin'::character varying, 'auditor'::character varying, 'community'::character varying]::text[])),
  organization_name character varying,
  contact_number character varying,
  location character varying,
  is_approved boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for Users
CREATE POLICY "Allow public read access to users profiles" ON public.users 
  FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own profiles" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profiles" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  location_name character varying,
  latitude numeric,
  longitude numeric,
  area_hectares numeric,
  species character varying,
  plantation_date date,
  status character varying DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying, 'pending'::character varying, 'under_review'::character varying, 'verified'::character varying, 'rejected'::character varying]::text[])),
  restoration_type character varying CHECK (restoration_type = ANY (ARRAY['mangrove'::character varying, 'seagrass'::character varying, 'salt_marsh'::character varying]::text[])),
  boundary_polygon jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for Projects
CREATE POLICY "Allow public read access to projects" ON public.projects 
  FOR SELECT USING (true);

CREATE POLICY "Allow NGOs and Community members to insert their own projects" ON public.projects 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow owners to update draft/pending/rejected projects" ON public.projects 
  FOR UPDATE USING (auth.uid() = user_id AND (status = 'draft' OR status = 'pending' OR status = 'rejected' OR status = 'under_review'));

CREATE POLICY "Allow admins and auditors to update project status" ON public.projects 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'auditor')
    )
  );

-- 3. PROJECT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.project_images (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  image_url text NOT NULL,
  image_type character varying CHECK (image_type::text = ANY (ARRAY['field'::character varying, 'drone'::character varying, 'satellite'::character varying, 'document'::character varying]::text[])),
  uploaded_at timestamp without time zone DEFAULT now(),
  CONSTRAINT project_images_pkey PRIMARY KEY (id),
  CONSTRAINT project_images_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for Project Images
CREATE POLICY "Allow public read access to project images" ON public.project_images 
  FOR SELECT USING (true);

CREATE POLICY "Allow project owners to insert images" ON public.project_images 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

-- 4. VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.verifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  verified_by uuid NOT NULL,
  status character varying CHECK (status::text = ANY (ARRAY['approved'::character varying, 'rejected'::character varying]::text[])),
  remarks text,
  verified_at timestamp without time zone DEFAULT now(),
  CONSTRAINT verifications_pkey PRIMARY KEY (id),
  CONSTRAINT verifications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT verifications_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for Verifications
CREATE POLICY "Allow public read access to verifications" ON public.verifications 
  FOR SELECT USING (true);

CREATE POLICY "Allow admins and auditors to write verifications" ON public.verifications 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'auditor')
    )
  );

-- 5. CARBON CREDITS TABLE
CREATE TABLE IF NOT EXISTS public.carbon_credits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  credits numeric NOT NULL,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'retired'::character varying]::text[])),
  issued_at timestamp without time zone DEFAULT now(),
  CONSTRAINT carbon_credits_pkey PRIMARY KEY (id),
  CONSTRAINT carbon_credits_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

ALTER TABLE public.carbon_credits ENABLE ROW LEVEL SECURITY;

-- RLS policies for Carbon Credits
CREATE POLICY "Allow public read access to carbon credits" ON public.carbon_credits 
  FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage carbon credits" ON public.carbon_credits 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 6. BLOCKCHAIN RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.blockchain_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  transaction_hash character varying NOT NULL,
  contract_address character varying,
  network character varying DEFAULT 'Polygon Amoy'::character varying,
  block_number bigint,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT blockchain_records_pkey PRIMARY KEY (id),
  CONSTRAINT blockchain_records_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

ALTER TABLE public.blockchain_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to blockchain records" ON public.blockchain_records 
  FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage blockchain records" ON public.blockchain_records 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 7. AI REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.ai_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  verification_score integer,
  risk_level character varying CHECK (risk_level::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying]::text[])),
  summary text,
  recommendation text,
  generated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT ai_reports_pkey PRIMARY KEY (id),
  CONSTRAINT ai_reports_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to AI reports" ON public.ai_reports 
  FOR SELECT USING (true);

-- =========================================================================
-- TRIGGERS AND FUNCTIONS
-- =========================================================================

-- Trigger to insert public.users on auth.users insert
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

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update project status when verification occurs
CREATE OR REPLACE FUNCTION public.handle_project_verification()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE public.projects 
    SET status = 'verified' 
    WHERE id = NEW.project_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.projects 
    SET status = 'rejected' 
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_verification ON public.verifications;
CREATE TRIGGER on_project_verification
  AFTER INSERT ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_project_verification();
