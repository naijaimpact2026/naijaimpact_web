-- ============================================================
-- Fix job_applications table:
-- Drop orphaned legacy table (which had FK to learnhub_employer_postings
-- and missing cover_letter column) and recreate with correct foreign key
-- to public.jobs and all application fields.
-- ============================================================

DROP TABLE IF EXISTS public.job_applications CASCADE;

CREATE TABLE public.job_applications (
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

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Job Applications RLS Policies
DROP POLICY IF EXISTS "Applicants can view their applications" ON public.job_applications;
CREATE POLICY "Applicants can view their applications"
  ON public.job_applications FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = applicant_id));

DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.job_applications;
CREATE POLICY "Employers can view applications for their jobs"
  ON public.job_applications FOR SELECT
  USING (auth.uid() IN (
    SELECT u.auth_id FROM public.users u
    JOIN public.jobs j ON j.employer_id = u.id
    WHERE j.id = job_id
  ));

DROP POLICY IF EXISTS "Job seekers can submit applications" ON public.job_applications;
CREATE POLICY "Job seekers can submit applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = applicant_id));

DROP POLICY IF EXISTS "Employers can update application status" ON public.job_applications;
CREATE POLICY "Employers can update application status"
  ON public.job_applications FOR UPDATE
  USING (auth.uid() IN (
    SELECT u.auth_id FROM public.users u
    JOIN public.jobs j ON j.employer_id = u.id
    WHERE j.id = job_id
  ));
