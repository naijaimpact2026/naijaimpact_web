-- ============================================================
-- Migration: 20261105100000_competitions_engine.sql
-- Description: One generic competition engine powering all 8 Hubnovo
--   competitions (Marketplace, Campus, Creators, Artisan, Impact,
--   Business LaunchPad, NYSC, Career). Each competition is a row plus its
--   zones and missions — no per-competition tables.
--
--   XP is an append-only ledger (competition_xp_events). Leaderboards are
--   calculated from it, never stored as a counter. Each mission can award
--   XP once per user per competition (unique index), and every award also
--   adds to users.impact_points (shown in the app as "H-Points").
--
--   Security: every table is SELECT-only for clients. All writes go
--   through server actions using the service-role client, and the award
--   function is not executable by anon/authenticated.
--
--   Safe to re-run (IF NOT EXISTS / ON CONFLICT guards throughout).
-- ============================================================

-- ─── competitions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competitions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text NOT NULL UNIQUE,
  name               text NOT NULL,
  tagline            text,
  description        text,
  icon               text NOT NULL DEFAULT 'trophy',          -- lucide icon key (see lib/competitions/config.ts)
  theme_color        text NOT NULL DEFAULT '#00688A',
  status             text NOT NULL DEFAULT 'coming_soon'
                       CHECK (status IN ('coming_soon', 'live', 'ended')),
  season_name        text,
  season_start       timestamptz,
  season_end         timestamptz,
  leaderboard_groups text[] NOT NULL DEFAULT '{overall}',      -- overall | state | category | campus
  prize_note         text,                                    -- shown as-is; prizes need legal sign-off
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── competition_zones (buildings / hubs on the city map) ────
CREATE TABLE IF NOT EXISTS public.competition_zones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  key             text NOT NULL,
  label           text NOT NULL,
  description     text,
  icon            text NOT NULL DEFAULT 'building',
  sort_order      integer NOT NULL DEFAULT 0,
  UNIQUE (competition_id, key)
);

-- ─── competition_missions ────────────────────────────────────
-- verification:
--   auto    → checked against existing app data (auto_metric + target)
--   proof   → user uploads proof, an admin approves it
--   checkin → user confirms it themselves (low XP)
CREATE TABLE IF NOT EXISTS public.competition_missions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  key             text NOT NULL,
  zone_key        text,
  title           text NOT NULL,
  description     text,
  xp              integer NOT NULL CHECK (xp > 0 AND xp <= 10000),
  verification    text NOT NULL CHECK (verification IN ('auto', 'proof', 'checkin')),
  auto_metric     text,                 -- e.g. listings_active, orders_delivered (lib/competitions/metrics.ts)
  target          integer NOT NULL DEFAULT 1 CHECK (target > 0),
  proof_hint      text,                 -- what to upload for proof missions
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, key),
  CHECK (verification <> 'auto' OR auto_metric IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS competition_missions_competition_idx
  ON public.competition_missions (competition_id, sort_order);

-- ─── competition_participants ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competition_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  state           text,                 -- for "by state" leaderboards
  category        text,                 -- for "by category" leaderboards
  avatar          jsonb NOT NULL DEFAULT '{}',
  joined_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, user_id)
);

CREATE INDEX IF NOT EXISTS competition_participants_user_idx
  ON public.competition_participants (user_id);

-- ─── competition_submissions (proof missions) ────────────────
CREATE TABLE IF NOT EXISTS public.competition_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  mission_id      uuid NOT NULL REFERENCES public.competition_missions(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  proof_r2_key    text,
  proof_link      text,
  note            text,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  review_note     text,
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (proof_r2_key IS NOT NULL OR proof_link IS NOT NULL)
);

-- At most one open (pending/approved) submission per user per mission;
-- rejected ones can be resubmitted.
CREATE UNIQUE INDEX IF NOT EXISTS competition_submissions_one_open_idx
  ON public.competition_submissions (mission_id, user_id)
  WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS competition_submissions_status_idx
  ON public.competition_submissions (status, created_at);

-- ─── competition_xp_events (append-only XP ledger) ───────────
CREATE TABLE IF NOT EXISTS public.competition_xp_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mission_id      uuid REFERENCES public.competition_missions(id) ON DELETE SET NULL,
  amount          integer NOT NULL CHECK (amount > 0),
  source          text NOT NULL CHECK (source IN ('auto', 'proof', 'checkin', 'admin')),
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- The "award once" guarantee: one ledger row per user per mission.
CREATE UNIQUE INDEX IF NOT EXISTS competition_xp_events_once_idx
  ON public.competition_xp_events (competition_id, user_id, mission_id)
  WHERE mission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS competition_xp_events_user_idx
  ON public.competition_xp_events (competition_id, user_id);

