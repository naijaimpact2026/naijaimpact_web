-- ============================================================================
-- 1. Atomic wallet operations (no read-then-write races / double spends).
-- 2. Postgres-backed rate limiter shared by the web app and Edge Functions.
-- 3. Storage: only an object's owner can overwrite/delete it; size/type limits.
-- (Hiding users.email ships separately in 20261019130000, after the web deploy.)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1a. One ledger row per (ref, type): makes every credit idempotent.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS transactions_ref_type_key
  ON public.transactions (ref, type) WHERE ref IS NOT NULL;

-- 1b. The shared ledger trigger checked `total` and then updated it in two
--     steps; concurrent debits could both pass the check. Do it in one UPDATE.
CREATE OR REPLACE FUNCTION public.update_users_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.type IN ('topup', 'receive', 'course_sale') AND NEW.status = 'success' THEN
    INSERT INTO public.user_wallet (user_id, total, total_accumulated)
    VALUES (NEW.user_id, NEW.amount, NEW.amount)
    ON CONFLICT (user_id) DO UPDATE
      SET total = coalesce(public.user_wallet.total, 0) + EXCLUDED.total,
          total_accumulated = coalesce(public.user_wallet.total_accumulated, 0) + EXCLUDED.total_accumulated;
  ELSIF NEW.type IN ('withdrawal', 'transfer', 'gift', 'course_purchase') AND NEW.status = 'success' THEN
    UPDATE public.user_wallet SET total = total - NEW.amount
    WHERE user_id = NEW.user_id AND total >= NEW.amount;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient funds for %', NEW.type;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 1c. Web wallet (user_wallet.balance) primitives — service_role only; the web
--     server actions authenticate the user and pass their id.

