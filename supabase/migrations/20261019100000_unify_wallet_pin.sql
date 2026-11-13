-- ============================================================================
-- One wallet PIN for web + mobile, stored only in public.credentials.
--
-- The web app kept a bcrypt hash in users.wallet_pin, which every signed-in
-- user can read (users is SELECT-able so the web's `select('*')` works) — a
-- 4-digit PIN hash is brute-forced offline in seconds. Its lockout wrote to
-- columns that don't exist, so it never locked. This moves the hash into
-- credentials (own-row RLS, server-checked), adds a real lockout, and clears
-- users.wallet_pin.
-- ============================================================================

ALTER TABLE public.credentials
  ADD COLUMN IF NOT EXISTS pin_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz;

-- Migrate web PINs ($2b$ and $2a$ are the same bcrypt algorithm; pgcrypto reads $2a$).
-- Never overwrite a PIN already set from the mobile app.
INSERT INTO public.credentials (user_id, verification_code, updated_at)
SELECT u.id, '$2a$' || substr(u.wallet_pin, 5), now()
FROM public.users u
WHERE u.wallet_pin ~ '^\$2[aby]\$'
ON CONFLICT (user_id) DO UPDATE
  SET verification_code = EXCLUDED.verification_code, updated_at = now()
  WHERE public.credentials.verification_code IS NULL;

UPDATE public.users SET wallet_pin = NULL WHERE wallet_pin IS NOT NULL;

-- Clients may no longer write PIN material directly (use the RPCs below).
REVOKE INSERT, UPDATE, DELETE ON public.credentials FROM anon, authenticated;

-- Server-side PIN check with lockout: 5 wrong attempts -> locked for 15 minutes.
CREATE OR REPLACE FUNCTION public.pin_check(p_user_id uuid, p_pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  c record;
BEGIN
  SELECT verification_code, pin_attempts, pin_locked_until INTO c
  FROM public.credentials WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR c.verification_code IS NULL THEN RETURN 'no_pin'; END IF;
  IF c.pin_locked_until IS NOT NULL AND c.pin_locked_until > now() THEN RETURN 'locked'; END IF;

  IF p_pin IS NOT NULL AND c.verification_code = crypt(p_pin, c.verification_code) THEN
    UPDATE public.credentials SET pin_attempts = 0, pin_locked_until = NULL WHERE user_id = p_user_id;
    RETURN 'ok';
  END IF;

  IF c.pin_attempts + 1 >= 5 THEN
    UPDATE public.credentials SET pin_attempts = 0, pin_locked_until = now() + interval '15 minutes' WHERE user_id = p_user_id;
    RETURN 'locked';
  END IF;
  UPDATE public.credentials SET pin_attempts = c.pin_attempts + 1 WHERE user_id = p_user_id;
  RETURN 'wrong';
END;
$$;

REVOKE ALL ON FUNCTION public.pin_check(uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.pin_check(uuid, text) TO service_role;

-- Set/replace a PIN. When one already exists the current PIN is required.
CREATE OR REPLACE FUNCTION public.pin_set(p_user_id uuid, p_new_pin text, p_current_pin text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_status text;
BEGIN
  IF p_new_pin IS NULL OR p_new_pin !~ '^[0-9]{4,6}$' THEN RAISE EXCEPTION 'PIN must be 4-6 digits'; END IF;
  IF public._unsafe_has_user_pin(p_user_id) THEN
    v_status := public.pin_check(p_user_id, p_current_pin);
    IF v_status <> 'ok' THEN RETURN v_status; END IF;
  END IF;
  INSERT INTO public.credentials (user_id, verification_code, pin_attempts, pin_locked_until, updated_at)
  VALUES (p_user_id, crypt(p_new_pin, gen_salt('bf', 10)), 0, NULL, now())
  ON CONFLICT (user_id) DO UPDATE
    SET verification_code = EXCLUDED.verification_code, pin_attempts = 0, pin_locked_until = NULL, updated_at = now();
  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.pin_set(uuid, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.pin_set(uuid, text, text) TO service_role;

-- Mobile-facing wrappers now go through the lockout.
CREATE OR REPLACE FUNCTION public.verify_user_pin(p_user_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_status text;
BEGIN
  PERFORM public.assert_self(p_user_id);
  v_status := public.pin_check(p_user_id, p_pin);
  IF v_status = 'locked' THEN RAISE EXCEPTION 'Too many wrong attempts. Try again in 15 minutes.'; END IF;
  RETURN v_status = 'ok';
END;
$$;

-- Setting a PIN from the app: first time free, otherwise needs the current PIN.
CREATE OR REPLACE FUNCTION public.upsert_user_pin(p_user_id uuid, p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM public.assert_self(p_user_id);
  IF public._unsafe_has_user_pin(p_user_id) THEN
    RAISE EXCEPTION 'You already have a PIN. Use change PIN instead.';
  END IF;
  IF public.pin_set(p_user_id, p_pin, NULL) <> 'ok' THEN RAISE EXCEPTION 'Could not set PIN'; END IF;
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
  v_status := public.pin_set(auth.uid(), p_new_pin, p_current_pin);
  IF v_status = 'locked' THEN RAISE EXCEPTION 'Too many wrong attempts. Try again in 15 minutes.'; END IF;
  IF v_status <> 'ok' THEN RAISE EXCEPTION 'Current PIN is incorrect'; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.change_user_pin(text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.change_user_pin(text, text) TO authenticated, service_role;

-- Transfers use the lockout too.
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
