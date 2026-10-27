-- ============================================================================
-- Security lockdown + jobs/artisans/learn fixes (2026-10-16)
--
-- Written against the LIVE schema (it has drifted from older files in this
-- folder). Principle: clients may only write the columns a user legitimately
-- controls; anything that moves money, points, scores, statuses or payouts
-- goes through SECURITY DEFINER RPCs (which run as postgres and are
-- unaffected by the privilege changes below).
--
-- Approved by the project owner as a development-environment lockdown:
-- legacy Flutter flows that wrote money rows from the client (P2P transfer
-- inserts, client-side wallet creation, card-payment enrolment, direct
-- insurance/loan/savings writes) intentionally stop working.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_trusted_caller()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT current_user IN ('postgres', 'supabase_admin', 'service_role')
      OR coalesce(auth.role(), '') = 'service_role';
$$;

-- ---------------------------------------------------------------------------
-- 1. users: no self-service points/verification/role/PIN; PIN hash and
--    emails no longer readable by other users.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND auth.uid() = auth_id);

REVOKE ALL ON public.users FROM anon;

REVOKE INSERT, UPDATE, DELETE, SELECT ON public.users FROM authenticated;

GRANT SELECT (
  id, username, fullname, profession, profile_image_url, created_at, updated_at, role, bio,
  referral_points, referred_by, referral_code, naija_points, display_name, auth_id, avatar_url,
  verified, onboarded, notifications_follows, notifications_reactions, notifications_comments,
  notifications_mentions, is_private, cover_url, location, website_url, quote, skills,
  impact_points, people_reached, people_trained, jobs_created, communities_impacted
) ON public.users TO authenticated;

GRANT INSERT (
  id, auth_id, email, username, fullname, profession, profile_image_url, bio, display_name, avatar_url
) ON public.users TO authenticated;

GRANT UPDATE (
  email, username, fullname, profession, profile_image_url, bio, display_name, avatar_url, onboarded,
  notifications_follows, notifications_reactions, notifications_comments, notifications_mentions,
  is_private, cover_url, location, website_url, quote, skills,
  people_reached, people_trained, jobs_created, communities_impacted, updated_at
) ON public.users TO authenticated;

GRANT DELETE ON public.users TO authenticated;

-- user_detail_view read users.email; recreate it to show email only to its owner.
-- It is a definer view on purpose (it needs users.email for the owner's own row);
-- every other column is public profile data and RLS on users is SELECT true anyway.
CREATE OR REPLACE VIEW public.user_detail_view
WITH (security_invoker = false) AS
SELECT u.id,
    CASE WHEN u.id = auth.uid() THEN u.email END AS email,
    u.username,
    u.fullname,
    u.profession,
    u.profile_image_url,
    u.role,
    u.created_at,
    u.updated_at,
    (EXISTS (SELECT 1 FROM verified_users vu WHERE vu.user_id = u.id)) AS is_verified,
    (SELECT count(*) FROM user_follows uf WHERE uf.follower_id = u.id) AS following_count,
    (SELECT count(*) FROM user_follows uf WHERE uf.following_id = u.id) AS followers_count,
    (SELECT count(*) FROM posts p WHERE p.user_id = u.id) AS post_count,
    (EXISTS (SELECT 1 FROM blocked_users bu WHERE bu.blocker_id = auth.uid() AND bu.blocked_id = u.id)) AS auth_user_blocked,
    (EXISTS (SELECT 1 FROM user_follows uf WHERE uf.follower_id = auth.uid() AND uf.following_id = u.id)) AS auth_user_is_following,
    u.bio,
    (EXISTS (SELECT 1 FROM cooperative_members cm WHERE cm.user_id = u.id)) AS is_cooperative_member,
    u.referral_points,
    u.referred_by,
    u.referral_code,
    u.naija_points,
    (SELECT t.tier FROM referral_tier_config t
      WHERE (SELECT count(*) FROM referrals r WHERE r.referrer_id = u.id) >= t.min_referrals
        AND (t.max_referrals IS NULL OR (SELECT count(*) FROM referrals r WHERE r.referrer_id = u.id) <= t.max_referrals)
      ORDER BY t.min_referrals DESC LIMIT 1) AS referral_tier,
    (SELECT count(*) FROM referrals r WHERE r.referrer_id = u.id) AS total_referrals
FROM users u;

ALTER VIEW public.user_detail_view SET (security_invoker = false);

REVOKE ALL ON public.user_detail_view FROM anon;

GRANT SELECT ON public.user_detail_view TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Wallet: no client writes at all. Wallets (with the ₦100 welcome bonus the
--    app has always given) are created server-side when a profile is created.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.user_wallet;

DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.user_wallet;

REVOKE INSERT, UPDATE, DELETE ON public.user_wallet FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_wallet (user_id, total, total_accumulated)
  VALUES (NEW.id, 100, 100)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_wallet_for_new_user ON public.users;

CREATE TRIGGER create_wallet_for_new_user
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_user();

INSERT INTO public.user_wallet (user_id, total, total_accumulated)
SELECT u.id, 100, 100 FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_wallet w WHERE w.user_id = u.id)
  AND EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Transactions: clients may only open a *pending* top-up or withdrawal
