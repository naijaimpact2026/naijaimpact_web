-- ============================================================================
-- Payment intents, webhook event log and cron run log (2026-11-08)
--
-- Before this, Paystack references were generated in the browser and never
-- stored, so a payment whose webhook was missed could not be found again: the
-- buyer was charged and the order stayed "pending". Now the server records a
-- payment_intent (reference, amount, purpose, targets) BEFORE checkout opens;
-- the webhook, the verify action and the reconcile cron all settle through it.
--
-- Amounts are whole kobo (bigint) — no floating point on new money columns.
-- All three tables are written by the service role only.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        text NOT NULL UNIQUE,
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  purpose          text NOT NULL CHECK (purpose IN ('deposit', 'marketplace_order')),
  amount_kobo      bigint NOT NULL CHECK (amount_kobo > 0),
  currency         text NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
  -- What the payment is for (e.g. nm_orders ids). Empty for deposits.
  target_ids       uuid[] NOT NULL DEFAULT '{}',
  status           text NOT NULL DEFAULT 'pending'
                   -- needs_review: Paystack took the money but it doesn't match
                   -- this intent (wrong amount, order no longer payable).
                   -- Never retried automatically; handled by a person.
                   CHECK (status IN ('pending', 'succeeded', 'failed', 'abandoned', 'needs_review')),
  paystack_status  text,
  failure_reason   text,
  check_attempts   integer NOT NULL DEFAULT 0,
  last_checked_at  timestamptz,
  settled_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- The reconcile cron scans pending intents oldest-check-first.
CREATE INDEX IF NOT EXISTS payment_intents_pending_idx
  ON public.payment_intents (last_checked_at NULLS FIRST, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS payment_intents_user_idx
  ON public.payment_intents (user_id, created_at DESC);

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_intents FROM anon, authenticated;
GRANT SELECT ON public.payment_intents TO authenticated;

DROP POLICY IF EXISTS "payment intents owner read" ON public.payment_intents;
CREATE POLICY "payment intents owner read" ON public.payment_intents
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = (SELECT auth.uid()) OR id = (SELECT auth.uid())));

-- ---------------------------------------------------------------------------
-- Every verified Paystack webhook, stored before processing: an audit trail
-- and a way to replay events. Processing itself stays idempotent, so a repeat
-- delivery is recorded once and handled safely.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.paystack_events (
  id            bigserial PRIMARY KEY,
  event         text NOT NULL,
  reference     text,
  payload       jsonb NOT NULL,
  received_at   timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz,
  error         text
);

CREATE UNIQUE INDEX IF NOT EXISTS paystack_events_event_ref_key
  ON public.paystack_events (event, reference) WHERE reference IS NOT NULL;

ALTER TABLE public.paystack_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.paystack_events FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- One row per cron run, for monitoring recovery jobs.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cron_runs (
  id           bigserial PRIMARY KEY,
  job          text NOT NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  ok           boolean,
  summary      jsonb
);

CREATE INDEX IF NOT EXISTS cron_runs_job_idx ON public.cron_runs (job, started_at DESC);

ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cron_runs FROM anon, authenticated;
