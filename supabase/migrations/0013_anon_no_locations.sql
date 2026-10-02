-- StreetShelf — the anon role cannot read listings or profiles at all
--
-- 0006 took `items.location` and `profiles.home_location` away from the
-- authenticated role, but the anon role kept Supabase's default table-wide
-- grants. Nothing leaks today: RLS is on and no policy names anon, so an
-- unsigned request sees no rows. That leaves exact coordinates one careless
-- `to public` policy away from the open internet, though.
--
-- Every screen in the app requires a session (the auth guard sends anyone
-- without one to Welcome), so anon needs nothing from either table. Taking
-- every privilege away makes the column grants, not just the policies, say so.

revoke all on table items from anon;
revoke all on table profiles from anon;