--    (confirmed by the Paystack webhook / withdraw Edge Function). Everything
--    else, including P2P transfers, goes through RPCs.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.transactions;

CREATE POLICY "Users can open pending topups and withdrawals" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND type::text IN ('topup', 'withdrawal')
    AND status::text = 'pending'
    AND amount > 0
  );

REVOKE UPDATE, DELETE ON public.transactions FROM anon, authenticated;

REVOKE INSERT ON public.transactions FROM anon;

CREATE OR REPLACE FUNCTION public.transfer_to_user(p_recipient_id uuid, p_amount double precision)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender uuid := auth.uid();
  v_ref text;
BEGIN
  IF v_sender IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than 0'; END IF;
  IF p_recipient_id IS NULL OR p_recipient_id = v_sender THEN RAISE EXCEPTION 'Invalid recipient'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_recipient_id) THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  v_ref := 'TRF_' || substring(gen_random_uuid()::text, 1, 12) || '_' || extract(epoch FROM now())::bigint;

  -- update_users_wallet() checks the balance and debits / credits.
  INSERT INTO public.transactions (user_id, amount, type, status, ref, other_user_id)
  VALUES (v_sender, p_amount, 'transfer', 'success', v_ref, p_recipient_id);
  INSERT INTO public.transactions (user_id, amount, type, status, ref, other_user_id)
  VALUES (p_recipient_id, p_amount, 'receive', 'success', v_ref || '_receive', v_sender);

  RETURN v_ref;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. purchase_course: price now comes from lms_courses, never the client.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purchase_course(p_course_id uuid, p_amount double precision)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id uuid := auth.uid();
  v_course record;
  v_reference text;
BEGIN
  IF v_buyer_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT id, user_id, amount, is_free INTO v_course FROM public.lms_courses WHERE id = p_course_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found'; END IF;
  IF v_course.user_id = v_buyer_id THEN RAISE EXCEPTION 'Cannot purchase your own course'; END IF;
  IF coalesce(v_course.is_free, false) OR coalesce(v_course.amount, 0) <= 0 THEN
    RAISE EXCEPTION 'This course is free - enrol directly';
  END IF;
  IF p_amount IS DISTINCT FROM v_course.amount THEN
    RAISE EXCEPTION 'The course price has changed. Please refresh and try again.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.lms_courses_enrollment WHERE user_id = v_buyer_id AND course_id = p_course_id) THEN
    RAISE EXCEPTION 'You are already enrolled in this course';
  END IF;

  v_reference := 'CP_' || substring(p_course_id::text, 1, 8) || '_' ||
                 extract(epoch FROM now())::bigint || '_' || substring(gen_random_uuid()::text, 1, 8);

  INSERT INTO public.transactions (user_id, amount, type, status, course_id, ref, other_user_id)
  VALUES (v_buyer_id, v_course.amount, 'course_purchase', 'success', p_course_id, v_reference, v_course.user_id);
  INSERT INTO public.transactions (user_id, amount, type, status, course_id, ref, other_user_id)
  VALUES (v_course.user_id, v_course.amount, 'course_sale', 'success', p_course_id, v_reference || '_sale', v_buyer_id);
  INSERT INTO public.lms_courses_enrollment (user_id, course_id, status)
  VALUES (v_buyer_id, p_course_id, 'enrolled')
  ON CONFLICT (user_id, course_id) DO NOTHING;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. LearnHub: direct enrolment only for free courses (or your own); paid
