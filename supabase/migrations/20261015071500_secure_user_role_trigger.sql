-- ============================================================
-- Migration: 20261015071500_secure_user_role_trigger.sql
-- Description: Prevent privilege escalation on INSERT or UPDATE.
--   Enforces that regular users cannot self-assign role = 'admin'
--   or 'creator' on signup/insert. Only the service role or
--   database superusers can create or update users with non-default roles.
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_user_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_privileged BOOLEAN;
BEGIN
  -- Determine if the query is executed with service_role or DB admin authority
  is_privileged := (
    coalesce(auth.role(), '') = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  );

  -- On INSERT: block any role other than 'user' unless coming from service role
  IF TG_OP = 'INSERT' THEN
    IF NOT is_privileged AND NEW.role IS NOT NULL AND NEW.role <> 'user' THEN
      RAISE EXCEPTION 'Non-administrative users cannot assign privileged roles on insert';
    END IF;
    -- If role was omitted or null, guarantee default 'user'
    IF NEW.role IS NULL THEN
      NEW.role := 'user';
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE: block any change of the role column unless coming from service role
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_privileged THEN
      RAISE EXCEPTION 'role can only be changed by an administrator';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing update-only trigger and re-create for BOTH INSERT and UPDATE
DROP TRIGGER IF EXISTS users_prevent_role_change ON public.users;
CREATE TRIGGER users_prevent_role_change
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_role_change();
