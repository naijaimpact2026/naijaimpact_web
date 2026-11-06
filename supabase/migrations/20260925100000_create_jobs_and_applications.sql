-- ============================================================
-- Hubnovo Jobs & Job Applications Migration
-- Creates: jobs, job_applications, job_bookmarks tables
-- Sets up RLS policies and indexes
-- ============================================================

-- ─── 1. Jobs Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  company_name          text NOT NULL,
  company_logo_url      text,
  category              text NOT NULL DEFAULT 'General',
  job_type              text NOT NULL DEFAULT 'full_time', -- full_time, part_time, contract, internship, freelance
  workplace_type        text NOT NULL DEFAULT 'on_site',   -- remote, on_site, hybrid
  location_state        text,
  location_city         text,
  salary_min            numeric,
  salary_max            numeric,
  salary_currency       text NOT NULL DEFAULT 'NGN',
  salary_period         text NOT NULL DEFAULT 'monthly',   -- monthly, yearly, hourly, project
  is_salary_negotiable  boolean NOT NULL DEFAULT false,
  description           text NOT NULL,
  requirements          text[] NOT NULL DEFAULT '{}',
  responsibilities      text[] NOT NULL DEFAULT '{}',
  benefits              text[] NOT NULL DEFAULT '{}',
  tags                  text[] NOT NULL DEFAULT '{}',
  application_url       text,                              -- optional external application URL
  application_deadline  timestamptz,
  status                text NOT NULL DEFAULT 'active',    -- active, paused, closed
  views_count           integer NOT NULL DEFAULT 0,
  applications_count    integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_employer_id_idx ON public.jobs(employer_id);
CREATE INDEX IF NOT EXISTS jobs_status_created_at_idx ON public.jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_category_idx ON public.jobs(category);
CREATE INDEX IF NOT EXISTS jobs_job_type_idx ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS jobs_workplace_type_idx ON public.jobs(workplace_type);
CREATE INDEX IF NOT EXISTS jobs_location_state_idx ON public.jobs(location_state);

-- ─── 2. Job Applications Table ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_applications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name             text NOT NULL,
  email                 text NOT NULL,
  phone                 text,
  resume_url            text,
  cover_letter          text,
  portfolio_url         text,
  experience_years      integer DEFAULT 0,
  expected_salary       numeric,
  status                text NOT NULL DEFAULT 'submitted', -- submitted, in_review, shortlisted, interviewed, rejected, hired
  employer_notes        text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_job_applicant UNIQUE (job_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS job_applications_job_id_idx ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS job_applications_applicant_id_idx ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS job_applications_status_idx ON public.job_applications(status);

-- ─── 3. Job Bookmarks / Saved Jobs Table ─────────────────────
CREATE TABLE IF NOT EXISTS public.job_bookmarks (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id                uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_job_bookmark UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS job_bookmarks_user_id_idx ON public.job_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS job_bookmarks_job_id_idx ON public.job_bookmarks(job_id);

-- ─── 4. Row Level Security (RLS) ────────────────────────────
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_bookmarks ENABLE ROW LEVEL SECURITY;

-- Jobs RLS Policies
DROP POLICY IF EXISTS "Jobs are readable by everyone" ON public.jobs;
CREATE POLICY "Jobs are readable by everyone"
  ON public.jobs FOR SELECT
  USING (status = 'active' OR auth.uid() IN (SELECT auth_id FROM public.users WHERE id = employer_id));

DROP POLICY IF EXISTS "Users can post jobs" ON public.jobs;
CREATE POLICY "Users can post jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = employer_id));

DROP POLICY IF EXISTS "Employers can update their jobs" ON public.jobs;
CREATE POLICY "Employers can update their jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = employer_id));

DROP POLICY IF EXISTS "Employers can delete their jobs" ON public.jobs;
CREATE POLICY "Employers can delete their jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = employer_id));

-- Job Applications RLS Policies
DROP POLICY IF EXISTS "Applicants can view their own applications" ON public.job_applications;
CREATE POLICY "Applicants can view their own applications"
  ON public.job_applications FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = applicant_id));

DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.job_applications;
CREATE POLICY "Employers can view applications for their jobs"
  ON public.job_applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_applications.job_id
      AND jobs.employer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Applicants can submit applications" ON public.job_applications;
CREATE POLICY "Applicants can submit applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = applicant_id));

DROP POLICY IF EXISTS "Employers can update application status and notes" ON public.job_applications;
CREATE POLICY "Employers can update application status and notes"
  ON public.job_applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_applications.job_id
      AND jobs.employer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  ));

-- Job Bookmarks RLS Policies
DROP POLICY IF EXISTS "Users can manage their own job bookmarks" ON public.job_bookmarks;
CREATE POLICY "Users can manage their own job bookmarks"
  ON public.job_bookmarks FOR ALL
  USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