--    lesson videos/notes only for enrolled learners. A preview view keeps the
--    curriculum (titles/durations) visible on course pages.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can enroll themselves in courses" ON public.lms_courses_enrollment;

CREATE POLICY "Users can enroll themselves in free courses" ON public.lms_courses_enrollment
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.lms_courses c
      WHERE c.id = course_id
        AND (coalesce(c.is_free, false) OR coalesce(c.amount, 0) <= 0 OR c.user_id = auth.uid())
    )
  );

REVOKE UPDATE ON public.lms_courses_enrollment FROM anon, authenticated;

GRANT UPDATE (status, progress, last_lesson_id, updated_at) ON public.lms_courses_enrollment TO authenticated;

CREATE OR REPLACE FUNCTION public.can_access_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lms_courses c
    WHERE c.id = p_course_id
      AND (
        coalesce(c.is_free, false) OR coalesce(c.amount, 0) <= 0
        OR c.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.lms_courses_enrollment e WHERE e.course_id = c.id AND e.user_id = auth.uid())
        OR public.is_admin()
      )
  );
$$;

DROP POLICY IF EXISTS "lms_lessons_select" ON public.lms_lessons;

CREATE POLICY "lms_lessons_select_with_access" ON public.lms_lessons
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lms_modules m
    WHERE m.id = lms_lessons.module_id AND public.can_access_course(m.course_id)
  ));

CREATE OR REPLACE VIEW public.lms_curriculum_preview
WITH (security_invoker = false) AS
SELECT l.id, l.module_id, m.course_id, l.title, l.duration_seconds, l.sort_order, l.created_at
FROM public.lms_lessons l
JOIN public.lms_modules m ON m.id = l.module_id;

REVOKE ALL ON public.lms_curriculum_preview FROM anon;

GRANT SELECT ON public.lms_curriculum_preview TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. NaijaMarket: orders/escrow only via RPCs; sellers update fulfilment
--    status only; offers can only move along valid transitions.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "nm orders buyer insert" ON public.nm_orders;

DROP POLICY IF EXISTS "nm escrow buyer insert" ON public.nm_escrow;

DROP POLICY IF EXISTS "nm escrow update" ON public.nm_escrow;

DROP POLICY IF EXISTS "nm orders update" ON public.nm_orders;

DROP POLICY IF EXISTS "nm_orders_update" ON public.nm_orders;

DROP POLICY IF EXISTS "nm orders seller update" ON public.nm_orders;

CREATE POLICY "nm orders seller update" ON public.nm_orders
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nm_seller_profiles sp WHERE sp.id = nm_orders.seller_id AND sp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nm_seller_profiles sp WHERE sp.id = nm_orders.seller_id AND sp.user_id = auth.uid()));

REVOKE INSERT, UPDATE, DELETE ON public.nm_orders FROM anon, authenticated;

