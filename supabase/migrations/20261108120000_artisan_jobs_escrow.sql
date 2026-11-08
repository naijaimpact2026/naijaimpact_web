-- ============================================================================
-- Artisan hiring with escrow (2026-11-08)
--
-- Flow:  requested → quoted → funded → in_progress → submitted → completed
--        side exits: declined · cancelled · expired · disputed → (completed | refunded)
--
-- Money rules
--   * The customer funds the full quote from their wallet into escrow.
--   * Money is released ONLY when the customer approves. No auto-release.
--   * If the customer isn't satisfied they open a dispute; an admin resolves it
--     by releasing, refunding, or splitting.
--   * Platform fee: set per job at quote time, capped at 5% (500 bps), taken
--     from the artisan's share when money is released. Refunds carry no fee.
--
-- Amounts are whole kobo (bigint). Wallet credits/debits go through the
-- existing idempotent web_wallet_* functions on user_wallet.balance, so every
-- movement also lands in `transactions` with a unique reference.
-- All writes are service-role only; server actions authenticate the user and
-- pass their users.id.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artisan_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  artisan_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  listing_id      uuid,  -- nm_listings.id of the service hired (informational)
  title           text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description     text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  address         text CHECK (address IS NULL OR char_length(address) <= 300),
  preferred_date  date,
  budget_kobo     bigint CHECK (budget_kobo IS NULL OR budget_kobo > 0),
  quote_kobo      bigint CHECK (quote_kobo IS NULL OR quote_kobo >= 10000),  -- ₦100 minimum
  quote_note      text CHECK (quote_note IS NULL OR char_length(quote_note) <= 1000),
  fee_bps         integer NOT NULL DEFAULT 500 CHECK (fee_bps BETWEEN 0 AND 500),  -- 5% cap
  status          text NOT NULL DEFAULT 'requested' CHECK (status IN (
                    'requested', 'quoted', 'declined', 'cancelled', 'expired',
                    'funded', 'in_progress', 'submitted', 'disputed', 'completed', 'refunded')),
  quoted_at       timestamptz,
  funded_at       timestamptz,
  started_at      timestamptz,
  submitted_at    timestamptz,
  completed_at    timestamptz,
  closed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (customer_id <> artisan_id)
);

CREATE INDEX IF NOT EXISTS artisan_jobs_customer_idx ON public.artisan_jobs (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS artisan_jobs_artisan_idx ON public.artisan_jobs (artisan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS artisan_jobs_open_idx ON public.artisan_jobs (status, updated_at)
  WHERE status IN ('requested', 'quoted', 'submitted');

CREATE TABLE IF NOT EXISTS public.escrow_holds (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id             uuid NOT NULL UNIQUE REFERENCES public.artisan_jobs(id) ON DELETE RESTRICT,
  payer_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  payee_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  amount_kobo        bigint NOT NULL CHECK (amount_kobo > 0),
  fee_kobo           bigint NOT NULL DEFAULT 0 CHECK (fee_kobo >= 0),       -- fee actually taken
  payee_kobo         bigint NOT NULL DEFAULT 0 CHECK (payee_kobo >= 0),     -- paid to artisan
  payer_refund_kobo  bigint NOT NULL DEFAULT 0 CHECK (payer_refund_kobo >= 0),
  status             text NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'split')),
  ref                text NOT NULL UNIQUE,
  held_at            timestamptz NOT NULL DEFAULT now(),
  settled_at         timestamptz,
  CHECK (status = 'held' OR fee_kobo + payee_kobo + payer_refund_kobo = amount_kobo)
);

CREATE INDEX IF NOT EXISTS escrow_holds_payer_idx ON public.escrow_holds (payer_id) WHERE status = 'held';
CREATE INDEX IF NOT EXISTS escrow_holds_payee_idx ON public.escrow_holds (payee_id) WHERE status = 'held';

CREATE TABLE IF NOT EXISTS public.job_disputes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id             uuid NOT NULL REFERENCES public.artisan_jobs(id) ON DELETE RESTRICT,
  opened_by          uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  reason             text NOT NULL CHECK (reason IN ('not_done', 'poor_quality', 'no_show', 'no_response', 'other')),
  details            text NOT NULL CHECK (char_length(details) BETWEEN 10 AND 2000),
  evidence_urls      text[] NOT NULL DEFAULT '{}' CHECK (cardinality(evidence_urls) <= 6),
  status             text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  outcome            text CHECK (outcome IN ('release', 'refund', 'split')),
  artisan_share_pct  integer CHECK (artisan_share_pct BETWEEN 0 AND 100),
  resolved_by        uuid REFERENCES public.users(id),
  resolution_note    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  resolved_at        timestamptz
);

