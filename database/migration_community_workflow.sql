-- Unified SQL Migration for Community Node Workflow
-- Safe to execute in the Supabase SQL Editor.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Community Restoration Sites Table (For Site Reporting)
CREATE TABLE IF NOT EXISTS public.community_sites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  reporter_name character varying NOT NULL,
  location_name character varying NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  issue text NOT NULL,
  suggested_action text NOT NULL,
  status character varying DEFAULT 'submitted' CHECK (status = ANY (ARRAY['submitted', 'under_review', 'accepted', 'rejected'])),
  photo_url text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT community_sites_pkey PRIMARY KEY (id),
  CONSTRAINT community_sites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 2. Community Observation Reports Table (For Monitoring Logs)
CREATE TABLE IF NOT EXISTS public.community_observations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  reporter_name character varying NOT NULL,
  project_id uuid,
  comments text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  photo_url text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT community_observations_pkey PRIMARY KEY (id),
  CONSTRAINT community_observations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT community_observations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL
);

-- 3. Community Validations Table (For Crowdsourced Verification Checklist)
CREATE TABLE IF NOT EXISTS public.community_validations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  reporter_name character varying NOT NULL,
  exists boolean NOT NULL DEFAULT true,
  work_completed boolean NOT NULL DEFAULT true,
  area_accurate boolean NOT NULL DEFAULT true,
  remarks text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT community_validations_pkey PRIMARY KEY (id),
  CONSTRAINT community_validations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT community_validations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

-- 4. Geo-tagged Complaints / Issue Reporting Table (For Environmental Complaints)
CREATE TABLE IF NOT EXISTS public.community_complaints (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  reporter_name character varying NOT NULL,
  issue_type character varying NOT NULL CHECK (issue_type = ANY (ARRAY[
    'illegal_cutting', 'pollution', 'encroachment', 'damaged_area', 
    'oil_spill', 'waste_dumping', 'mangrove_destruction', 'coastal_erosion'
  ])),
  description text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  severity character varying DEFAULT 'medium' CHECK (severity = ANY (ARRAY['low', 'medium', 'high'])),
  photo_url text,
  status character varying DEFAULT 'open' CHECK (status = ANY (ARRAY['open', 'resolved', 'dismissed'])),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT community_complaints_pkey PRIMARY KEY (id),
  CONSTRAINT community_complaints_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 5. Community Activity Participation Tracking Table (For Panchayat Volunteering Logs)
CREATE TABLE IF NOT EXISTS public.community_activities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  organizer_name character varying NOT NULL,
  activity_type character varying NOT NULL CHECK (activity_type = ANY (ARRAY[
    'tree_plantation', 'cleanup', 'awareness_campaign', 'volunteer_event'
  ])),
  title character varying NOT NULL,
  description text,
  event_date date NOT NULL,
  volunteers_count integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT community_activities_pkey PRIMARY KEY (id),
  CONSTRAINT community_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 6. Disable Row Level Security (RLS) on all community tables for mock auth compatibility
ALTER TABLE public.community_sites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_observations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_validations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_activities DISABLE ROW LEVEL SECURITY;
