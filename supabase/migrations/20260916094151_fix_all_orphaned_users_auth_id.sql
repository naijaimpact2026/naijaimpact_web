-- Same bug as 20260912220715_fix_orphaned_users_auth_id.sql, found on 6 more
-- accounts: users.auth_id was left NULL (insert path pre-dates a bug fix in
-- signUp()), which permanently blocks login/onboarding for that account —
-- every profile lookup filters on auth_id = auth.uid() and finds nothing,
-- then a fresh INSERT collides on the unique username and surfaces a
-- misleading "username already taken" error.
--
-- Confirmed safe: for every account with a working auth_id, id = auth_id
-- exactly (users.id defaults to the auth uid at signup). None of these 7
-- rows have a duplicate email, so this is a straight 1:1 repair.

update public.users
set auth_id = id
where auth_id is null
  and id in (
    'eb507076-e98b-419e-9c9e-46a290557bb0', -- nuhup@gmail.com / nisonep
    '2133fa02-0419-4121-a96a-cb54157ce632', -- nuhu94new@gmail.com / insambo2
    '17116092-7dce-4228-a62b-9a92a3f168bf', -- holandann14@gmail.con / Dannyd
    'e8a8e1ce-0b54-4bd9-a64b-66405a15c6f5', -- nkannebevictor@gmail.com / Elovic
    'dfa2e140-c591-4b27-9dc1-5a9e4b730c2d', -- victorelo71@gmail.com / Victors
    'a53877ce-99b1-493f-9d7b-602f9c90be0a', -- dalhatudanjuma@gmail.com / IamDal
    '30db9a9f-281a-4b0c-ba50-02a84e5a6867'  -- philipperidot@gmail.com / stanperee
  );