-- Credit once per (ref, type). Returns 'credited' or 'already_credited'.
CREATE OR REPLACE FUNCTION public.web_wallet_credit(
  p_user_id uuid, p_amount double precision, p_type text, p_ref text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than 0'; END IF;
  IF p_ref IS NULL OR p_ref = '' THEN RAISE EXCEPTION 'Reference required'; END IF;
  IF p_type IN ('topup', 'receive', 'course_sale', 'withdrawal', 'transfer', 'gift', 'course_purchase') THEN
    RAISE EXCEPTION 'Type % belongs to the app wallet ledger', p_type;
  END IF;

  INSERT INTO public.transactions (user_id, amount, type, status, ref)
  VALUES (p_user_id, p_amount, p_type::public.transaction_type, 'success', p_ref)
  ON CONFLICT (ref, type) WHERE ref IS NOT NULL DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RETURN 'already_credited'; END IF;

  INSERT INTO public.user_wallet (user_id, balance) VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = coalesce(public.user_wallet.balance, 0) + EXCLUDED.balance;
  RETURN 'credited';
END;
$$;

-- Debit atomically (fails if the balance is too low) and record it.
-- Returns the new balance.
CREATE OR REPLACE FUNCTION public.web_wallet_debit(
  p_user_id uuid, p_amount double precision, p_type text, p_ref text, p_status text DEFAULT 'success',
  p_bank_name text DEFAULT NULL, p_account_number text DEFAULT NULL, p_account_name text DEFAULT NULL
)
RETURNS double precision
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_balance double precision;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than 0'; END IF;
  IF p_ref IS NULL OR p_ref = '' THEN RAISE EXCEPTION 'Reference required'; END IF;
  -- 'withdrawal' is allowed only as pending (the app-wallet trigger acts on success rows).
  IF p_type IN ('topup', 'receive', 'course_sale', 'transfer', 'gift', 'course_purchase')
     OR (p_type = 'withdrawal' AND p_status <> 'pending') THEN
    RAISE EXCEPTION 'Type % belongs to the app wallet ledger', p_type;
  END IF;

  UPDATE public.user_wallet SET balance = balance - p_amount
  WHERE user_id = p_user_id AND coalesce(balance, 0) >= p_amount
  RETURNING balance INTO v_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  INSERT INTO public.transactions (user_id, amount, type, status, ref, bank_name, account_number, account_name)
  VALUES (p_user_id, p_amount, p_type::public.transaction_type, p_status::public.transaction_status, p_ref,
          p_bank_name, p_account_number, p_account_name);
  RETURN v_balance;
END;
$$;

-- Move money between two web wallets in one transaction. Returns the
-- sender's new balance.
CREATE OR REPLACE FUNCTION public.web_wallet_transfer(
  p_sender uuid, p_recipient uuid, p_amount double precision, p_ref text
)
RETURNS double precision
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_balance double precision;
BEGIN
  IF p_sender = p_recipient THEN RAISE EXCEPTION 'You cannot send funds to yourself'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_recipient) THEN RAISE EXCEPTION 'Recipient not found'; END IF;
  v_balance := public.web_wallet_debit(p_sender, p_amount, 'transfer_debit', p_ref);

  INSERT INTO public.user_wallet (user_id, balance) VALUES (p_recipient, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = coalesce(public.user_wallet.balance, 0) + EXCLUDED.balance;
  INSERT INTO public.transactions (user_id, amount, type, status, ref, other_user_id)
  VALUES (p_recipient, p_amount, 'transfer_credit', 'success', p_ref, p_sender);
  UPDATE public.transactions SET other_user_id = p_recipient
  WHERE ref = p_ref AND type = 'transfer_debit'::public.transaction_type;
  RETURN v_balance;
END;
$$;

-- Put back a debit whose follow-up step failed (e.g. a donation row).
CREATE OR REPLACE FUNCTION public.web_wallet_refund(p_ref text, p_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tx record;
BEGIN
  UPDATE public.transactions SET status = 'reversed'
  WHERE ref = p_ref AND type = p_type::public.transaction_type AND status IN ('success', 'pending')
  RETURNING user_id, amount INTO v_tx;
  IF FOUND THEN
    UPDATE public.user_wallet SET balance = coalesce(balance, 0) + v_tx.amount WHERE user_id = v_tx.user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION
  public.web_wallet_credit(uuid, double precision, text, text),
  public.web_wallet_debit(uuid, double precision, text, text, text, text, text, text),
  public.web_wallet_transfer(uuid, uuid, double precision, text),
  public.web_wallet_refund(text, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.web_wallet_credit(uuid, double precision, text, text),
  public.web_wallet_debit(uuid, double precision, text, text, text, text, text, text),
  public.web_wallet_transfer(uuid, uuid, double precision, text),
  public.web_wallet_refund(text, text)
TO service_role;

-- ---------------------------------------------------------------------------
-- 1d. Crowdfunding: one donation row per payment reference, and campaign
--     payouts tracked in a real table (the web looked for funding_payouts,
--     which didn't exist, so "already withdrawn" was always 0).
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS funding_transactions_reference_key
  ON public.funding_transactions (reference) WHERE reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.funding_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_id uuid NOT NULL REFERENCES public.funding(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount double precision NOT NULL CHECK (amount > 0),
  destination text NOT NULL CHECK (destination IN ('wallet', 'bank')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference text NOT NULL UNIQUE,
  bank_name text,
  account_number text,
  account_name text,
  bank_code text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS funding_payouts_funding_id_idx ON public.funding_payouts (funding_id);

ALTER TABLE public.funding_payouts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.funding_payouts FROM anon, authenticated;

GRANT SELECT ON public.funding_payouts TO authenticated;

DROP POLICY IF EXISTS "funding payouts owner read" ON public.funding_payouts;

CREATE POLICY "funding payouts owner read" ON public.funding_payouts
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- Withdraw raised funds, serialised per campaign. Returns the payout reference.
CREATE OR REPLACE FUNCTION public.funding_withdraw(
  p_user_id uuid, p_funding_id uuid, p_amount double precision, p_destination text,
  p_bank_name text DEFAULT NULL, p_account_number text DEFAULT NULL,
  p_account_name text DEFAULT NULL, p_bank_code text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign record;
  v_raised double precision;
  v_withdrawn double precision;
  v_ref text;
BEGIN
  IF p_amount IS NULL OR p_amount < 100 THEN RAISE EXCEPTION 'Minimum withdrawal amount is ₦100'; END IF;
  IF p_destination NOT IN ('wallet', 'bank') THEN RAISE EXCEPTION 'Invalid destination'; END IF;

  SELECT id, user_id, title INTO v_campaign FROM public.funding WHERE id = p_funding_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF v_campaign.user_id <> p_user_id THEN RAISE EXCEPTION 'Only the campaign creator can withdraw funds'; END IF;

  SELECT coalesce(sum(amount), 0) INTO v_raised FROM public.funding_transactions
  WHERE funding_id = p_funding_id AND transaction_status = 'success';
  SELECT coalesce(sum(amount), 0) INTO v_withdrawn FROM public.funding_payouts
  WHERE funding_id = p_funding_id AND status IN ('pending', 'completed');
  IF p_amount > v_raised - v_withdrawn THEN
    RAISE EXCEPTION 'Withdrawal exceeds the available campaign balance of ₦%', round((v_raised - v_withdrawn)::numeric, 2);
  END IF;

  v_ref := 'CPAY-' || upper(p_destination) || '-' || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public.funding_payouts (funding_id, user_id, amount, destination, status, reference,
                                      bank_name, account_number, account_name, bank_code, notes)
  VALUES (p_funding_id, p_user_id, p_amount, p_destination,
          CASE WHEN p_destination = 'wallet' THEN 'completed' ELSE 'pending' END, v_ref,
          p_bank_name, p_account_number, p_account_name, p_bank_code,
          CASE WHEN p_destination = 'wallet' THEN 'Withdrawn to wallet: ' ELSE 'Bank withdrawal: ' END || v_campaign.title);

  IF p_destination = 'wallet' THEN
    PERFORM public.web_wallet_credit(p_user_id, p_amount, 'campaign_payout', v_ref);
  ELSE
    INSERT INTO public.transactions (user_id, amount, type, status, ref, bank_name, account_number, account_name, bank_code)
    VALUES (p_user_id, p_amount, 'withdrawal', 'pending', v_ref, p_bank_name, p_account_number, p_account_name, p_bank_code);
  END IF;
  RETURN v_ref;
END;
$$;

REVOKE ALL ON FUNCTION public.funding_withdraw(uuid, uuid, double precision, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.funding_withdraw(uuid, uuid, double precision, text, text, text, text, text)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 2. Rate limiting (fixed window). No client access to the table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;

-- Count a hit; true while the caller is within p_max hits per p_window_seconds.
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window timestamptz := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
BEGIN
  INSERT INTO public.rate_limits (key, window_start, hits) VALUES (p_key, v_window, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET hits = public.rate_limits.hits + 1
  RETURNING hits INTO v_hits;
  RETURN v_hits <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO service_role;

-- For SECURITY DEFINER RPCs the apps call directly: limit the signed-in user.
CREATE OR REPLACE FUNCTION public.assert_rate_limit(p_action text, p_max integer, p_window_seconds integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.rate_limit_hit(p_action || ':' || coalesce(auth.uid()::text, 'anon'), p_max, p_window_seconds) THEN
    RAISE EXCEPTION 'Too many requests. Please slow down and try again shortly.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;

-- Hourly cleanup of old windows.
SELECT cron.unschedule('rate-limits-cleanup') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rate-limits-cleanup');

SELECT cron.schedule('rate-limits-cleanup', '17 * * * *',
  $$DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day'$$);

-- Limit app-to-app transfers and PIN changes (on top of the PIN lockout).
CREATE OR REPLACE FUNCTION public.transfer_to_user(p_recipient_id uuid, p_amount double precision, p_pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sender uuid := auth.uid();
  v_status text;
  v_ref text;
BEGIN
  IF v_sender IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM public.assert_rate_limit('transfer', 10, 600);
  v_status := public.pin_check(v_sender, p_pin);
  IF v_status = 'no_pin' THEN RAISE EXCEPTION 'Set a wallet PIN first'; END IF;
  IF v_status = 'locked' THEN RAISE EXCEPTION 'Too many wrong attempts. Try again in 15 minutes.'; END IF;
  IF v_status <> 'ok' THEN RAISE EXCEPTION 'Incorrect PIN'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than 0'; END IF;
  IF p_recipient_id IS NULL OR p_recipient_id = v_sender THEN RAISE EXCEPTION 'Invalid recipient'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_recipient_id) THEN RAISE EXCEPTION 'Recipient not found'; END IF;

  v_ref := 'TRF_' || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public.transactions (user_id, amount, type, status, ref, other_user_id)
  VALUES (v_sender, p_amount, 'transfer', 'success', v_ref, p_recipient_id);
  INSERT INTO public.transactions (user_id, amount, type, status, ref, other_user_id)
  VALUES (p_recipient_id, p_amount, 'receive', 'success', v_ref || '_receive', v_sender);
  RETURN v_ref;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_user_pin(p_current_pin text, p_new_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_status text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM public.assert_rate_limit('pin_change', 5, 900);
  v_status := public.pin_set(auth.uid(), p_new_pin, p_current_pin);
  IF v_status = 'locked' THEN RAISE EXCEPTION 'Too many wrong attempts. Try again in 15 minutes.'; END IF;
  IF v_status <> 'ok' THEN RAISE EXCEPTION 'Current PIN is incorrect'; END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Storage: anyone signed in could overwrite or delete ANY file.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ps738_0" ON storage.objects;

DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ps738_1" ON storage.objects;

DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ps738_2" ON storage.objects;

DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ps738_3" ON storage.objects;

CREATE POLICY "media upload by signed-in users" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "media update by owner" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND owner_id = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'media' AND owner_id = (SELECT auth.uid())::text);

CREATE POLICY "media delete by owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND owner_id = (SELECT auth.uid())::text);

-- "Public read access" (SELECT, bucket media) stays: the bucket is public.

UPDATE storage.buckets
SET file_size_limit = 100 * 1024 * 1024,
    allowed_mime_types = ARRAY['image/*', 'video/*']
WHERE id = 'media';
