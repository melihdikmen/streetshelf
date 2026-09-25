-- RLS and RPC behaviour against the seed. Run with `npm run db:test`.
--
-- Each block signs in as a seeded user by setting the JWT claims PostgREST
-- would, then checks what that user can and cannot see or do. Everything runs
-- in one transaction that is rolled back, so the seed is untouched.

begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(44);

-- ----------------------------------------------------------------- helpers --

create or replace function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

create or replace function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true);
$$;

-- Seeded people.
\set melih  '''a0000000-0000-4000-8000-000000000001'''
\set ayse   '''a0000000-0000-4000-8000-000000000002'''
\set mehmet '''a0000000-0000-4000-8000-000000000003'''
\set can    '''a0000000-0000-4000-8000-000000000005'''
\set elif   '''a0000000-0000-4000-8000-000000000006'''

-- ------------------------------------------------------------- discovery --

select pg_temp.login(:melih);

select is(
  (select count(*)::int from nearby_items(39.8676, 32.8386, 1000, 'OFFER', null, 50, 0)),
  5,
  'nearby OFFER within 1 km: public listings only, own, group-only and out-of-range excluded'
);

select is(
  (select distance_m from nearby_items(39.8676, 32.8386, 1000, 'OFFER', null, 50, 0)
   where id = 'c0000000-0000-4000-8000-000000000001'),
  250,
  'distance is rounded to 50 m and matches the mock'
);

select ok(
  (select bool_and(abs(approx_lat - 39.8676) < 0.02) from nearby_items(39.8676, 32.8386, 5000, 'OFFER', null, 50, 0)),
  'approx coordinates are returned for the map'
);

select is(
  (select array_agg(status::text) from nearby_items(39.8676, 32.8386, 1000, 'OFFER', null, 50, 0)),
  array['ACTIVE', 'ACTIVE', 'ACTIVE', 'RESERVED', 'RESERVED'],
  'reserved listings stay in the feed but sort after available ones'
);

select is(
  (select reserved_until from nearby_items(39.8676, 32.8386, 1000, 'OFFER', null, 50, 0)
   where id = 'c0000000-0000-4000-8000-000000000001'),
  current_date + 3,
  'a reserved listing says until when it is out'
);

select is(
  (select count(*)::int from nearby_items(39.8676, 32.8386, 1000, 'OFFER', array['GIFT']::item_type[], 50, 0)),
  1,
  'mode filter narrows the feed'
);

select is(
  (select count(*)::int from items where id = 'c0000000-0000-4000-8000-000000000003'),
  1,
  'a member sees a group-only listing'
);

select is(
  (select count(*)::int from group_items('b0000000-0000-4000-8000-000000000001', 'OFFER', null, null, null, 50, 0)),
  2,
  'group feed lists the group''s offers'
);

select pg_temp.login(:elif);

select is(
  (select count(*)::int from items where id = 'c0000000-0000-4000-8000-000000000003'),
  0,
  'NEGATIVE: a non-member cannot see a group-only listing'
);

select is(
  (select count(*)::int from group_items('b0000000-0000-4000-8000-000000000001', 'OFFER', null, null, null, 50, 0)),
  0,
  'NEGATIVE: a non-member gets nothing from another group''s feed'
);

select is(
  (select count(*)::int from item_groups where group_id = 'b0000000-0000-4000-8000-000000000001'),
  0,
  'NEGATIVE: a non-member cannot list another group''s item links'
);

select is(
  (select count(*)::int from groups where invite_code = 'PRK7B2'),
  0,
  'NEGATIVE: invite codes of other groups cannot be read'
);

-- ------------------------------------------------------ exact locations --

select pg_temp.login(:ayse);

select throws_ok(
  $$ select location from items limit 1 $$,
  '42501', null,
  'NEGATIVE: the exact point of a listing cannot be selected'
);

select throws_ok(
  $$ select home_location from profiles limit 1 $$,
  '42501', null,
  'NEGATIVE: nobody can read a home location'
);

select throws_ok(
  $$ update items set owner_id = 'a0000000-0000-4000-8000-000000000002' where id = 'c0000000-0000-4000-8000-000000000006' $$,
  '42501', null,
  'NEGATIVE: ownership cannot be reassigned'
);

select is(
  (select distance_m from item_positions(array['c0000000-0000-4000-8000-000000000001'::uuid], 39.8676, 32.8386)),
  250,
  'item_positions answers distance for a visible listing'
);

-- --------------------------------------------------------- private data --

select pg_temp.login(:ayse);

select is(
  (select count(*)::int from transactions where id = 'd0000000-0000-4000-8000-000000000001'),
  0,
  'NEGATIVE: a third party cannot see a transaction'
);

select is(
  (select count(*)::int from messages where conversation_id = 'e0000000-0000-4000-8000-000000000001'),
  0,
  'NEGATIVE: a third party cannot read a thread'
);

select is(
  (select count(*)::int from conversations where id = 'e0000000-0000-4000-8000-000000000001'),
  0,
  'NEGATIVE: a third party cannot see a conversation'
);

select is(
  (select count(*)::int from conversation_reads where user_id = 'a0000000-0000-4000-8000-000000000001'::uuid),
  0,
  'NEGATIVE: read markers of others are private'
);

select throws_ok(
  $$ insert into messages (conversation_id, sender_id, kind, transaction_id)
     values ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'REQUEST', 'd0000000-0000-4000-8000-000000000002') $$,
  '42501', null,
  'NEGATIVE: clients cannot forge transaction cards'
);

select lives_ok(
  $$ update transactions set status = 'ACCEPTED' where id = 'd0000000-0000-4000-8000-000000000002' $$,
  'a direct status update is silently a no-op...'
);
select pg_temp.logout();
select is(
  (select status::text from transactions where id = 'd0000000-0000-4000-8000-000000000002'),
  'PENDING',
  'NEGATIVE: ...and does not change the state machine'
);

