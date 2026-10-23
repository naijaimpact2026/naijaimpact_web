-- 20261016120000 narrowed SELECT on public.users to a column list (hiding
-- email and wallet_pin). The Next.js web app reads `users.select('*')` with the
-- signed-in user's JWT (profile lookup, wallet PIN check), which then failed for
-- every user. Restore table-level SELECT for signed-in users (anon stays revoked).
-- Follow-up: move the web app's PIN to the `credentials` table / RPCs so
-- wallet_pin can stop being readable by every signed-in user.
GRANT SELECT ON public.users TO authenticated;
