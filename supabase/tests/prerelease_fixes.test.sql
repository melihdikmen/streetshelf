-- Pre-release QA fixes (0015). Run with `npm run db:test`.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(6);

create or replace function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;
create or replace function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true);
$$;

\set melih '''a0000000-0000-4000-8000-000000000001'''
\set ayse  '''a0000000-0000-4000-8000-000000000002'''

-- 1. A report survives the deletion of its target.
select pg_temp.login(:ayse);
insert into reports (reporter_id, user_id, reason) values (:ayse, :melih, 'qa: evidence must survive');
select pg_temp.logout();
delete from profiles where id = :melih;
select is((select count(*)::int from reports where reason = 'qa: evidence must survive'), 1,
  'a report is kept after the reported account is deleted');
select is((select reported_user_id from reports where reason = 'qa: evidence must survive'), :melih::uuid,
  'the reported id is still recorded');

-- 2. An owner cannot write items.status directly any more (NEGATIVE).
select pg_temp.login(:ayse);
select throws_ok(
  $$ update items set status = 'ACTIVE' where owner_id = 'a0000000-0000-4000-8000-000000000002' $$,
  '42501', null, 'owners cannot set items.status');

-- archive_item refuses someone else's listing (NEGATIVE).
select throws_ok(
  $$ select archive_item((select id from items where owner_id <> 'a0000000-0000-4000-8000-000000000002' limit 1)) $$,
  'P0001', 'item_not_found', 'archive_item refuses a listing the caller does not own');

-- 3. create_item rejects impossible coordinates (NEGATIVE).
select throws_ok(
  $$ select create_item('x', '', '{}', 'GIFT', 'OFFER', null, 999, 29) $$,
  'P0001', 'invalid_location', 'a latitude of 999 is refused');
select throws_ok(
  $$ select create_item('x', '', '{}', 'GIFT', 'OFFER', null, 41, 181) $$,
  'P0001', 'invalid_location', 'a longitude of 181 is refused');

select * from finish();
rollback;
