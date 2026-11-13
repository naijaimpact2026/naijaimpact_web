-- ============================================================
-- Migration: 20261113100000_campus_rewards.sql
-- Description: Hubnovo World — Rewards Exchange. Students spend HubTokens
--   on non-cash rewards (course discounts, avatar items, event access).
--   Tokens never buy score or XP, can't be sent to anyone and can't be
--   cashed out: a redemption is only ever a negative row in the
--   append-only hub_token_events ledger, and a cancellation adds a
--   positive 'reversal' row.
--     • competition_rewards       the catalogue (admin-managed)
--     • competition_redemptions   one row per redemption
--     • _unsafe_redeem_reward()   balance/stock/limit checks + spend, one transaction
--     • _unsafe_cancel_redemption() refund + stock back, one transaction
--   Server-only (service role). Safe to re-run.
-- ============================================================

-- ─── Catalogue ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competition_rewards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  title           text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  description     text CHECK (description IS NULL OR char_length(description) <= 1000),
  image_url       text,
  cost_tokens     integer NOT NULL CHECK (cost_tokens BETWEEN 1 AND 100000),
  stock           integer CHECK (stock IS NULL OR stock >= 0),          -- NULL = unlimited
  per_user_limit  integer CHECK (per_user_limit IS NULL OR per_user_limit >= 1), -- NULL = no limit
  kind            text NOT NULL DEFAULT 'other'
                    CHECK (kind IN ('course_discount', 'avatar_item', 'event_access', 'merch', 'other')),
  fulfilment      text NOT NULL DEFAULT 'manual' CHECK (fulfilment IN ('auto', 'manual')),
  is_active       boolean NOT NULL DEFAULT false,
  sort            integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS competition_rewards_catalogue_idx
  ON public.competition_rewards (competition_id, is_active, sort);

