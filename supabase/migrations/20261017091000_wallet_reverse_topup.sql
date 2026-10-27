-- Reverse a credited top-up exactly once (Paystack refund.processed).
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
  UPDATE public.user_wallet SET total = total - v_tx.amount WHERE user_id = v_tx.user_id;
  RETURN 'reversed';
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_reverse_topup(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.wallet_reverse_topup(text) TO service_role;
