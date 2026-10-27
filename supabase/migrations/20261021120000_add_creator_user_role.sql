-- ============================================================
-- Migration: 20261021120000_add_creator_user_role.sql
-- Description: users.role is the `user_role` enum (user, admin,
--   super_admin) in the live database, not the VARCHAR + CHECK that
--   20261009090000_create_modushive.sql assumed — its
--   ADD COLUMN IF NOT EXISTS was skipped because the column already
--   existed. Becoming a creator failed with
--   "invalid input value for enum user_role: creator".
-- ============================================================

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'creator';
