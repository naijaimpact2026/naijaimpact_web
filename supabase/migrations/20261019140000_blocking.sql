-- ============================================================================
-- Blocking: hide posts between blocked users (both directions), drop follows
-- on block, and stop new follows while a block exists.
-- ============================================================================

CREATE OR REPLACE VIEW public.post_detail_view AS
 SELECT p.id,
    p.user_id,
    p.content,
    p.post_type,
    p.created_at,
    p.updated_at,
    u.fullname AS user_fullname,
    u.username,
    u.profession AS user_profession,
    u.profile_image_url AS user_profile_image_url,
    (EXISTS ( SELECT 1
           FROM verified_users vu
          WHERE vu.user_id = u.id)) AS user_is_verified,
    ( SELECT count(*) AS count
           FROM post_views pv
          WHERE pv.post_id = p.id) AS views_count,
    ( SELECT count(*) AS count
           FROM post_comments pc
          WHERE pc.post_id = p.id) AS comment_count,
    ( SELECT count(*) AS count
           FROM post_reactions pr
          WHERE pr.post_id = p.id) AS reaction_count,
    ( SELECT count(*) AS count
           FROM post_shares ps
          WHERE ps.post_id = p.id) AS share_count,
    (EXISTS ( SELECT 1
           FROM post_reactions pr
          WHERE pr.post_id = p.id AND pr.user_id = auth.uid())) AS auth_user_has_reacted,
    (EXISTS ( SELECT 1
           FROM post_views pv
          WHERE pv.post_id = p.id AND pv.user_id = auth.uid())) AS auth_user_has_viewed,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', pm.id, 'post_id', pm.post_id, 'media_url', pm.media_url, 'media_type', pm.media_type, 'blurhash', pm.blurhash, 'thumbnail_url', pm.thumbnail_url, 'created_at', to_char((pm.created_at AT TIME ZONE 'UTC'::text), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'::text), 'updated_at', to_char((pm.updated_at AT TIME ZONE 'UTC'::text), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'::text)) ORDER BY pm.created_at) AS jsonb_agg
           FROM post_medias pm
          WHERE pm.post_id = p.id), '[]'::jsonb) AS medias,
    (EXISTS ( SELECT 1
           FROM saved_posts sp
          WHERE sp.post_id = p.id AND sp.user_id = auth.uid())) AS auth_user_has_saved,
    (EXISTS ( SELECT 1
           FROM user_follows uf
          WHERE uf.following_id = p.user_id AND uf.follower_id = auth.uid())) AS auth_user_is_following_author
   FROM posts p
     JOIN users u ON u.id = p.user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM blocked_users b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.user_id)
       OR (b.blocker_id = p.user_id AND b.blocked_id = auth.uid())
  );

CREATE UNIQUE INDEX IF NOT EXISTS blocked_users_pair_key ON public.blocked_users (blocker_id, blocked_id);

-- Clients only read their own blocks; blocking goes through the RPCs below.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.blocked_users FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.block_user(p_target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_me uuid := auth.uid();
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_target IS NULL OR p_target = v_me THEN RAISE EXCEPTION 'You cannot block yourself'; END IF;
  PERFORM public.assert_rate_limit('block', 30, 3600);
  INSERT INTO public.blocked_users (blocker_id, blocked_id) VALUES (v_me, p_target)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
  DELETE FROM public.user_follows
  WHERE (follower_id = v_me AND following_id = p_target)
     OR (follower_id = p_target AND following_id = v_me);
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock_user(p_target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  DELETE FROM public.blocked_users WHERE blocker_id = auth.uid() AND blocked_id = p_target;
END;
$$;

REVOKE ALL ON FUNCTION public.block_user(uuid), public.unblock_user(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.block_user(uuid), public.unblock_user(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_follow_blocked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.blocked_users b
    WHERE (b.blocker_id = NEW.follower_id AND b.blocked_id = NEW.following_id)
       OR (b.blocker_id = NEW.following_id AND b.blocked_id = NEW.follower_id)
  ) THEN
    RAISE EXCEPTION 'You can''t follow this account';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_follow_blocked ON public.user_follows;

CREATE TRIGGER guard_follow_blocked BEFORE INSERT ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.guard_follow_blocked();
