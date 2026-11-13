-- ============================================================
-- Migration: 20261113110000_campus_reports.sql
-- Description: Hubnovo World — player reports. Students report another
--   player from the leaderboard or their squad (spam, abuse, cheating,
--   personal info, other), optionally about one attempt. Admins handle
--   them on the judging page: dismiss, or reject the attempt with a note.
--   Server-only (service role). Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.competition_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  reporter_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attempt_id      uuid REFERENCES public.competition_attempts(id) ON DELETE SET NULL,
  reason          text NOT NULL CHECK (reason IN ('spam', 'abuse', 'cheating', 'personal_info', 'other')),
  note            text CHECK (note IS NULL OR char_length(note) <= 1000),
  context         text CHECK (context IS NULL OR context IN ('leaderboard', 'squad', 'attempt', 'other')),
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'actioned', 'dismissed')),
  handled_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  handled_at      timestamptz,
  resolution      text CHECK (resolution IS NULL OR char_length(resolution) <= 2000),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (reporter_id <> target_user_id)
);

-- One open report per reporter → player (repeat taps don't pile up).
CREATE UNIQUE INDEX IF NOT EXISTS competition_reports_open_once_idx
  ON public.competition_reports (reporter_id, target_user_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS competition_reports_queue_idx
  ON public.competition_reports (status, created_at);
CREATE INDEX IF NOT EXISTS competition_reports_target_idx
  ON public.competition_reports (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS competition_reports_reporter_idx
  ON public.competition_reports (reporter_id, created_at DESC);

ALTER TABLE public.competition_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.competition_reports FROM anon, authenticated;
GRANT ALL ON public.competition_reports TO service_role;
