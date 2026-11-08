-- ============================================================================
-- Server-side wallet payments (2026-10-17)
--
-- Top-ups and withdrawals are now created only by the `wallet` Edge Function
-- (service role) and settled only through the idempotent functions below,
-- called by that function and by the Paystack webhook (update_transaction).
-- Clients can no longer insert any transactions row.
-- ============================================================================

DROP POLICY IF EXISTS "Users can open pending topups and withdrawals" ON public.transactions;

REVOKE INSERT, UPDATE, DELETE ON public.transactions FROM anon, authenticated;

-- Credit a pending top-up exactly once, only if Paystack collected the full amount.
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
  INSERT INTO public.user_wallet (user_id, total, total_accumulated)
  VALUES (v_tx.user_id, v_tx.amount, v_tx.amount)
  ON CONFLICT (user_id) DO UPDATE
    SET total = public.user_wallet.total + EXCLUDED.total,
        total_accumulated = public.user_wallet.total_accumulated + EXCLUDED.total_accumulated;
  RETURN 'credited';
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_fail_topup(p_ref text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.transactions SET status = 'failed'
  WHERE ref = p_ref AND type::text = 'topup' AND status::text = 'pending';
$$;

-- Hold the funds (debit) and record a pending withdrawal atomically.
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
  v_balance double precision;
  v_ref text;
BEGIN
  IF p_amount IS NULL OR p_amount < 100 THEN RAISE EXCEPTION 'Minimum withdrawal is ₦100'; END IF;
  SELECT total INTO v_balance FROM public.user_wallet WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  v_ref := 'WDR_' || replace(gen_random_uuid()::text, '-', '');
  UPDATE public.user_wallet SET total = total - p_amount WHERE user_id = p_user_id;
  -- 'pending' rows are ignored by update_users_wallet(), so this is the only debit.
  INSERT INTO public.transactions (user_id, amount, type, status, ref, bank_code, bank_name, account_number, account_name)
  VALUES (p_user_id, p_amount, 'withdrawal', 'pending', v_ref, p_bank_code, p_bank_name, p_account_number, p_account_name);
  RETURN v_ref;
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_complete_withdrawal(p_ref text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_status text;
BEGIN
  SELECT status::text INTO v_status FROM public.transactions WHERE ref = p_ref AND type::text = 'withdrawal' FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_status <> 'pending' THEN RETURN 'not_pending'; END IF;
  UPDATE public.transactions SET status = 'success' WHERE ref = p_ref;
  RETURN 'completed';
END;
$$;

-- Refund a held withdrawal exactly once (transfer failed / reversed / never started).
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
  IF v_tx.status IN ('failed', 'rejected') THEN RETURN 'already_refunded'; END IF;
  UPDATE public.transactions SET status = 'failed' WHERE id = v_tx.id;
  UPDATE public.user_wallet SET total = total + v_tx.amount WHERE user_id = v_tx.user_id;
  RETURN 'refunded';
END;
$$;

REVOKE ALL ON FUNCTION
  public.wallet_credit_topup(text, numeric),
  public.wallet_fail_topup(text),
  public.wallet_begin_withdrawal(uuid, double precision, text, text, text, text),
  public.wallet_complete_withdrawal(text),
  public.wallet_fail_withdrawal(text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.wallet_credit_topup(text, numeric),
  public.wallet_fail_topup(text),
  public.wallet_begin_withdrawal(uuid, double precision, text, text, text, text),
  public.wallet_complete_withdrawal(text),
  public.wallet_fail_withdrawal(text)
TO service_role;

-- P2P transfers now require the sender's wallet PIN.
DROP FUNCTION IF EXISTS public.transfer_to_user(uuid, double precision);

CREATE OR REPLACE FUNCTION public.transfer_to_user(p_recipient_id uuid, p_amount double precision, p_pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sender uuid := auth.uid();
  v_ref text;
BEGIN
  IF v_sender IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT public._unsafe_has_user_pin(v_sender) THEN RAISE EXCEPTION 'Set a wallet PIN first'; END IF;
  IF p_pin IS NULL OR NOT public._unsafe_verify_user_pin(v_sender, p_pin) THEN RAISE EXCEPTION 'Incorrect PIN'; END IF;
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

REVOKE ALL ON FUNCTION public.transfer_to_user(uuid, double precision, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.transfer_to_user(uuid, double precision, text) TO authenticated, service_role;