GRANT UPDATE (status, tracking_code, updated_at) ON public.nm_orders TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.nm_escrow FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_nm_order_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_caller() THEN RETURN NEW; END IF;
  -- Sellers move fulfilment forward; 'delivered' is set when the buyer releases escrow.
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
       (OLD.status::text = 'pending'   AND NEW.status::text IN ('confirmed', 'cancelled'))
    OR (OLD.status::text = 'confirmed' AND NEW.status::text IN ('packed', 'cancelled'))
    OR (OLD.status::text = 'packed'    AND NEW.status::text = 'shipped')
  ) THEN
    RAISE EXCEPTION 'Invalid order status change';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_nm_order_status ON public.nm_orders;

CREATE TRIGGER guard_nm_order_status BEFORE UPDATE ON public.nm_orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_nm_order_status();

REVOKE UPDATE ON public.nm_offers FROM anon, authenticated;

GRANT UPDATE (status, counter_price, counter_message, updated_at) ON public.nm_offers TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_nm_offer_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_caller() THEN RETURN NEW; END IF;
  IF OLD.status::text NOT IN ('pending', 'countered') THEN
    RAISE EXCEPTION 'This offer can no longer be changed';
  END IF;
  IF auth.uid() = OLD.seller_id THEN
    IF NEW.status::text NOT IN ('accepted', 'declined', 'countered') THEN
      RAISE EXCEPTION 'Sellers can accept, decline or counter';
    END IF;
  ELSIF auth.uid() = OLD.buyer_id THEN
    -- Buyers can withdraw, or accept a seller's counter-offer.
    IF NOT (NEW.status::text = 'cancelled'
            OR (OLD.status::text = 'countered' AND NEW.status::text = 'accepted')) THEN
      RAISE EXCEPTION 'Buyers can only withdraw an offer or accept a counter-offer';
    END IF;
    IF NEW.counter_price IS DISTINCT FROM OLD.counter_price OR NEW.counter_message IS DISTINCT FROM OLD.counter_message THEN
      RAISE EXCEPTION 'Only the seller can counter';
    END IF;
  ELSE
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_nm_offer_update ON public.nm_offers;

CREATE TRIGGER guard_nm_offer_update BEFORE UPDATE ON public.nm_offers
  FOR EACH ROW EXECUTE FUNCTION public.guard_nm_offer_update();

-- ---------------------------------------------------------------------------
-- 7. Crowdfunding: contributions only via contribute_to_funding_with_wallet
--    (or the service-role Paystack webhook); campaigns only as yourself.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own funding transactions" ON public.funding_transactions;

DROP POLICY IF EXISTS "Users can insert own funding transactions" ON public.funding_transactions;

DROP POLICY IF EXISTS "funding_transactions_insert" ON public.funding_transactions;

REVOKE INSERT, UPDATE, DELETE ON public.funding_transactions FROM anon, authenticated;

DROP POLICY IF EXISTS "funding_insert" ON public.funding;

-- ---------------------------------------------------------------------------
-- 8. Savings, loans, insurance, Ajo, KYC, TradeCred, points: client may only
--    write descriptive columns; balances/statuses/scores are server-owned.
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON
  public.fintech_safe_flexible_transactions,
  public.fintech_credit_loans,
  public.fintech_credit_repayments,
  public.fintech_insure_policies,
  public.fintech_insure_premium_payments,
  public.fintech_ajo_contributions,
  public.fintech_ajo_payout_schedule,
  public.fintech_tradecred_scores,
  public.fintech_tradecred_activity_logs,
  public.fintech_risk_assessments,
  public.naija_points_log,
  public.points_redemptions,
  public.referrals,
  public.cooperative_dues
FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.fintech_safe_flexible_accounts FROM anon, authenticated;

GRANT INSERT (user_id, title) ON public.fintech_safe_flexible_accounts TO authenticated;

GRANT UPDATE (title, updated_at) ON public.fintech_safe_flexible_accounts TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.fintech_safe_goal_savings FROM anon, authenticated;

GRANT INSERT (user_id, title, target_amount, target_date) ON public.fintech_safe_goal_savings TO authenticated;

