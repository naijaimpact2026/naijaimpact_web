-- ============================================================
-- Migration: 20261021130000_fix_user_role_trigger_invoker.sql
-- Description: prevent_user_role_change() was SECURITY DEFINER, so
--   inside it current_user was always the owner (postgres) and
--   is_privileged was always true — the guard never blocked anyone.
--   Run it as the caller instead so current_user is the real role
--   (authenticated / anon / service_role / postgres).
--
--   Today the role column is also protected by column grants
--   (authenticated has no INSERT/UPDATE on users.role); this trigger
--   is the backstop if those grants ever widen.
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_user_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  is_privileged BOOLEAN;
BEGIN
  is_privileged := (
    coalesce(auth.role(), '') = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin', 'service_role')
  );

  -- On INSERT: regular users can only insert with role = 'user'
  IF TG_OP = 'INSERT' THEN
    IF NOT is_privileged AND NEW.role IS NOT NULL AND NEW.role <> 'user' THEN
      RAISE EXCEPTION 'Non-administrative users cannot assign privileged roles on insert';
    END IF;
    IF NEW.role IS NULL THEN
      NEW.role := 'user';
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE: regular users cannot alter their role
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_privileged THEN
      RAISE EXCEPTION 'role can only be changed by an administrator';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;
