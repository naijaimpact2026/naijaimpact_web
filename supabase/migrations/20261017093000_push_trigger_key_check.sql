-- The notification trigger authenticates to onesignal-push-notification with
-- the Vault secret 'service_role_key' (a legacy key PostgREST no longer
-- accepts). Let the function compare a presented token to that exact value.
CREATE OR REPLACE FUNCTION public.is_push_trigger_key(p_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_token IS NOT NULL AND length(p_token) > 20 AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'service_role_key' AND decrypted_secret = p_token
  );
$$;

REVOKE ALL ON FUNCTION public.is_push_trigger_key(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_push_trigger_key(text) TO service_role;

DROP FUNCTION IF EXISTS public.request_role();