-- ─── Redemptions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competition_redemptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  reward_id       uuid NOT NULL REFERENCES public.competition_rewards(id) ON DELETE RESTRICT,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cost            integer NOT NULL CHECK (cost > 0),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  code            text,                 -- voucher / access code shown to the student
  note            text,                 -- message from the admin (fulfilment details or cancel reason)
  request_id      uuid,                 -- client idempotency key: one redemption per tap
  fulfilled_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  fulfilled_at    timestamptz,
  cancelled_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS competition_redemptions_request_idx
  ON public.competition_redemptions (user_id, request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS competition_redemptions_user_idx
  ON public.competition_redemptions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS competition_redemptions_queue_idx
  ON public.competition_redemptions (competition_id, status, created_at);
CREATE INDEX IF NOT EXISTS competition_redemptions_reward_idx
  ON public.competition_redemptions (reward_id, user_id);

-- One spend and at most one refund per redemption in the ledger.
CREATE UNIQUE INDEX IF NOT EXISTS hub_token_events_redemption_once_idx
  ON public.hub_token_events (ref_id) WHERE source = 'redemption' AND ref_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS hub_token_events_reversal_once_idx
  ON public.hub_token_events (ref_id) WHERE source = 'reversal' AND ref_id IS NOT NULL;

-- Server-only: no client policies.
ALTER TABLE public.competition_rewards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_redemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.competition_rewards     FROM anon, authenticated;
REVOKE ALL ON public.competition_redemptions FROM anon, authenticated;
GRANT ALL ON public.competition_rewards     TO service_role;
GRANT ALL ON public.competition_redemptions TO service_role;

-- ─── Redeem (one transaction) ────────────────────────────────
-- Errors (RAISE EXCEPTION message): reward_not_found, competition_closed,
-- not_joined, out_of_stock, limit_reached, insufficient_tokens.
-- A repeated p_request_id returns the first redemption instead of spending again.
CREATE OR REPLACE FUNCTION public._unsafe_redeem_reward(
  p_user_id    uuid,
  p_reward_id  uuid,
  p_request_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_reward  public.competition_rewards%ROWTYPE;
  v_comp    public.competitions%ROWTYPE;
  v_balance integer;
  v_used    integer;
  v_id      uuid;
  v_status  text;
  v_code    text;
BEGIN
  -- Serialise everything this user spends (two quick taps run one after the other).
  PERFORM pg_advisory_xact_lock(hashtextextended('hub_tokens:' || p_user_id::text, 0));

  IF p_request_id IS NOT NULL THEN
    SELECT id INTO v_id FROM public.competition_redemptions WHERE user_id = p_user_id AND request_id = p_request_id;
    IF FOUND THEN
      SELECT COALESCE(SUM(amount), 0)::integer INTO v_balance FROM public.hub_token_events WHERE user_id = p_user_id;
      RETURN jsonb_build_object('redemption_id', v_id, 'balance', v_balance, 'repeated', true);
    END IF;
  END IF;

  -- Lock the reward row so stock can't go below zero across users.
  SELECT * INTO v_reward FROM public.competition_rewards WHERE id = p_reward_id AND is_active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'reward_not_found'; END IF;

  SELECT * INTO v_comp FROM public.competitions WHERE id = v_reward.competition_id;
  IF v_comp.status NOT IN ('live', 'preview') THEN RAISE EXCEPTION 'competition_closed'; END IF;

  PERFORM 1 FROM public.competition_participants WHERE competition_id = v_comp.id AND user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_joined'; END IF;

  IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN RAISE EXCEPTION 'out_of_stock'; END IF;

  IF v_reward.per_user_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_used FROM public.competition_redemptions
    WHERE reward_id = v_reward.id AND user_id = p_user_id AND status <> 'cancelled';
    IF v_used >= v_reward.per_user_limit THEN RAISE EXCEPTION 'limit_reached'; END IF;
  END IF;

  SELECT COALESCE(SUM(amount), 0)::integer INTO v_balance FROM public.hub_token_events WHERE user_id = p_user_id;
  IF v_balance < v_reward.cost_tokens THEN RAISE EXCEPTION 'insufficient_tokens'; END IF;

  -- Auto rewards are delivered at once with a code; manual ones wait for an admin.
  IF v_reward.fulfilment = 'auto' THEN
    v_status := 'fulfilled';
    v_code := 'HN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  ELSE
    v_status := 'pending';
  END IF;

  INSERT INTO public.competition_redemptions (competition_id, reward_id, user_id, cost, status, code, request_id, fulfilled_at)
  VALUES (v_comp.id, v_reward.id, p_user_id, v_reward.cost_tokens, v_status, v_code, p_request_id,
          CASE WHEN v_status = 'fulfilled' THEN now() END)
  RETURNING id INTO v_id;

  INSERT INTO public.hub_token_events (user_id, amount, source, competition_id, ref_id, reason)
  VALUES (p_user_id, -v_reward.cost_tokens, 'redemption', v_comp.id, v_id, v_reward.title);

  IF v_reward.stock IS NOT NULL THEN
    UPDATE public.competition_rewards SET stock = stock - 1, updated_at = now() WHERE id = v_reward.id;
  END IF;

  RETURN jsonb_build_object('redemption_id', v_id, 'balance', v_balance - v_reward.cost_tokens, 'repeated', false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public._unsafe_redeem_reward(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._unsafe_redeem_reward(uuid, uuid, uuid) TO service_role;

-- ─── Cancel + refund (one transaction) ───────────────────────
-- Errors: redemption_not_found, already_cancelled.
CREATE OR REPLACE FUNCTION public._unsafe_cancel_redemption(
  p_redemption_id uuid,
  p_admin_id      uuid,
  p_note          text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_r     public.competition_redemptions%ROWTYPE;
  v_title text;
BEGIN
  SELECT * INTO v_r FROM public.competition_redemptions WHERE id = p_redemption_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'redemption_not_found'; END IF;
  IF v_r.status = 'cancelled' THEN RAISE EXCEPTION 'already_cancelled'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('hub_tokens:' || v_r.user_id::text, 0));

  UPDATE public.competition_redemptions
  SET status = 'cancelled', cancelled_at = now(), fulfilled_by = p_admin_id,
      note = COALESCE(NULLIF(btrim(p_note), ''), note)
  WHERE id = v_r.id;

  SELECT title INTO v_title FROM public.competition_rewards WHERE id = v_r.reward_id;
  INSERT INTO public.hub_token_events (user_id, amount, source, competition_id, ref_id, reason)
  VALUES (v_r.user_id, v_r.cost, 'reversal', v_r.competition_id, v_r.id, 'Refund: ' || COALESCE(v_title, 'reward'))
  ON CONFLICT (ref_id) WHERE source = 'reversal' AND ref_id IS NOT NULL DO NOTHING;

  UPDATE public.competition_rewards SET stock = stock + 1, updated_at = now()
  WHERE id = v_r.reward_id AND stock IS NOT NULL;

  RETURN jsonb_build_object('user_id', v_r.user_id, 'refunded', v_r.cost);
END;
$$;

REVOKE EXECUTE ON FUNCTION public._unsafe_cancel_redemption(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._unsafe_cancel_redemption(uuid, uuid, text) TO service_role;

-- ─── Example rewards (switched off; final list still being decided) ─
INSERT INTO public.competition_rewards (competition_id, title, description, cost_tokens, stock, per_user_limit, kind, fulfilment, is_active, sort)
SELECT c.id, r.title, r.description, r.cost, r.stock, r.lim, r.kind, r.fulfilment, false, r.sort
FROM public.competitions c
CROSS JOIN (VALUES
  ('20% off a Hubnovo course', 'A discount code for any paid course on Hubnovo Learn.', 150, NULL::integer, 1, 'course_discount', 'manual', 1),
  ('Campus avatar outfit',     'A limited outfit for your 3D Campus avatar.',              80,  NULL::integer, 1, 'avatar_item',     'auto',   2),
  ('Demo Day guest pass',      'A seat at the end-of-stage Demo Day. Limited places.',      250, 50,            1, 'event_access',    'manual', 3)
) AS r(title, description, cost, stock, lim, kind, fulfilment, sort)
WHERE c.slug = 'campus'
  AND NOT EXISTS (SELECT 1 FROM public.competition_rewards x WHERE x.competition_id = c.id AND x.title = r.title);
