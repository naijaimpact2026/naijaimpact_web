-- ════════════════════════════════════════════════════════════════════════════
-- Campus Competition — daily campus drops (24 Nov 2026)
--
-- Once a day a glowing drop appears somewhere in the 3D Campus. Walking to
-- it shows a one-tap card (myth or fact, pick one). Claiming it gives a little
-- XP and keeps the player's streak going. It never counts towards stars or the
-- stage pass. One claim per player per Lagos day.
--
-- Safe to run more than once.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.competition_drop_claims (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- The Africa/Lagos calendar day the drop belongs to.
  day             date NOT NULL,
  drop_key        text NOT NULL CHECK (char_length(drop_key) BETWEEN 1 AND 80),
  correct         boolean NOT NULL DEFAULT false,
  xp              integer NOT NULL DEFAULT 0 CHECK (xp BETWEEN 0 AND 100),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, user_id, day)
);

CREATE INDEX IF NOT EXISTS competition_drop_claims_user_idx
  ON public.competition_drop_claims (competition_id, user_id, day DESC);

ALTER TABLE public.competition_drop_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS competition_drop_claims_own_read ON public.competition_drop_claims;
CREATE POLICY competition_drop_claims_own_read ON public.competition_drop_claims FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = competition_drop_claims.user_id AND u.auth_id = auth.uid())
);

REVOKE ALL ON public.competition_drop_claims FROM anon;
GRANT SELECT ON public.competition_drop_claims TO authenticated;
GRANT ALL ON public.competition_drop_claims TO service_role;

-- ─── Claim function (server-only) ───────────────────────────────────────────
-- Records today's claim and grants its XP exactly once. Returns the XP given
-- (0 when the player already claimed today's drop). impact_points (H-Points)
-- only move when the competition is LIVE, like mission awards.
CREATE OR REPLACE FUNCTION public._unsafe_claim_world_drop(
  p_user_id        uuid,
  p_competition_id uuid,
  p_day            date,
  p_drop_key       text,
  p_correct        boolean,
  p_xp             integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_comp     public.competitions%ROWTYPE;
  v_claim_id uuid;
  v_xp       integer := GREATEST(0, LEAST(COALESCE(p_xp, 0), 100));
BEGIN
  SELECT * INTO v_comp FROM public.competitions WHERE id = p_competition_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'competition_not_found'; END IF;
  IF v_comp.status NOT IN ('live', 'preview')
     OR (v_comp.season_start IS NOT NULL AND now() < v_comp.season_start)
     OR (v_comp.season_end   IS NOT NULL AND now() > v_comp.season_end) THEN
    RAISE EXCEPTION 'season_closed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.competition_participants
    WHERE competition_id = v_comp.id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'not_joined';
  END IF;

  INSERT INTO public.competition_drop_claims (competition_id, user_id, day, drop_key, correct, xp)
  VALUES (v_comp.id, p_user_id, p_day, p_drop_key, COALESCE(p_correct, false), v_xp)
  ON CONFLICT (competition_id, user_id, day) DO NOTHING
  RETURNING id INTO v_claim_id;

  IF v_claim_id IS NULL OR v_xp = 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.competition_xp_events (competition_id, user_id, mission_id, amount, source, reason)
  VALUES (v_comp.id, p_user_id, NULL, v_xp, 'checkin', 'Campus drop ' || p_day::text);

  IF v_comp.status = 'live' THEN
    UPDATE public.users SET impact_points = impact_points + v_xp WHERE id = p_user_id;
  END IF;

  RETURN v_xp;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._unsafe_claim_world_drop(uuid, uuid, date, text, boolean, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._unsafe_claim_world_drop(uuid, uuid, date, text, boolean, integer) TO service_role;

-- ─── Scores view: drops add XP but are not missions ─────────────────────────
-- Same columns, same order as before; only missions_completed now skips XP
-- events without a mission (drops, admin grants).
CREATE OR REPLACE VIEW public.competition_scores
WITH (security_invoker = true) AS
SELECT
  p.competition_id,
  p.user_id,
  p.state,
  p.category,
  p.joined_at,
  COALESCE(SUM(e.amount), 0)::integer                          AS xp,
  (COUNT(e.id) FILTER (WHERE e.mission_id IS NOT NULL))::integer AS missions_completed,
  MAX(e.created_at)                                            AS last_xp_at,
  p.pathway,
  p.institution_id
FROM public.competition_participants p
LEFT JOIN public.competition_xp_events e
  ON e.competition_id = p.competition_id AND e.user_id = p.user_id
GROUP BY p.id, p.competition_id, p.user_id, p.state, p.category, p.joined_at, p.pathway, p.institution_id;