-- ─── Scores view (leaderboards) ──────────────────────────────
-- security_invoker so RLS of the caller applies. Exposes only ids, the
-- participant's grouping fields and totals — join users for public
-- profile columns in the app (never users.*).
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
  MAX(e.created_at)                   AS last_xp_at
FROM public.competition_participants p
LEFT JOIN public.competition_xp_events e
  ON e.competition_id = p.competition_id AND e.user_id = p.user_id
GROUP BY p.id, p.competition_id, p.user_id, p.state, p.category, p.joined_at;

-- ─── RLS: read-only for clients ──────────────────────────────
ALTER TABLE public.competitions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_zones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_missions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_xp_events    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS competitions_read ON public.competitions;
CREATE POLICY competitions_read ON public.competitions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS competition_zones_read ON public.competition_zones;
CREATE POLICY competition_zones_read ON public.competition_zones
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS competition_missions_read ON public.competition_missions;
CREATE POLICY competition_missions_read ON public.competition_missions
  FOR SELECT TO authenticated USING (is_active);

-- Leaderboards are public inside the app.
DROP POLICY IF EXISTS competition_participants_read ON public.competition_participants;
CREATE POLICY competition_participants_read ON public.competition_participants
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS competition_xp_events_read ON public.competition_xp_events;
CREATE POLICY competition_xp_events_read ON public.competition_xp_events
  FOR SELECT TO authenticated USING (true);

-- Proof submissions: only your own.
DROP POLICY IF EXISTS competition_submissions_own_read ON public.competition_submissions;
CREATE POLICY competition_submissions_own_read ON public.competition_submissions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = competition_submissions.user_id AND u.auth_id = auth.uid()
    )
  );

REVOKE ALL ON public.competitions, public.competition_zones, public.competition_missions,
  public.competition_participants, public.competition_submissions, public.competition_xp_events,
  public.competition_scores
FROM anon;

REVOKE INSERT, UPDATE, DELETE ON public.competitions, public.competition_zones, public.competition_missions,
  public.competition_participants, public.competition_submissions, public.competition_xp_events
FROM authenticated;

GRANT SELECT ON public.competitions, public.competition_zones, public.competition_missions,
  public.competition_participants, public.competition_submissions, public.competition_xp_events,
  public.competition_scores
TO authenticated;

GRANT ALL ON public.competitions, public.competition_zones, public.competition_missions,
  public.competition_participants, public.competition_submissions, public.competition_xp_events,
  public.competition_scores
TO service_role;

