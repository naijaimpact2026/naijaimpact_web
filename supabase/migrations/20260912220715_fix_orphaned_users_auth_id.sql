-- Data repair: a users row was created with auth_id left NULL, which permanently
-- blocked that account's completeOnboarding flow (its "do I already have a
-- profile?" lookup by auth_id always missed the row, so it tried to INSERT a new
-- row with the same primary key and hit users_pkey — surfaced to the user as a
-- misleading "username already taken" error).
--
-- Every correctly-created row has auth_id = id (see lib/actions/profile.ts
-- completeOnboarding's insert), so restoring that invariant for this one row
-- is safe. Scoped tightly: only this exact id, and only if auth_id is still NULL.

update public.users
set auth_id = id
where id = 'e1d9e08d-9ef6-4db5-ac8f-dd6d7b2ea28b'
  and auth_id is null;
