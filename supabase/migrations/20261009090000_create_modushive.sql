-- ============================================================
-- Migration: 20261009090000_create_modushive.sql
-- Description: ModusHive — short videos + admin live streams.
--   Originals live in Cloudflare R2, Mux transcodes/delivers. The
--   provider columns keep the app swappable off Mux later.
--   All writes go through server actions / the Mux webhook using the
--   service-role client, so only SELECT policies are defined here.
-- ============================================================

-- ── Roles ───────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'creator', 'admin'));

-- users rows are self-editable from the client (profile settings), so
-- stop anyone except the service role from changing their own role.
CREATE OR REPLACE FUNCTION public.prevent_user_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND coalesce(auth.role(), '') <> 'service_role'
     AND current_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'role can only be changed by an administrator';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_prevent_role_change ON public.users;
CREATE TRIGGER users_prevent_role_change
  BEFORE UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_role_change();

-- ── Videos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  kind VARCHAR(20) NOT NULL DEFAULT 'short' CHECK (kind IN ('short', 'live_replay')),
  status VARCHAR(20) NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'ready', 'errored')),
  provider VARCHAR(20) NOT NULL DEFAULT 'mux',
  provider_asset_id VARCHAR(255) UNIQUE,
  playback_id VARCHAR(255),
  playback_policy VARCHAR(10) NOT NULL DEFAULT 'signed' CHECK (playback_policy IN ('public', 'signed')),
  source_r2_key TEXT,
  source_size_bytes BIGINT,
  duration_s NUMERIC(10, 2),
  aspect_ratio VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_videos_feed ON public.videos(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_owner_id ON public.videos(owner_id, created_at DESC);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos_read"
  ON public.videos
  FOR SELECT
  TO authenticated
  USING (
    status = 'ready'
    OR EXISTS (SELECT 1 FROM public.users WHERE users.id = owner_id AND users.auth_id = auth.uid())
  );

-- ── Live streams ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'live', 'ended')),
  provider VARCHAR(20) NOT NULL DEFAULT 'mux',
  provider_stream_id VARCHAR(255) UNIQUE,
  playback_id VARCHAR(255),
  playback_policy VARCHAR(10) NOT NULL DEFAULT 'signed' CHECK (playback_policy IN ('public', 'signed')),
  chat_channel_id VARCHAR(255),
  replay_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_live_streams_status ON public.live_streams(status, created_at DESC);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_streams_read"
  ON public.live_streams
  FOR SELECT
  TO authenticated
  USING (true);

-- Stream keys let anyone broadcast as us, so they sit in their own table
-- with RLS on and no policies: only the service role can read them.
CREATE TABLE IF NOT EXISTS public.live_stream_keys (
  live_stream_id UUID PRIMARY KEY REFERENCES public.live_streams(id) ON DELETE CASCADE,
  stream_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.live_stream_keys ENABLE ROW LEVEL SECURITY;
