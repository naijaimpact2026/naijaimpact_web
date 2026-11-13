-- ============================================================
-- Migration: 20261110100000_campus_world.sql
-- Description: Hubnovo World — Campus Competition (Career & Enterprise
--   pathways). Extends the competition engine from
--   20261105100000_competitions_engine.sql:
--     • 'preview' status (admins + testers only) and a 'world' format
--     • pathways, a 16-week mission scheduler (week/day), mission kinds
--       with client-safe config, and server-only answer keys
--     • rubrics, attempts with scores/feedback/appeals
--     • institutions (campus leagues) and participant pathway/institution
--     • HubTokens: closed-loop, non-cash, append-only ledger
--     • one server-only award function (XP + tokens, once per mission)
--   Mission CONTENT is not seeded here — it is loaded from
--   lib/world/content via the admin "Sync content" action.
--   Safe to re-run.
-- ============================================================

-- ─── competitions: status 'preview' + format + weeks ─────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.competitions'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%coming_soon%'
  LOOP
    EXECUTE format('ALTER TABLE public.competitions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.competitions
  ADD CONSTRAINT competitions_status_chk CHECK (status IN ('coming_soon', 'preview', 'live', 'ended'));

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS weeks  integer NOT NULL DEFAULT 16;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competitions_format_chk') THEN
    ALTER TABLE public.competitions ADD CONSTRAINT competitions_format_chk CHECK (format IN ('classic', 'world'));
  END IF;
END $$;

-- ─── Testers (can play a 'preview' competition) ──────────────
CREATE TABLE IF NOT EXISTS public.competition_testers (
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  added_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (competition_id, user_id)
);

-- ─── Pathways ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competition_pathways (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  key             text NOT NULL CHECK (key IN ('career', 'enterprise')),
  name            text NOT NULL,
  tagline         text,
  color           text NOT NULL DEFAULT '#2563EB',
  sort_order      integer NOT NULL DEFAULT 0,
  UNIQUE (competition_id, key)
);

-- ─── Institutions (campus leagues) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.institutions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  short_name  text,
  state       text,
  kind        text NOT NULL DEFAULT 'university'
                CHECK (kind IN ('university', 'polytechnic', 'college', 'other')),
  status      text NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
  created_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Missions: world fields ──────────────────────────────────
DO $$
DECLARE r record;
BEGIN
  -- Drop the inline verification IN (...) check (auto-named); keep the auto_metric one.
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.competition_missions'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%checkin%'
  LOOP
    EXECUTE format('ALTER TABLE public.competition_missions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.competition_missions
  ADD CONSTRAINT competition_missions_verification_chk
  CHECK (verification IN ('auto', 'proof', 'checkin', 'activity'));

ALTER TABLE public.competition_missions
  ADD COLUMN IF NOT EXISTS pathway      text,
  ADD COLUMN IF NOT EXISTS stage        integer,
  ADD COLUMN IF NOT EXISTS week         integer,
  ADD COLUMN IF NOT EXISTS day          integer,
  ADD COLUMN IF NOT EXISTS kind         text,
  ADD COLUMN IF NOT EXISTS config       jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS story        text,
  ADD COLUMN IF NOT EXISTS est_minutes  integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS tokens       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bucket       text,
  ADD COLUMN IF NOT EXISTS review_mode  text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS rubric_key   text,
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS badge        jsonb;          -- {key,label} awarded when the mission passes

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competition_missions_world_chk') THEN
    ALTER TABLE public.competition_missions ADD CONSTRAINT competition_missions_world_chk CHECK (
      verification <> 'activity' OR (
        pathway IS NOT NULL AND week IS NOT NULL AND day IS NOT NULL AND stage IS NOT NULL
        AND kind IS NOT NULL AND bucket IS NOT NULL
        AND pathway IN ('career', 'enterprise')
        AND week BETWEEN 1 AND 52 AND day BETWEEN 1 AND 7 AND stage >= 1
        AND kind IN ('quiz','sort','scenario','board','canvas','evidence','video','reflection','team','live_event','boss')
        AND bucket IN ('evidence','quality','reflection','teamwork','showcase')
        AND review_mode IN ('auto','ai','human')
        AND tokens >= 0 AND tokens <= 1000
        AND max_attempts BETWEEN 1 AND 10
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS competition_missions_schedule_idx
  ON public.competition_missions (competition_id, pathway, week, day);

-- XP ledger: world awards are recorded with source 'activity'.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.competition_xp_events'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%checkin%'
  LOOP
    EXECUTE format('ALTER TABLE public.competition_xp_events DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.competition_xp_events
  ADD CONSTRAINT competition_xp_events_source_chk CHECK (source IN ('auto', 'proof', 'checkin', 'admin', 'activity'));

-- Answer keys / scenario scores: SERVER ONLY (no client policies at all).
CREATE TABLE IF NOT EXISTS public.competition_mission_keys (
  mission_id  uuid PRIMARY KEY REFERENCES public.competition_missions(id) ON DELETE CASCADE,
  answer_key  jsonb NOT NULL
);

-- ─── Rubrics ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competition_rubrics (
  key        text PRIMARY KEY,
  title      text NOT NULL,
  criteria   jsonb NOT NULL,          -- [{id,label,weight,description}]
  pass_mark  integer NOT NULL DEFAULT 60 CHECK (pass_mark BETWEEN 0 AND 100)
);

-- ─── Participants: pathway, institution, bracket ─────────────
ALTER TABLE public.competition_participants
  ADD COLUMN IF NOT EXISTS pathway        text,
  ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bracket        text NOT NULL DEFAULT 'newcomer',
  ADD COLUMN IF NOT EXISTS accessibility  jsonb NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competition_participants_world_chk') THEN
    ALTER TABLE public.competition_participants ADD CONSTRAINT competition_participants_world_chk CHECK (
      (pathway IS NULL OR pathway IN ('career', 'enterprise')) AND bracket IN ('newcomer', 'advanced')
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS competition_participants_institution_idx
  ON public.competition_participants (competition_id, institution_id);

-- ─── Attempts (world missions) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.competition_attempts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  mission_id     uuid NOT NULL REFERENCES public.competition_missions(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attempt_no     integer NOT NULL CHECK (attempt_no >= 1),
  payload        jsonb NOT NULL DEFAULT '{}',
  status         text NOT NULL CHECK (status IN ('in_review', 'passed', 'needs_revision', 'rejected')),
  score          numeric(5,2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  auto_score     numeric(5,2),
  ai_score       numeric(5,2),
  ai_feedback    jsonb,
  feedback       text,
  rubric_scores  jsonb,
  flags          text[] NOT NULL DEFAULT '{}',
  reviewer_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at    timestamptz,
  appeal_reason  text,
  appeal_status  text CHECK (appeal_status IS NULL OR appeal_status IN ('open', 'upheld', 'dismissed')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mission_id, user_id, attempt_no)
);

CREATE INDEX IF NOT EXISTS competition_attempts_user_idx   ON public.competition_attempts (competition_id, user_id);
CREATE INDEX IF NOT EXISTS competition_attempts_review_idx ON public.competition_attempts (status, created_at) WHERE status = 'in_review';

-- ─── HubTokens: closed-loop, non-cash, append-only ───────────
CREATE TABLE IF NOT EXISTS public.hub_token_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount          integer NOT NULL CHECK (amount <> 0 AND amount BETWEEN -100000 AND 100000),
  source          text NOT NULL CHECK (source IN ('mission', 'redemption', 'admin', 'reversal')),
  competition_id  uuid REFERENCES public.competitions(id) ON DELETE SET NULL,
  mission_id      uuid REFERENCES public.competition_missions(id) ON DELETE SET NULL,
  ref_id          uuid,
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hub_token_events_mission_once_idx
  ON public.hub_token_events (user_id, mission_id) WHERE source = 'mission' AND mission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS hub_token_events_user_idx ON public.hub_token_events (user_id, created_at DESC);

CREATE OR REPLACE VIEW public.hub_token_balances
WITH (security_invoker = true) AS
SELECT user_id, COALESCE(SUM(amount), 0)::integer AS balance
FROM public.hub_token_events
GROUP BY user_id;

-- ─── Scores view: add pathway + institution (appended columns) ─
CREATE OR REPLACE VIEW public.competition_scores
WITH (security_invoker = true) AS
SELECT
  p.competition_id,
  p.user_id,
  p.state,
  p.category,
  p.joined_at,
  COALESCE(SUM(e.amount), 0)::integer AS xp,
  COUNT(e.id)::integer                AS missions_completed,
  MAX(e.created_at)                   AS last_xp_at,
  p.pathway,
  p.institution_id
FROM public.competition_participants p
LEFT JOIN public.competition_xp_events e
  ON e.competition_id = p.competition_id AND e.user_id = p.user_id
GROUP BY p.id, p.competition_id, p.user_id, p.state, p.category, p.joined_at, p.pathway, p.institution_id;

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.competition_testers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_pathways     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_mission_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_rubrics      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_token_events         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS competition_pathways_read ON public.competition_pathways;
CREATE POLICY competition_pathways_read ON public.competition_pathways FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS institutions_read ON public.institutions;
CREATE POLICY institutions_read ON public.institutions FOR SELECT TO authenticated USING (status = 'approved');

DROP POLICY IF EXISTS competition_rubrics_read ON public.competition_rubrics;
CREATE POLICY competition_rubrics_read ON public.competition_rubrics FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS competition_attempts_own_read ON public.competition_attempts;
CREATE POLICY competition_attempts_own_read ON public.competition_attempts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = competition_attempts.user_id AND u.auth_id = auth.uid())
);

DROP POLICY IF EXISTS hub_token_events_own_read ON public.hub_token_events;
CREATE POLICY hub_token_events_own_read ON public.hub_token_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = hub_token_events.user_id AND u.auth_id = auth.uid())
);
-- competition_testers and competition_mission_keys: no client policies (server only).

REVOKE ALL ON public.competition_testers, public.competition_pathways, public.institutions,
  public.competition_mission_keys, public.competition_rubrics, public.competition_attempts,
  public.hub_token_events, public.hub_token_balances
FROM anon;

REVOKE ALL ON public.competition_testers, public.competition_mission_keys FROM authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.competition_pathways, public.institutions,
  public.competition_rubrics, public.competition_attempts, public.hub_token_events
FROM authenticated;

GRANT SELECT ON public.competition_pathways, public.institutions, public.competition_rubrics,
  public.competition_attempts, public.hub_token_events, public.hub_token_balances, public.competition_scores
TO authenticated;

GRANT ALL ON public.competition_testers, public.competition_pathways, public.institutions,
  public.competition_mission_keys, public.competition_rubrics, public.competition_attempts,
  public.hub_token_events, public.hub_token_balances
TO service_role;

-- ─── Award function (server-only) ────────────────────────────
-- Grants a world mission's XP + HubTokens exactly once. Returns
-- {"xp": n, "tokens": n} (zeros if already awarded). impact_points
-- (H-Points) only move when the competition is LIVE, so preview testing
-- never changes real users' points.
CREATE OR REPLACE FUNCTION public._unsafe_award_world_mission(
  p_user_id    uuid,
  p_mission_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_mission  public.competition_missions%ROWTYPE;
  v_comp     public.competitions%ROWTYPE;
  v_pathway  text;
  v_event_id uuid;
  v_tokens   integer := 0;
BEGIN
  SELECT * INTO v_mission FROM public.competition_missions
  WHERE id = p_mission_id AND is_active AND verification = 'activity';
  IF NOT FOUND THEN RAISE EXCEPTION 'mission_not_found'; END IF;

  SELECT * INTO v_comp FROM public.competitions WHERE id = v_mission.competition_id;
  IF v_comp.status NOT IN ('live', 'preview')
     OR (v_comp.season_start IS NOT NULL AND now() < v_comp.season_start)
     OR (v_comp.season_end   IS NOT NULL AND now() > v_comp.season_end) THEN
    RAISE EXCEPTION 'season_closed';
  END IF;

  SELECT pathway INTO v_pathway FROM public.competition_participants
  WHERE competition_id = v_comp.id AND user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_joined'; END IF;
  IF v_pathway IS DISTINCT FROM v_mission.pathway THEN RAISE EXCEPTION 'wrong_pathway'; END IF;

  INSERT INTO public.competition_xp_events (competition_id, user_id, mission_id, amount, source, reason)
  VALUES (v_comp.id, p_user_id, v_mission.id, v_mission.xp, 'activity', v_mission.title)
  ON CONFLICT (competition_id, user_id, mission_id) WHERE mission_id IS NOT NULL DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object('xp', 0, 'tokens', 0);
  END IF;

  IF v_mission.tokens > 0 THEN
    INSERT INTO public.hub_token_events (user_id, amount, source, competition_id, mission_id, reason)
    VALUES (p_user_id, v_mission.tokens, 'mission', v_comp.id, v_mission.id, v_mission.title)
    ON CONFLICT (user_id, mission_id) WHERE source = 'mission' AND mission_id IS NOT NULL DO NOTHING;
    v_tokens := v_mission.tokens;
  END IF;

  IF v_comp.status = 'live' THEN
    UPDATE public.users SET impact_points = impact_points + v_mission.xp WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object('xp', v_mission.xp, 'tokens', v_tokens);
END;
$$;

REVOKE EXECUTE ON FUNCTION public._unsafe_award_world_mission(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._unsafe_award_world_mission(uuid, uuid) TO service_role;

-- ─── Campus Competition → Hubnovo World (preview) ────────────
-- The row was seeded as a classic 'coming_soon' competition; convert it once.
-- Semester 1 starts on a Monday (week/day maths assume Monday = day 1).
UPDATE public.competitions SET
  format             = 'world',
  weeks              = 16,
  status             = CASE WHEN status = 'coming_soon' THEN 'preview' ELSE status END,
  name               = 'Campus Competition',
  tagline            = 'Career & Enterprise pathways — learn, compete, build, earn.',
  description        = 'Hubnovo World: a 16-week semester of daily quests, real-world missions and weekly boss challenges. Choose the Career & Employability pathway or the Enterprise Development pathway and climb the campus league.',
  season_name        = 'Semester 1',
  season_start       = '2026-11-09 00:00:00+01',
  season_end         = '2027-02-28 23:59:59+01',
  leaderboard_groups = '{overall,campus,state}',
  prize_note         = 'Certificates, badges and rewards will be announced soon.'
WHERE slug = 'campus' AND format = 'classic';

INSERT INTO public.competition_pathways (competition_id, key, name, tagline, color, sort_order)
SELECT c.id, p.key, p.name, p.tagline, p.color, p.sort_order
FROM public.competitions c
CROSS JOIN (VALUES
  ('career',     'Career & Employability',  'Discover & Define — find your path, build your brand, get job-ready.', '#2563EB', 1),
  ('enterprise', 'Enterprise Development',  'Identify & Innovate — find real problems, validate ideas, pitch.',     '#16A34A', 2)
) AS p(key, name, tagline, color, sort_order)
WHERE c.slug = 'campus'
ON CONFLICT (competition_id, key) DO NOTHING;

-- ─── Rubrics ─────────────────────────────────────────────────
INSERT INTO public.competition_rubrics (key, title, criteria, pass_mark) VALUES
  ('practice', 'Practice task', '[
    {"id":"completeness","label":"Complete and on-brief","weight":40},
    {"id":"thinking","label":"Clear, specific thinking","weight":40},
    {"id":"honesty","label":"Honest and safe (no personal data, no inflated claims)","weight":20}
  ]'::jsonb, 50),
  ('evidence', 'Real-world evidence', '[
    {"id":"evidence","label":"Real evidence provided (consented, anonymised)","weight":40},
    {"id":"insight","label":"Insight drawn from the evidence","weight":35},
    {"id":"ethics","label":"Ethics and privacy respected","weight":25}
  ]'::jsonb, 60),
  ('boss', 'Sunday boss challenge', '[
    {"id":"clarity","label":"Clarity of communication","weight":25},
    {"id":"evidence","label":"Uses evidence from the week","weight":35},
    {"id":"quality","label":"Quality of the output","weight":25},
    {"id":"reflection","label":"Reflection and next steps","weight":15}
  ]'::jsonb, 60),
  ('showcase', 'Stage showcase', '[
    {"id":"evidence","label":"Evidence bundle complete and verified","weight":35},
    {"id":"quality","label":"Quality of pitch/plan","weight":30},
    {"id":"growth","label":"Improvement across the stage","weight":20},
    {"id":"communication","label":"Communication","weight":15}
  ]'::jsonb, 60)
ON CONFLICT (key) DO NOTHING;

-- ─── Institutions (starter list; users can request others) ───
INSERT INTO public.institutions (name, short_name, state, kind) VALUES
  ('University of Lagos', 'UNILAG', 'Lagos', 'university'),
  ('Lagos State University', 'LASU', 'Lagos', 'university'),
  ('Yaba College of Technology', 'YABATECH', 'Lagos', 'polytechnic'),
  ('Covenant University', 'CU', 'Ogun', 'university'),
  ('Federal University of Agriculture, Abeokuta', 'FUNAAB', 'Ogun', 'university'),
  ('Olabisi Onabanjo University', 'OOU', 'Ogun', 'university'),
  ('University of Ibadan', 'UI', 'Oyo', 'university'),
  ('Ladoke Akintola University of Technology', 'LAUTECH', 'Oyo', 'university'),
  ('The Polytechnic, Ibadan', 'POLY IBADAN', 'Oyo', 'polytechnic'),
  ('Obafemi Awolowo University', 'OAU', 'Osun', 'university'),
  ('Federal University of Technology, Akure', 'FUTA', 'Ondo', 'university'),
  ('Ekiti State University', 'EKSU', 'Ekiti', 'university'),
  ('University of Ilorin', 'UNILORIN', 'Kwara', 'university'),
  ('Kwara State Polytechnic', 'KWARAPOLY', 'Kwara', 'polytechnic'),
  ('University of Benin', 'UNIBEN', 'Edo', 'university'),
  ('Auchi Polytechnic', 'AUCHIPOLY', 'Edo', 'polytechnic'),
  ('Delta State University', 'DELSU', 'Delta', 'university'),
  ('University of Port Harcourt', 'UNIPORT', 'Rivers', 'university'),
  ('Rivers State University', 'RSU', 'Rivers', 'university'),
  ('University of Uyo', 'UNIUYO', 'Akwa Ibom', 'university'),
  ('University of Calabar', 'UNICAL', 'Cross River', 'university'),
  ('University of Nigeria, Nsukka', 'UNN', 'Enugu', 'university'),
  ('Enugu State University of Science and Technology', 'ESUT', 'Enugu', 'university'),
  ('Nnamdi Azikiwe University', 'UNIZIK', 'Anambra', 'university'),
  ('Federal University of Technology, Owerri', 'FUTO', 'Imo', 'university'),
  ('Imo State University', 'IMSU', 'Imo', 'university'),
  ('Abia State University', 'ABSU', 'Abia', 'university'),
  ('University of Abuja', 'UNIABUJA', 'FCT', 'university'),
  ('Nile University of Nigeria', 'NILE', 'FCT', 'university'),
  ('Baze University', 'BAZE', 'FCT', 'university'),
  ('Ahmadu Bello University', 'ABU', 'Kaduna', 'university'),
  ('Kaduna Polytechnic', 'KADPOLY', 'Kaduna', 'polytechnic'),
  ('Bayero University Kano', 'BUK', 'Kano', 'university'),
  ('University of Jos', 'UNIJOS', 'Plateau', 'university'),
  ('Federal University of Technology, Minna', 'FUTMINNA', 'Niger', 'university'),
  ('University of Maiduguri', 'UNIMAID', 'Borno', 'university'),
  ('Usmanu Danfodiyo University', 'UDUS', 'Sokoto', 'university'),
  ('Federal Polytechnic Nekede', 'NEKEDEPOLY', 'Imo', 'polytechnic'),
  ('Pan-Atlantic University', 'PAU', 'Lagos', 'university'),
  ('Babcock University', 'BABCOCK', 'Ogun', 'university')
ON CONFLICT (name) DO NOTHING;