select pg_temp.login(:ayse);
select throws_ok(
  $$ select respond_transaction('d0000000-0000-4000-8000-000000000002', true) $$,
  'not_your_turn',
  'NEGATIVE: the initiator cannot accept their own request'
);

select throws_ok(
  $$ select set_unavailable_dates('c0000000-0000-4000-8000-000000000021', array[current_date + 1]) $$,
  'item_not_found',
  'NEGATIVE: only the owner edits availability'
);

select throws_ok(
  $$ select request_transaction('c0000000-0000-4000-8000-000000000001', current_date + 6, current_date + 6) $$,
  'item_unavailable',
  'NEGATIVE: a reserved listing takes no new requests'
);

-- ---------------------------------------------------- a whole handover --

select pg_temp.login(:mehmet);
select lives_ok(
  $$ select set_unavailable_dates('c0000000-0000-4000-8000-000000000007', array[current_date + 3]) $$,
  'owner closes a day'
);

select pg_temp.login(:ayse);
select throws_ok(
  $$ select request_transaction('c0000000-0000-4000-8000-000000000007', current_date + 2, current_date + 4) $$,
  'dates_unavailable',
  'NEGATIVE: a range over a closed day is refused'
);

-- `select * from f()`, not `select (f()).*`: the latter calls f once per column.
create temp table flow as
  select * from request_transaction('c0000000-0000-4000-8000-000000000004', current_date + 1, current_date + 2, 'Selam!');
grant select on flow to authenticated;

select is((select total_amount from flow), 400.00, 'RENT total is days × price');
select is(
  (select array_agg(m.kind::text order by m.created_at) from messages m
   join conversations c on c.id = m.conversation_id
   where c.item_id = 'c0000000-0000-4000-8000-000000000004' and c.requester_id = 'a0000000-0000-4000-8000-000000000002'),
  array['TEXT', 'REQUEST'],
  'the note and the request card land in the thread'
);

select pg_temp.login(:can);
select lives_ok($$ select respond_transaction((select id from flow), true) $$, 'the owner accepts');
select is(
  (select status::text from items where id = 'c0000000-0000-4000-8000-000000000004'),
  'RESERVED',
  'accepting reserves the listing'
);

select pg_temp.login(:ayse);
select throws_ok(
  $$ select confirm_pickup((select id from flow), 'transactions/' || (select id from flow) || '/pickup.jpg') $$,
  'owner_only',
  'NEGATIVE: the borrower cannot confirm the handover'
);

select pg_temp.login(:can);
select throws_ok(
  $$ select confirm_pickup((select id from flow), 'items/elsewhere.jpg') $$,
  'invalid_photo_path',
  'NEGATIVE: a handover photo must live under the transaction'
);
select lives_ok(
  $$ select confirm_pickup((select id from flow), 'transactions/' || (select id from flow) || '/pickup.jpg') $$,
  'owner confirms handover with a photo'
);
select lives_ok(
  $$ select confirm_return((select id from flow), 'transactions/' || (select id from flow) || '/return.jpg') $$,
  'owner confirms the return'
);

select pg_temp.logout();
select is(
  (select m.body from messages m where m.transaction_id = (select id from flow) and m.kind = 'SYSTEM' order by m.created_at limit 1),
  'ACCEPTED',
  'the acceptance line still says accepted after the item came back'
);

select pg_temp.login(:ayse);
select lives_ok($$ select submit_review((select id from flow), 5::smallint, array['careful'], 'Süper') $$, 'borrower rates the owner');
select throws_ok(
  $$ select submit_review((select id from flow), 4::smallint) $$,
  'already_reviewed',
  'NEGATIVE: one review per side per handover'
);

-- --------------------------------------------------------------- listings --

select pg_temp.login(:elif);
select throws_ok(
  $$ select create_item('Deneme', '', '{}', 'GIFT', 'OFFER', 0, 39.87, 32.84, array['b0000000-0000-4000-8000-000000000001'::uuid]) $$,
  'not_a_member',
  'NEGATIVE: cannot post into a group you are not in'
);

create temp table made as
  select * from create_item('Kahve makinesi', 'Az kullanıldı', '{}', 'LEND', 'OFFER', 55, 39.8676, 32.8386,
                            array['b0000000-0000-4000-8000-000000000002'::uuid]);
grant select on made to authenticated;
select is(
  (select (is_group_only, price_per_day) from made),
  (true, null::numeric),
  'create_item links groups, marks group-only and drops a price on LEND'
);

select pg_temp.login(:melih);
select is(
  (select count(*)::int from items where id = (select id from made)),
  0,
  'NEGATIVE: a new group-only listing stays inside its group'
);

-- -------------------------------------------------------------- summaries --

-- Using the app marks threads read, so pin the markers to the seed's state
-- instead of trusting whatever the local database has been through.
select pg_temp.logout();
delete from conversation_reads where user_id = :melih;
insert into conversation_reads (conversation_id, user_id, last_read_at) values
  ('e0000000-0000-4000-8000-000000000001', :melih, now() - interval '13 hours'),
  ('e0000000-0000-4000-8000-000000000003', :melih, now()),
  ('e0000000-0000-4000-8000-000000000004', :melih, now());

select pg_temp.login(:melih);
select is(
  (select rating from profile_summary('a0000000-0000-4000-8000-000000000001')),
  4.7,
  'profile rating is the average of received reviews'
);

select is(
  (select array_agg(unread order by last_message_at desc) from my_conversations()),
  array[1, 2, 0, 0],
  'unread counts respect the read markers'
);

select * from finish();
rollback;
