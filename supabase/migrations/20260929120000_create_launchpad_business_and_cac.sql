-- ============================================================
-- Hubnovo Business Launchpad & Facilitated CAC Registration Migration
-- Creates: businesses, cac_applications
-- Sets up RLS policies and indexes
-- ============================================================

-- ─── 1. Businesses Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.businesses (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  tagline               text,
  category              text NOT NULL DEFAULT 'General',
  description           text,
  location_state        text,
  location_city         text,
  logo_url              text,
  stage                 text NOT NULL DEFAULT 'ideation', -- ideation, planning, registered, launched, scaling
  step_progress         integer NOT NULL DEFAULT 1,       -- 1 through 7
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS businesses_user_id_idx ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS businesses_category_idx ON public.businesses(category);
CREATE INDEX IF NOT EXISTS businesses_stage_idx ON public.businesses(stage);

-- ─── 2. CAC Applications Table ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cac_applications (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id             uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id                 uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  proposed_name_1         text NOT NULL,
  proposed_name_2         text NOT NULL,
  business_nature         text NOT NULL,
  proprietor_full_name    text NOT NULL,
  proprietor_nin          text NOT NULL,
  proprietor_phone        text NOT NULL,
  business_address        text NOT NULL,
  business_city           text NOT NULL,
  business_state          text NOT NULL,
  fee_amount              numeric NOT NULL DEFAULT 5000,
  fee_paid                boolean NOT NULL DEFAULT false,
  payment_method          text NOT NULL DEFAULT 'wallet', -- wallet, paystack
  payment_reference       text,
  status                  text NOT NULL DEFAULT 'draft',  -- draft, submitted, name_reservation, filing, approved, rejected
  rejection_reason        text,
  cac_registration_number text,                           -- e.g., BN 3892145
  certificate_url         text,                           -- URL to downloadable certificate
  submitted_at            timestamptz,
  approved_at             timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cac_applications_business_id_idx ON public.cac_applications(business_id);
CREATE INDEX IF NOT EXISTS cac_applications_user_id_idx ON public.cac_applications(user_id);
CREATE INDEX IF NOT EXISTS cac_applications_status_idx ON public.cac_applications(status);

-- ─── 3. Row Level Security (RLS) ─────────────────────────────
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cac_applications ENABLE ROW LEVEL SECURITY;

-- Businesses Policies
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.businesses;
CREATE POLICY "Users can view their own businesses"
  ON public.businesses FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

DROP POLICY IF EXISTS "Users can insert their own businesses" ON public.businesses;
CREATE POLICY "Users can insert their own businesses"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

DROP POLICY IF EXISTS "Users can update their own businesses" ON public.businesses;
CREATE POLICY "Users can update their own businesses"
  ON public.businesses FOR UPDATE
  USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

DROP POLICY IF EXISTS "Users can delete their own businesses" ON public.businesses;
CREATE POLICY "Users can delete their own businesses"
  ON public.businesses FOR DELETE
  USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

-- CAC Applications Policies
DROP POLICY IF EXISTS "Users can view their own CAC applications" ON public.cac_applications;
CREATE POLICY "Users can view their own CAC applications"
  ON public.cac_applications FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

DROP POLICY IF EXISTS "Users can insert their own CAC applications" ON public.cac_applications;
CREATE POLICY "Users can insert their own CAC applications"
  ON public.cac_applications FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

DROP POLICY IF EXISTS "Users can update their own CAC applications" ON public.cac_applications;
CREATE POLICY "Users can update their own CAC applications"
  ON public.cac_applications FOR UPDATE
  USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
