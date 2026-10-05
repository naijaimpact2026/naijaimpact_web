-- Data repair: legacy existing users were created before the onboarded flag was introduced,
-- leaving them with onboarded = false. Middleware then blocked them on login with an infinite
-- redirect to an empty onboarding form.
--
-- This migration marks users who already have established profiles as onboarded = true,
-- and ensures auth_id = id for any older records where auth_id is null.

update public.users
set onboarded = true
where (onboarded is null or onboarded = false)
  and (
    (username is not null and username not like 'user_%')
    or fullname is not null
    or display_name is not null
    or bio is not null
    or avatar_url is not null
  );

update public.users
set auth_id = id
where auth_id is null;