GRANT UPDATE (title, target_amount, target_date, updated_at) ON public.fintech_safe_goal_savings TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.fintech_safe_locked_savings FROM anon, authenticated;

GRANT INSERT (user_id, title, target_amount, matures_at) ON public.fintech_safe_locked_savings TO authenticated;

GRANT UPDATE (title, updated_at) ON public.fintech_safe_locked_savings TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.fintech_credit_loan_applications FROM anon, authenticated;

GRANT INSERT (user_id, loan_product_id, requested_amount, digital_agreement_url) ON public.fintech_credit_loan_applications TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.fintech_insure_claims FROM anon, authenticated;

GRANT INSERT (user_id, policy_id, claim_reference, summary, details) ON public.fintech_insure_claims TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.fintech_kyc_profiles FROM anon, authenticated;

GRANT INSERT (user_id, bvn_last4, document_type, document_url) ON public.fintech_kyc_profiles TO authenticated;

GRANT UPDATE (bvn_last4, document_type, document_url, updated_at) ON public.fintech_kyc_profiles TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.fintech_ajo_groups FROM anon, authenticated;

GRANT INSERT (name, description, creator_id, contribution_amount, payout_frequency, grace_period_hours,
              max_members, rotation_is_transparent) ON public.fintech_ajo_groups TO authenticated;

GRANT UPDATE (name, description, updated_at) ON public.fintech_ajo_groups TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.fintech_ajo_group_members FROM anon, authenticated;

GRANT INSERT (group_id, user_id, accepted_terms) ON public.fintech_ajo_group_members TO authenticated;

GRANT UPDATE (accepted_terms, updated_at) ON public.fintech_ajo_group_members TO authenticated;