-- ─── Award function (server-only) ────────────────────────────
-- Awards a mission's XP exactly once. Returns the XP awarded (0 if it was
-- already awarded). Raises if the season isn't open or the user hasn't
-- joined. Bumps users.impact_points only when a ledger row was inserted.
CREATE OR REPLACE FUNCTION public._unsafe_award_competition_xp(
  p_user_id     uuid,
  p_mission_id  uuid,
  p_source      text,
  p_reason      text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_mission  public.competition_missions%ROWTYPE;
  v_comp     public.competitions%ROWTYPE;
  v_event_id uuid;
BEGIN
  SELECT * INTO v_mission FROM public.competition_missions WHERE id = p_mission_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'mission_not_found'; END IF;

  SELECT * INTO v_comp FROM public.competitions WHERE id = v_mission.competition_id;
  IF v_comp.status <> 'live'
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

  INSERT INTO public.competition_xp_events (competition_id, user_id, mission_id, amount, source, reason)
  VALUES (v_comp.id, p_user_id, v_mission.id, v_mission.xp, p_source, COALESCE(p_reason, v_mission.title))
  ON CONFLICT (competition_id, user_id, mission_id) WHERE mission_id IS NOT NULL DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.users SET impact_points = impact_points + v_mission.xp WHERE id = p_user_id;
  RETURN v_mission.xp;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._unsafe_award_competition_xp(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._unsafe_award_competition_xp(uuid, uuid, text, text)
  TO service_role;

-- ─── Seed: the 8 competitions ────────────────────────────────
INSERT INTO public.competitions
  (slug, name, tagline, description, icon, theme_color, status, season_name, season_start, season_end, leaderboard_groups, prize_note, sort_order)
VALUES
  ('marketplace', 'Marketplace Competition', 'Sell more. Grow faster. Win big.',
   'List products, serve customers well and grow your store. Every real sale and great review earns XP.',
   'shopping-bag', '#F59E0B', 'live', 'Season 1',
   '2026-11-01 00:00:00+01', '2027-01-31 23:59:59+01', '{overall,state}',
   'Prizes will be announced soon.', 1),
  ('career', 'Career / Employability Competition', 'Get skilled. Get hired.',
   'Build your CV, apply to verified jobs and complete courses.', 'briefcase', '#2563EB', 'coming_soon',
   NULL, NULL, NULL, '{overall,state}', NULL, 2),
  ('creators', 'Creators Challenge', 'Create. Inspire. Get rewarded.',
   'Post, go live and grow an audience on Hubnovo.', 'clapperboard', '#DB2777', 'coming_soon',
   NULL, NULL, NULL, '{overall,category}', NULL, 3),
  ('artisan', 'Artisan Competition', 'Show your craft to Nigeria.',
   'Complete jobs, collect reviews and showcase your best work.', 'wrench', '#EA580C', 'coming_soon',
   NULL, NULL, NULL, '{overall,state,category}', NULL, 4),
  ('launchpad', 'Business LaunchPad Competition', 'From idea to launch.',
   'Register your business, build your pitch and launch.', 'rocket', '#7C3AED', 'coming_soon',
   NULL, NULL, NULL, '{overall,category}', NULL, 5),
  ('impact', 'Impact Challenge', 'Fund change in your community.',
   'Run crowdfunding campaigns for real community projects.', 'hand-coins', '#059669', 'coming_soon',
   NULL, NULL, NULL, '{overall,state}', NULL, 6),
  ('campus', 'Campus Competition', 'Represent your campus.',
   'Students compete for their campus across Nigeria.', 'graduation-cap', '#0891B2', 'coming_soon',
   NULL, NULL, NULL, '{overall,campus}', NULL, 7),
  ('nysc', 'NYSC Competition', 'Serve. Build. Stand out.',
   'Corps members compete by state with impact projects.', 'flag', '#16A34A', 'coming_soon',
   NULL, NULL, NULL, '{overall,state}', NULL, 8)
ON CONFLICT (slug) DO NOTHING;

-- ─── Seed: Marketplace City zones ────────────────────────────
INSERT INTO public.competition_zones (competition_id, key, label, description, icon, sort_order)
SELECT c.id, z.key, z.label, z.description, z.icon, z.sort_order
FROM public.competitions c
CROSS JOIN (VALUES
  ('market_square',  'Market Square',  'Set up your store and list your products.',        'store',     1),
  ('training_hub',   'Training Hub',   'Learn how to sell better on Hubnovo.',              'book-open', 2),
  ('logistics_hub',  'Logistics Hub',  'Fulfil orders and get them delivered.',             'truck',     3),
  ('showcase_arena', 'Showcase Arena', 'Go live, promote your products and get reviews.',   'radio',     4),
  ('rewards_hub',    'Rewards Hub',    'Your level, badges and the leaderboard.',           'trophy',    5)
) AS z(key, label, description, icon, sort_order)
WHERE c.slug = 'marketplace'
ON CONFLICT (competition_id, key) DO NOTHING;

-- ─── Seed: Marketplace missions ──────────────────────────────
INSERT INTO public.competition_missions
  (competition_id, key, zone_key, title, description, xp, verification, auto_metric, target, proof_hint, sort_order)
SELECT c.id, m.key, m.zone_key, m.title, m.description, m.xp, m.verification, m.auto_metric, m.target, m.proof_hint, m.sort_order
FROM public.competitions c
CROSS JOIN (VALUES
  ('setup_store',      'market_square',  'Set up your seller profile',
   'Add a business name, logo and state to your seller profile.',
   50,  'auto',    'seller_profile_complete', 1,  NULL, 1),
  ('first_listing',    'market_square',  'List your first product',
   'Publish a product this season.',
   50,  'auto',    'listings_active',         1,  NULL, 2),
  ('ten_listings',     'market_square',  'List 10 products',
   'Have 10 active products listed this season.',
   200, 'auto',    'listings_active',         10, NULL, 3),
  ('seller_guide',     'training_hub',   'Read the seller guide',
   'Learn how to take great product photos and write good descriptions.',
   20,  'checkin', NULL,                      1,  NULL, 4),
  ('first_delivery',   'logistics_hub',  'Deliver your first order',
   'Get an order from a customer and mark it delivered.',
   150, 'auto',    'orders_delivered',        1,  NULL, 5),
  ('ten_deliveries',   'logistics_hub',  'Deliver 10 orders',
   'Deliver 10 customer orders this season.',
   500, 'auto',    'orders_delivered',        10, NULL, 6),
  ('five_star',        'showcase_arena', 'Get 3 great reviews',
   'Receive three reviews of 4 stars or more from customers.',
   250, 'auto',    'good_reviews',            3,  NULL, 7),
  ('go_live',          'showcase_arena', 'Host a live shopping session',
   'Go live on Hubnovo Livestream to show your products.',
   150, 'auto',    'live_sessions',           1,  NULL, 8),
  ('promo_campaign',   'showcase_arena', 'Run a promo campaign',
   'Promote your store on social media and share proof.',
   100, 'proof',   NULL,                      1,
   'Upload a screenshot of your promo post (or paste the link to it).', 9)
) AS m(key, zone_key, title, description, xp, verification, auto_metric, target, proof_hint, sort_order)
WHERE c.slug = 'marketplace'
ON CONFLICT (competition_id, key) DO NOTHING;