-- At most one open dispute per job.
CREATE UNIQUE INDEX IF NOT EXISTS job_disputes_one_open ON public.job_disputes (job_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS job_disputes_open_idx ON public.job_disputes (created_at) WHERE status = 'open';

-- Timeline shown on the job page.
CREATE TABLE IF NOT EXISTS public.artisan_job_events (
  id          bigserial PRIMARY KEY,
  job_id      uuid NOT NULL REFERENCES public.artisan_jobs(id) ON DELETE CASCADE,
  actor_id    uuid REFERENCES public.users(id),
  kind        text NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artisan_job_events_job_idx ON public.artisan_job_events (job_id, created_at);

-- ---------------------------------------------------------------------------
-- RLS: the two parties can read their own jobs; nobody writes directly.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.my_user_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_user_ids() TO authenticated, service_role;

ALTER TABLE public.artisan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_job_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.artisan_jobs, public.escrow_holds, public.job_disputes, public.artisan_job_events FROM anon, authenticated;
GRANT SELECT ON public.artisan_jobs, public.escrow_holds, public.job_disputes, public.artisan_job_events TO authenticated;

DROP POLICY IF EXISTS "jobs party read" ON public.artisan_jobs;
CREATE POLICY "jobs party read" ON public.artisan_jobs FOR SELECT TO authenticated
  USING (customer_id IN (SELECT public.my_user_ids()) OR artisan_id IN (SELECT public.my_user_ids()));

DROP POLICY IF EXISTS "escrow party read" ON public.escrow_holds;
CREATE POLICY "escrow party read" ON public.escrow_holds FOR SELECT TO authenticated
  USING (payer_id IN (SELECT public.my_user_ids()) OR payee_id IN (SELECT public.my_user_ids()));

DROP POLICY IF EXISTS "disputes party read" ON public.job_disputes;
CREATE POLICY "disputes party read" ON public.job_disputes FOR SELECT TO authenticated
  USING (job_id IN (SELECT id FROM public.artisan_jobs
                    WHERE customer_id IN (SELECT public.my_user_ids()) OR artisan_id IN (SELECT public.my_user_ids())));

DROP POLICY IF EXISTS "job events party read" ON public.artisan_job_events;
CREATE POLICY "job events party read" ON public.artisan_job_events FOR SELECT TO authenticated
  USING (job_id IN (SELECT id FROM public.artisan_jobs
                    WHERE customer_id IN (SELECT public.my_user_ids()) OR artisan_id IN (SELECT public.my_user_ids())));

-- ---------------------------------------------------------------------------
-- Money functions
-- ---------------------------------------------------------------------------

-- Customer accepts the quote and pays it from their wallet into escrow.
CREATE OR REPLACE FUNCTION public.escrow_fund_job(p_job_id uuid, p_customer uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.artisan_jobs%ROWTYPE;
  v_ref text := 'ESC_' || replace(p_job_id::text, '-', '');
BEGIN
  SELECT * INTO v_job FROM public.artisan_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF v_job.customer_id <> p_customer THEN RAISE EXCEPTION 'Not your job'; END IF;
  IF EXISTS (SELECT 1 FROM public.escrow_holds WHERE job_id = p_job_id) THEN RETURN 'already_funded'; END IF;
  IF v_job.status <> 'quoted' OR v_job.quote_kobo IS NULL THEN RAISE EXCEPTION 'Job is not awaiting payment'; END IF;

  -- Raises 'Insufficient balance' if the wallet can't cover it.
  PERFORM public.web_wallet_debit(p_customer, (v_job.quote_kobo / 100.0)::double precision, 'escrow_hold', v_ref);

  INSERT INTO public.escrow_holds (job_id, payer_id, payee_id, amount_kobo, ref)
  VALUES (p_job_id, v_job.customer_id, v_job.artisan_id, v_job.quote_kobo, v_ref);

  UPDATE public.artisan_jobs SET status = 'funded', funded_at = now(), updated_at = now() WHERE id = p_job_id;
  INSERT INTO public.artisan_job_events (job_id, actor_id, kind) VALUES (p_job_id, p_customer, 'funded');
  RETURN 'funded';
END;
$$;

-- Internal: pay out a held escrow. `p_artisan_gross_kobo` is the artisan's
-- share before fee; the rest goes back to the customer. Exactly once per job.
CREATE OR REPLACE FUNCTION public._escrow_settle(
  p_job_id uuid, p_actor uuid, p_artisan_gross_kobo bigint, p_hold_status text, p_job_status text, p_event text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job   public.artisan_jobs%ROWTYPE;
  v_hold  public.escrow_holds%ROWTYPE;
  v_fee   bigint;
  v_net   bigint;
  v_back  bigint;
BEGIN
  SELECT * INTO v_job FROM public.artisan_jobs WHERE id = p_job_id FOR UPDATE;
  SELECT * INTO v_hold FROM public.escrow_holds WHERE job_id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No escrow for this job'; END IF;
  IF v_hold.status <> 'held' THEN RETURN 'already_settled'; END IF;
  IF p_artisan_gross_kobo < 0 OR p_artisan_gross_kobo > v_hold.amount_kobo THEN RAISE EXCEPTION 'Invalid split'; END IF;

  v_fee  := round(p_artisan_gross_kobo * v_job.fee_bps / 10000.0)::bigint;
  v_net  := p_artisan_gross_kobo - v_fee;
  v_back := v_hold.amount_kobo - p_artisan_gross_kobo;

  IF v_net > 0 THEN
    PERFORM public.web_wallet_credit(v_hold.payee_id, (v_net / 100.0)::double precision, 'escrow_release', v_hold.ref || '_REL');
  END IF;
  IF v_back > 0 THEN
    PERFORM public.web_wallet_credit(v_hold.payer_id, (v_back / 100.0)::double precision, 'escrow_refund', v_hold.ref || '_REF');
  END IF;

  UPDATE public.escrow_holds
  SET status = p_hold_status, fee_kobo = v_fee, payee_kobo = v_net, payer_refund_kobo = v_back, settled_at = now()
  WHERE id = v_hold.id;

  UPDATE public.artisan_jobs
  SET status = p_job_status,
      completed_at = CASE WHEN p_job_status = 'completed' THEN now() ELSE completed_at END,
      closed_at = now(),
      updated_at = now()
  WHERE id = p_job_id;

  INSERT INTO public.artisan_job_events (job_id, actor_id, kind) VALUES (p_job_id, p_actor, p_event);
  RETURN 'settled';
END;
$$;

-- Customer approves the work: full release to the artisan (minus fee).
CREATE OR REPLACE FUNCTION public.escrow_release_job(p_job_id uuid, p_customer uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_job public.artisan_jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_job FROM public.artisan_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF v_job.customer_id <> p_customer THEN RAISE EXCEPTION 'Only the customer can approve'; END IF;
  IF v_job.status = 'completed' THEN RETURN 'already_settled'; END IF;
  IF v_job.status NOT IN ('funded', 'in_progress', 'submitted') THEN RAISE EXCEPTION 'This job cannot be approved now'; END IF;
  RETURN public._escrow_settle(p_job_id, p_customer, v_job.quote_kobo, 'released', 'completed', 'approved');
END;
$$;

-- Cancel. Before payment: no money moves. Funded but not started: full refund
-- (either party may cancel). After work starts: open a dispute instead.
CREATE OR REPLACE FUNCTION public.escrow_cancel_job(p_job_id uuid, p_actor uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_job public.artisan_jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_job FROM public.artisan_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF p_actor NOT IN (v_job.customer_id, v_job.artisan_id) THEN RAISE EXCEPTION 'Not your job'; END IF;

  IF v_job.status IN ('requested', 'quoted') THEN
    UPDATE public.artisan_jobs
    SET status = CASE WHEN p_actor = v_job.artisan_id THEN 'declined' ELSE 'cancelled' END,
        closed_at = now(), updated_at = now()
    WHERE id = p_job_id;
    INSERT INTO public.artisan_job_events (job_id, actor_id, kind)
    VALUES (p_job_id, p_actor, CASE WHEN p_actor = v_job.artisan_id THEN 'declined' ELSE 'cancelled' END);
    RETURN 'cancelled';
  END IF;

  IF v_job.status = 'funded' THEN
    RETURN public._escrow_settle(p_job_id, p_actor, 0, 'refunded', 'cancelled', 'cancelled_refunded');
  END IF;

  RAISE EXCEPTION 'Work has started; open a dispute instead';
END;
$$;

-- Either party opens a dispute; this freezes the escrow until an admin decides.
-- The customer can dispute any time after paying. The artisan can dispute only
-- when the customer hasn't responded 3 days after the work was submitted.
CREATE OR REPLACE FUNCTION public.open_job_dispute(
  p_job_id uuid, p_actor uuid, p_reason text, p_details text, p_evidence text[] DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.artisan_jobs%ROWTYPE;
  v_id  uuid;
BEGIN
  SELECT * INTO v_job FROM public.artisan_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF p_actor NOT IN (v_job.customer_id, v_job.artisan_id) THEN RAISE EXCEPTION 'Not your job'; END IF;
  IF v_job.status NOT IN ('funded', 'in_progress', 'submitted') THEN RAISE EXCEPTION 'This job cannot be disputed now'; END IF;
  IF p_actor = v_job.artisan_id
     AND NOT (v_job.status = 'submitted' AND v_job.submitted_at < now() - interval '3 days') THEN
    RAISE EXCEPTION 'You can open a dispute 3 days after submitting if the customer has not responded';
  END IF;

  INSERT INTO public.job_disputes (job_id, opened_by, reason, details, evidence_urls)
  VALUES (p_job_id, p_actor, p_reason, p_details, coalesce(p_evidence, '{}'))
  RETURNING id INTO v_id;

  UPDATE public.artisan_jobs SET status = 'disputed', updated_at = now() WHERE id = p_job_id;
  INSERT INTO public.artisan_job_events (job_id, actor_id, kind, note) VALUES (p_job_id, p_actor, 'disputed', p_reason);
  RETURN v_id;
END;
$$;

-- Admin decision: release (all to artisan), refund (all to customer) or split.
CREATE OR REPLACE FUNCTION public.resolve_job_dispute(
  p_dispute_id uuid, p_admin uuid, p_outcome text, p_artisan_pct integer, p_note text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute public.job_disputes%ROWTYPE;
  v_amount  bigint;
  v_gross   bigint;
  v_pct     integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_admin AND role::text IN ('admin', 'super_admin')) THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  IF p_note IS NULL OR char_length(trim(p_note)) < 5 THEN RAISE EXCEPTION 'Write a short reason for the decision'; END IF;

  SELECT * INTO v_dispute FROM public.job_disputes WHERE id = p_dispute_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dispute not found'; END IF;
  IF v_dispute.status <> 'open' THEN RETURN 'already_resolved'; END IF;

  SELECT amount_kobo INTO v_amount FROM public.escrow_holds WHERE job_id = v_dispute.job_id;

  v_pct := CASE p_outcome WHEN 'release' THEN 100 WHEN 'refund' THEN 0 WHEN 'split' THEN p_artisan_pct END;
  IF v_pct IS NULL OR v_pct < 0 OR v_pct > 100 THEN RAISE EXCEPTION 'Invalid outcome'; END IF;
  IF p_outcome = 'split' AND v_pct IN (0, 100) THEN RAISE EXCEPTION 'Use release or refund instead'; END IF;
  v_gross := round(v_amount * v_pct / 100.0)::bigint;

  PERFORM public._escrow_settle(
    v_dispute.job_id, p_admin, v_gross,
    CASE p_outcome WHEN 'release' THEN 'released' WHEN 'refund' THEN 'refunded' ELSE 'split' END,
    CASE WHEN p_outcome = 'refund' THEN 'refunded' ELSE 'completed' END,
    'dispute_' || p_outcome
  );

  UPDATE public.job_disputes
  SET status = 'resolved', outcome = p_outcome, artisan_share_pct = v_pct,
      resolved_by = p_admin, resolution_note = trim(p_note), resolved_at = now()
  WHERE id = p_dispute_id;
  RETURN 'resolved';
END;
$$;

REVOKE ALL ON FUNCTION
  public.escrow_fund_job(uuid, uuid),
  public._escrow_settle(uuid, uuid, bigint, text, text, text),
  public.escrow_release_job(uuid, uuid),
  public.escrow_cancel_job(uuid, uuid),
  public.open_job_dispute(uuid, uuid, text, text, text[]),
  public.resolve_job_dispute(uuid, uuid, text, integer, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.escrow_fund_job(uuid, uuid),
  public.escrow_release_job(uuid, uuid),
  public.escrow_cancel_job(uuid, uuid),
  public.open_job_dispute(uuid, uuid, text, text, text[]),
  public.resolve_job_dispute(uuid, uuid, text, integer, text)
TO service_role;
