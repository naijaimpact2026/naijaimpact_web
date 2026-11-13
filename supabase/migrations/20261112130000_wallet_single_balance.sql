-- ============================================================================
-- One wallet balance (2026-11-12)
--
-- user_wallet had two balance columns: the old app wallet (Flutter / mobile /
-- the `wallet` Edge Function) used `total`; the web uses `balance`. From now
-- on `balance` is the only balance. The mobile app moves to the web REST API
-- (/api/wallet/*), so there is one Paystack key, one webhook and one balance.
--
--   1. Cancel the three stale pending rows in the old ledger so nothing can
--      ever pay them out.
--   2. Move every `total` into `balance` (dev data: 28 wallets, ₦2,900, all
--      ₦100 welcome bonuses plus one ₦100 credit), then zero `total`.
--   3. Point every function that still wrote `total` at `balance`:
--        create_wallet_for_new_user (₦100 welcome bonus, trigger on users)
--        update_users_wallet        (old-ledger trigger: topup / receive /
--                                    course_sale / withdrawal / transfer /
--                                    gift / course_purchase rows)
--        wallet_credit_topup, wallet_begin_withdrawal, wallet_fail_withdrawal,
--        wallet_reverse_topup        (only the `wallet` Edge Function; drop
--                                    them once mobile is on /api/wallet)
--   4. CHECK (total = 0): anything that still writes `total` now fails loudly
--      instead of putting money where nobody can see it.
--   5. Warn about any other function that still mentions user_wallet.total
--      (functions that exist only in the live database).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Stale pending rows → failed (failed = never paid out, never re-credited:
--    wallet_complete_withdrawal / wallet_credit_topup only act on 'pending',
--    and wallet_fail_withdrawal treats 'failed' as already refunded).
--    • ₦100 withdrawal, 2026-03-21  (WD_1774118068341_…)
--    • ₦53,750 withdrawal, 2026-10-02 (WTH-1790941093568-JDZA)
--    • ₦1,000 top-up, 2026-11-12    (TUP_8bf5f32f7abb450e9dc984a3450d8ea2)
-- ---------------------------------------------------------------------------
UPDATE public.transactions
SET status = 'failed'
WHERE status = 'pending'
  AND id IN (
    '456f1221-eef7-474c-b5fe-d0630c9e672d',
    '9ea16289-6bf6-4bb1-b3c9-f9ed2f1d6e9d',
    '55e05317-e421-46b3-aee5-c1a08f218775'
  );

-- ---------------------------------------------------------------------------
-- 2. total → balance
-- ---------------------------------------------------------------------------
UPDATE public.user_wallet
SET balance = coalesce(balance, 0) + coalesce(total, 0),
    total = 0
WHERE coalesce(total, 0) <> 0;

UPDATE public.user_wallet SET total = 0 WHERE total IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Writers of `total` → `balance` (same signatures and return values)
-- ---------------------------------------------------------------------------

-- New users still get the ₦100 welcome bonus the app has always given.
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_wallet (user_id, balance, total_accumulated)
  VALUES (NEW.id, 100, 100)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Old-ledger trigger (rows written by transfer_to_user, the Edge Function and
-- old app builds). Same rules as before, on `balance`.
CREATE OR REPLACE FUNCTION public.update_users_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.type IN ('topup', 'receive', 'course_sale') AND NEW.status = 'success' THEN
    INSERT INTO public.user_wallet (user_id, balance, total_accumulated)
    VALUES (NEW.user_id, NEW.amount, NEW.amount)
    ON CONFLICT (user_id) DO UPDATE
      SET balance = coalesce(public.user_wallet.balance, 0) + EXCLUDED.balance,
          total_accumulated = coalesce(public.user_wallet.total_accumulated, 0) + EXCLUDED.total_accumulated;
  ELSIF NEW.type IN ('withdrawal', 'transfer', 'gift', 'course_purchase') AND NEW.status = 'success' THEN
    UPDATE public.user_wallet SET balance = balance - NEW.amount
    WHERE user_id = NEW.user_id AND coalesce(balance, 0) >= NEW.amount;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient funds for %', NEW.type;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_credit_topup(p_ref text, p_amount_paid numeric)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx record;
BEGIN
  SELECT id, user_id, amount, status::text AS status INTO v_tx
  FROM public.transactions WHERE ref = p_ref AND type::text = 'topup' FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_tx.status = 'success' THEN RETURN 'already_credited'; END IF;
  IF v_tx.status <> 'pending' THEN RETURN 'not_pending'; END IF;
  IF p_amount_paid IS NULL OR p_amount_paid < v_tx.amount THEN
    UPDATE public.transactions SET status = 'failed' WHERE id = v_tx.id;
    RETURN 'amount_mismatch';
  END IF;

  UPDATE public.transactions SET status = 'success' WHERE id = v_tx.id;
  INSERT INTO public.user_wallet (user_id, balance, total_accumulated)
  VALUES (v_tx.user_id, v_tx.amount, v_tx.amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = coalesce(public.user_wallet.balance, 0) + EXCLUDED.balance,
        total_accumulated = coalesce(public.user_wallet.total_accumulated, 0) + EXCLUDED.total_accumulated;
  RETURN 'credited';
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_begin_withdrawal(
  p_user_id uuid,
  p_amount double precision,
  p_bank_code text,
  p_bank_name text,
  p_account_number text,
  p_account_name text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref text;
BEGIN
  IF p_amount IS NULL OR p_amount < 100 THEN RAISE EXCEPTION 'Minimum withdrawal is ₦100'; END IF;

  UPDATE public.user_wallet SET balance = balance - p_amount
  WHERE user_id = p_user_id AND coalesce(balance, 0) >= p_amount;
  IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  v_ref := 'WDR_' || replace(gen_random_uuid()::text, '-', '');
  -- 'pending' rows are ignored by update_users_wallet(), so this is the only debit.
  INSERT INTO public.transactions (user_id, amount, type, status, ref, bank_code, bank_name, account_number, account_name)
  VALUES (p_user_id, p_amount, 'withdrawal', 'pending', v_ref, p_bank_code, p_bank_name, p_account_number, p_account_name);
  RETURN v_ref;
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_fail_withdrawal(p_ref text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tx record;
BEGIN
  SELECT id, user_id, amount, status::text AS status INTO v_tx
  FROM public.transactions WHERE ref = p_ref AND type::text = 'withdrawal' FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_tx.status IN ('failed', 'rejected', 'reversed') THEN RETURN 'already_refunded'; END IF;
  UPDATE public.transactions SET status = 'failed' WHERE id = v_tx.id;
  UPDATE public.user_wallet SET balance = coalesce(balance, 0) + v_tx.amount WHERE user_id = v_tx.user_id;
  RETURN 'refunded';
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_reverse_topup(p_ref text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tx record;
BEGIN
  SELECT id, user_id, amount, status::text AS status INTO v_tx
  FROM public.transactions WHERE ref = p_ref AND type::text = 'topup' FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_tx.status <> 'success' THEN
    UPDATE public.transactions SET status = 'rejected' WHERE id = v_tx.id AND status::text = 'pending';
    RETURN 'not_credited';
  END IF;
  UPDATE public.transactions SET status = 'rejected' WHERE id = v_tx.id;
  UPDATE public.user_wallet SET balance = coalesce(balance, 0) - v_tx.amount WHERE user_id = v_tx.user_id;
  RETURN 'reversed';
END;
$$;

COMMENT ON FUNCTION public.wallet_credit_topup(text, numeric) IS
  'Legacy: only the `wallet` Edge Function. Drop once mobile uses /api/wallet.';
COMMENT ON FUNCTION public.wallet_begin_withdrawal(uuid, double precision, text, text, text, text) IS
  'Legacy: only the `wallet` Edge Function. Drop once mobile uses /api/wallet.';
COMMENT ON FUNCTION public.wallet_fail_withdrawal(text) IS
  'Legacy: only the `wallet` Edge Function. Drop once mobile uses /api/wallet.';
COMMENT ON FUNCTION public.wallet_reverse_topup(text) IS
  'Legacy: only the `wallet` Edge Function. Drop once mobile uses /api/wallet.';
COMMENT ON COLUMN public.user_wallet.total IS
  'Retired 2026-11-12 (always 0). The balance is user_wallet.balance.';

-- ---------------------------------------------------------------------------
-- 4. Nothing may put money in `total` again.
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_wallet ALTER COLUMN total SET DEFAULT 0;
ALTER TABLE public.user_wallet DROP CONSTRAINT IF EXISTS user_wallet_total_retired;
ALTER TABLE public.user_wallet ADD CONSTRAINT user_wallet_total_retired CHECK (coalesce(total, 0) = 0);

-- ---------------------------------------------------------------------------
-- 5. Report anything else that still references user_wallet.total.
--    (`total_accumulated` doesn't match: \m…\M are word boundaries.)
-- ---------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS fn
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosrc ~* 'user_wallet'
      AND p.prosrc ~* '\mtotal\M'
  LOOP
    RAISE WARNING 'Function % still mentions user_wallet.total — move it to balance', r.fn;
  END LOOP;
END;
$$;