-- Server assigns rotation position / flags when a member joins from the app.
-- The trigger runs as the caller (so RPC inserts, running as postgres, keep
-- their own values); the capacity lookup needs to see every member row.
CREATE OR REPLACE FUNCTION public.ajo_group_capacity(p_group_id uuid, OUT max_members integer, OUT member_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.max_members, (SELECT count(*)::int FROM public.fintech_ajo_group_members m WHERE m.group_id = g.id)
  FROM public.fintech_ajo_groups g WHERE g.id = p_group_id;
$$;

CREATE OR REPLACE FUNCTION public.ajo_member_join_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_cap record;
BEGIN
  IF public.is_trusted_caller() THEN RETURN NEW; END IF;
  SELECT * INTO v_cap FROM public.ajo_group_capacity(NEW.group_id);
  IF v_cap.max_members IS NOT NULL AND v_cap.member_count >= v_cap.max_members THEN
    RAISE EXCEPTION 'This Ajo group is full';
  END IF;
  NEW.payout_position := coalesce(v_cap.member_count, 0) + 1;
  NEW.kyc_verified := false;
  NEW.first_contribution_paid := false;
  NEW.is_active := false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ajo_member_join_defaults ON public.fintech_ajo_group_members;

CREATE TRIGGER ajo_member_join_defaults BEFORE INSERT ON public.fintech_ajo_group_members
  FOR EACH ROW EXECUTE FUNCTION public.ajo_member_join_defaults();

REVOKE INSERT, UPDATE, DELETE ON public.cac_applications FROM anon, authenticated;

GRANT INSERT (user_id, business_id, proposed_name_1, proposed_name_2, business_nature, proprietor_full_name,
              proprietor_nin, proprietor_phone, business_address, business_city, business_state)
  ON public.cac_applications TO authenticated;

GRANT UPDATE (proposed_name_1, proposed_name_2, business_nature, proprietor_full_name, proprietor_nin,
              proprietor_phone, business_address, business_city, business_state, updated_at)
  ON public.cac_applications TO authenticated;

-- Notifications are created by triggers/Edge Functions; users only mark them read.
DROP POLICY IF EXISTS "System/service role can insert notifications" ON public.notifications;

REVOKE INSERT, DELETE ON public.notifications FROM anon, authenticated;

REVOKE UPDATE ON public.notifications FROM anon, authenticated;

GRANT UPDATE (read, status, updated_at) ON public.notifications TO authenticated;

-- Shared category lists: anyone signed in may add, nobody may rename/delete.
DROP POLICY IF EXISTS "Authenticated users can update funding categories" ON public.funding_categories;

DROP POLICY IF EXISTS "Authenticated users can update services categories" ON public.services_categories;

DROP POLICY IF EXISTS "Authenticated users can update LMS courses categories" ON public.lms_courses_categories;

REVOKE UPDATE, DELETE ON public.funding_categories, public.services_categories, public.lms_courses_categories FROM anon, authenticated;

-- Every user's credit score / loan limit / savings balance was readable by anyone.
DO $$
DECLARE v_def text;
BEGIN
  v_def := rtrim(pg_get_viewdef('public.fintech_user_dashboard_view'::regclass), E' ;\n');
  IF v_def !~* 'auth\.uid\(\)' THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.fintech_user_dashboard_view AS ' || v_def
         || ' WHERE (u.id = auth.uid() OR public.is_admin())';
  END IF;
END $$;

REVOKE ALL ON public.fintech_user_dashboard_view, public.fintech_my_dashboard, public.ajo_member_standing_view,
               public.learnhub_dashboard_metrics_view FROM anon;

-- ---------------------------------------------------------------------------
-- 9. RPC fixes
-- ---------------------------------------------------------------------------
-- Negative points used to *add* points.
CREATE OR REPLACE FUNCTION public.redeem_naija_points(p_points integer, p_redemption_type text, p_amount_ngn numeric DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_pts integer;
  redemption_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_points IS NULL OR p_points <= 0 THEN RAISE EXCEPTION 'Points must be greater than 0'; END IF;
  IF p_amount_ngn IS NOT NULL AND p_amount_ngn < 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT naija_points INTO current_pts FROM public.users WHERE id = auth.uid() FOR UPDATE;
  IF coalesce(current_pts, 0) < p_points THEN RAISE EXCEPTION 'Insufficient NaijaPoints'; END IF;

  UPDATE public.users SET naija_points = naija_points - p_points WHERE id = auth.uid();
  INSERT INTO public.points_redemptions (user_id, points_used, redemption_type, amount_ngn, status)
  VALUES (auth.uid(), p_points, p_redemption_type, p_amount_ngn, 'pending')
  RETURNING id INTO redemption_id;
  RETURN redemption_id;
END;
$$;

-- PIN functions took any user id: anyone could reset or brute-force anyone's PIN.
-- assert_self is called from SECURITY DEFINER wrappers (where current_user is
-- always postgres), so it decides on the JWT, not current_user.
CREATE OR REPLACE FUNCTION public.assert_self(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN RETURN; END IF;
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
END;
$$;

-- Wrap the existing bodies: rename originals, expose checked versions under the
-- same names/signatures the apps already call.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = '_unsafe_has_user_pin') THEN
    ALTER FUNCTION public.has_user_pin(uuid) RENAME TO _unsafe_has_user_pin;
    ALTER FUNCTION public.upsert_user_pin(uuid, text) RENAME TO _unsafe_upsert_user_pin;
    ALTER FUNCTION public.verify_user_pin(uuid, text) RENAME TO _unsafe_verify_user_pin;
    ALTER FUNCTION public.get_creator_analytics(uuid) RENAME TO _unsafe_get_creator_analytics;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public._unsafe_has_user_pin(uuid), public._unsafe_upsert_user_pin(uuid, text),
  public._unsafe_verify_user_pin(uuid, text), public._unsafe_get_creator_analytics(uuid)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.has_user_pin(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN PERFORM public.assert_self(p_user_id); RETURN public._unsafe_has_user_pin(p_user_id); END; $$;

CREATE OR REPLACE FUNCTION public.upsert_user_pin(p_user_id uuid, p_pin text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  PERFORM public.assert_self(p_user_id);
  IF p_pin IS NULL OR p_pin !~ '^[0-9]{4,6}$' THEN RAISE EXCEPTION 'PIN must be 4-6 digits'; END IF;
  PERFORM public._unsafe_upsert_user_pin(p_user_id, p_pin);
END; $$;

CREATE OR REPLACE FUNCTION public.verify_user_pin(p_user_id uuid, p_pin text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN PERFORM public.assert_self(p_user_id); RETURN public._unsafe_verify_user_pin(p_user_id, p_pin); END; $$;

CREATE OR REPLACE FUNCTION public.get_creator_analytics(p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.assert_self(p_user_id); RETURN public._unsafe_get_creator_analytics(p_user_id); END; $$;

-- PIN hashes: credentials stays own-row; the legacy users.wallet_pin column is
-- no longer selectable (see section 1).

-- Internal-only functions (points awards, scoring, cron jobs): no client access.
REVOKE EXECUTE ON FUNCTION
  public.award_coins(uuid, integer, text),
  public.award_naija_points(uuid, text, integer, text),
  public.award_xp(uuid, text, integer, text),
  public.fintech_recalculate_tradecred(uuid),
  public.create_welcome_notification(uuid),
  public.ajo_generate_schedule(uuid),
  public.ajo_run_enforcement_cycle(),
  public.ajo_flag_overdue_contributions(),
  public.ajo_close_completed_groups(),
  public.recalculate_skill_score(uuid)
FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10. Jobs: job_applications references public.jobs, but apply_to_job checked
--     learnhub_employer_postings and wrote a non-existent column, and
--     job_detail_view did not exist.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.job_detail_view
WITH (security_invoker = true) AS
SELECT
  j.*,
  u.fullname AS employer_fullname,
  u.username AS employer_username,
  u.profile_image_url AS employer_profile_image_url,
  (EXISTS (SELECT 1 FROM public.verified_users vu WHERE vu.user_id = j.employer_id)) AS employer_is_verified,
  (EXISTS (SELECT 1 FROM public.saved_jobs s WHERE s.job_id = j.id AND s.user_id = auth.uid())) AS is_saved,
  (EXISTS (SELECT 1 FROM public.job_applications a WHERE a.job_id = j.id AND a.applicant_id = auth.uid())) AS has_applied
FROM public.jobs j
LEFT JOIN public.users u ON u.id = j.employer_id;

REVOKE ALL ON public.job_detail_view FROM anon;

GRANT SELECT ON public.job_detail_view TO authenticated;

ALTER TABLE public.saved_jobs DROP CONSTRAINT IF EXISTS saved_jobs_job_id_fkey;

ALTER TABLE public.saved_jobs
  ADD CONSTRAINT saved_jobs_job_id_fkey FOREIGN KEY (job_id)
  REFERENCES public.jobs(id) ON DELETE CASCADE NOT VALID;

-- Counters are server-maintained.
REVOKE UPDATE ON public.jobs FROM anon, authenticated;

GRANT UPDATE (title, company_name, company_logo_url, category, job_type, workplace_type, location_state,
              location_city, salary_min, salary_max, salary_currency, salary_period, is_salary_negotiable,
              description, requirements, responsibilities, benefits, tags, application_url,
              application_deadline, status, updated_at) ON public.jobs TO authenticated;

REVOKE UPDATE ON public.job_applications FROM anon, authenticated;

GRANT UPDATE (status, employer_notes, updated_at) ON public.job_applications TO authenticated;

-- Applications go through apply_to_job.
REVOKE INSERT ON public.job_applications FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.apply_to_job(
  p_job_id uuid,
  p_cover_note text DEFAULT NULL,
  p_resume_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_user record;
  v_job record;
  v_application_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT id, employer_id, status, application_deadline INTO v_job FROM public.jobs WHERE id = p_job_id;
  IF NOT FOUND OR v_job.status <> 'active' THEN
    RAISE EXCEPTION 'Job not found or no longer accepting applications';
  END IF;
  IF v_job.application_deadline IS NOT NULL AND v_job.application_deadline < now() THEN
    RAISE EXCEPTION 'The application deadline has passed';
  END IF;
  IF v_job.employer_id = v_uid THEN RAISE EXCEPTION 'You cannot apply to your own job'; END IF;
  IF EXISTS (SELECT 1 FROM public.job_applications WHERE job_id = p_job_id AND applicant_id = v_uid) THEN
    RAISE EXCEPTION 'You have already applied to this job';
  END IF;

  SELECT fullname, email INTO v_user FROM public.users WHERE id = v_uid;
  IF v_user.email IS NULL THEN RAISE EXCEPTION 'Complete your profile before applying'; END IF;

  INSERT INTO public.job_applications (job_id, applicant_id, full_name, email, cover_letter, resume_url)
  VALUES (p_job_id, v_uid, coalesce(v_user.fullname, ''), v_user.email, p_cover_note, p_resume_url)
  RETURNING id INTO v_application_id;

  UPDATE public.jobs SET applications_count = coalesce(applications_count, 0) + 1 WHERE id = p_job_id;
  RETURN v_application_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 11. Artisans: price derived from the lowest pricing tier (was hard-coded 0).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.service_details_view AS
SELECT s.id,
    s.user_id,
    s.cover_image_url AS image_url,
    s.title,
    s.description,
    coalesce((
      SELECT min((t ->> 'price')::numeric)
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(s.pricing_tiers) = 'array' THEN s.pricing_tiers ELSE '[]'::jsonb END) t
      WHERE (t ->> 'price') ~ '^[0-9]+(\.[0-9]+)?$'
    ), 0.0) AS price,
    s.category_id,
    s.phone_number,
    s.email,
    s.address,
    s.created_at,
    s.updated_at,
    sc.name AS category_name,
    sc.service_type AS category_type,
    u.fullname AS user_fullname,
    u.profile_image_url AS user_profile_image_url,
    (EXISTS (SELECT 1 FROM verified_users vu WHERE vu.user_id = u.id)) AS user_is_verified,
    (SELECT count(*)::integer FROM service_views sv WHERE sv.service_id = s.id) AS views_count,
    (SELECT count(*)::integer FROM service_reviews sr WHERE sr.service_id = s.id) AS review_count,
    (SELECT coalesce(avg(sr.rating), 0.0) FROM service_reviews sr WHERE sr.service_id = s.id) AS average_rating,
    u.profession AS user_profession
FROM services s
JOIN users u ON u.id = s.user_id
LEFT JOIN services_categories sc ON sc.id = s.category_id;

-- ---------------------------------------------------------------------------
-- 12. Defence in depth for every SECURITY DEFINER function in public:
--     no anonymous execution, and a pinned search_path.
-- ---------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname, p.proconfig, p.prorettype = 'trigger'::regtype AS is_trigger
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.prokind = 'f'
  LOOP
    -- anon inherits from PUBLIC, so revoke there; keep signed-in access except
    -- for the internal-only functions revoked above. Trigger functions are
    -- never called directly.
    IF NOT r.is_trigger THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
      IF r.proname NOT IN ('award_coins', 'award_naija_points', 'award_xp', 'fintech_recalculate_tradecred',
                           'create_welcome_notification', 'ajo_generate_schedule', 'ajo_run_enforcement_cycle',
                           'ajo_flag_overdue_contributions', 'ajo_close_completed_groups', 'recalculate_skill_score')
         AND r.proname NOT LIKE '\_unsafe\_%' THEN
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
      END IF;
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
    END IF;
    IF r.proconfig IS NULL OR NOT EXISTS (SELECT 1 FROM unnest(r.proconfig) c WHERE c LIKE 'search_path=%') THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', r.sig);
    END IF;
  END LOOP;
END $$;
