-- ============================================================
-- Migration: 20261023140000_live_stream_thumbnails_and_replays.sql
-- Description: Adds thumbnail_url to live_streams table and enables
--   direct replay publishing and storage for ended broadcasts.
-- ============================================================

-- Add thumbnail_url column to live_streams
ALTER TABLE public.live_streams
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Policy to allow stream hosts to update their own live streams
-- (for thumbnail_url, replay_video_id, status, ended_at)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'live_streams' 
      AND policyname = 'live_streams_host_update'
  ) THEN
    CREATE POLICY "live_streams_host_update"
      ON public.live_streams
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = live_streams.host_id
            AND users.auth_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = live_streams.host_id
            AND users.auth_id = auth.uid()
        )
      );
  END IF;
END $$;
