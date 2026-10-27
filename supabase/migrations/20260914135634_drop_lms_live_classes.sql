-- Reverting the previous migration — live classes were not requested;
-- the ask was for funding opportunity ads instead.

drop table if exists public.lms_live_classes;
