-- StreetShelf — backing for the features the UI already has
--
-- The screens were designed ahead of the schema. This migration brings the
-- database up to what they show, so wiring the app is a data-source swap and
-- not a redesign:
--
--   * a listing can be visible in several groups   (item_groups)
--   * owners block days on a calendar               (item_unavailable_dates)
--   * both sides rate each other after a handover   (reviews)
--   * the chat list shows unread counts             (conversation_reads)
--   * the map shows a fuzzed position, never the real one
--   * a free-text neighbourhood label on profiles   (profiles.area)
--
-- In-app payment was designed and then dropped on purpose (RENT is cash at the
-- handover); `transactions.payment_status` stays as an unused placeholder.

-- ------------------------------------------------------------- profiles --

alter table profiles
  add column area text check (char_length(area) <= 60);

-- ----------------------------------------------------------- item_groups --

create table item_groups (
  item_id  uuid not null references items (id) on delete cascade,
  group_id uuid not null references groups (id) on delete cascade,
  primary key (item_id, group_id)
);

create index item_groups_group_idx on item_groups (group_id);

insert into item_groups (item_id, group_id)
select id, group_id from items where group_id is not null;

-- Policies and functions that read items.group_id must go before the column.
drop policy "items: public or my group or mine" on items;
drop policy "items: owner inserts" on items;
drop function nearby_items(double precision, double precision, integer, request_type, item_type[], integer, integer);
drop function group_items(uuid, request_type, item_type[], double precision, double precision, integer, integer);

alter table items drop constraint items_group_matches_visibility;
drop index items_group_idx;
alter table items drop column group_id;

-- SECURITY DEFINER so the items policy can ask about memberships without
-- tripping over item_groups' own policy (and without recursion through it).
create or replace function can_see_via_group(p_item_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from item_groups ig
    join group_members gm on gm.group_id = ig.group_id
    where ig.item_id = p_item_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function is_item_owner(p_item_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from items where id = p_item_id and owner_id = auth.uid());
$$;

create policy "items: public or my group or mine"
  on items for select to authenticated
  using (
    owner_id = auth.uid()
    or (
      not is_blocked_either_way(owner_id)
      and ((not is_group_only) or can_see_via_group(id))
    )
  );

-- Listings are created through `create_item`, which also writes item_groups
-- atomically. A direct insert is still allowed for public listings only.
create policy "items: owner inserts public"
  on items for insert to authenticated
  with check (owner_id = auth.uid() and status = 'ACTIVE' and not is_group_only);

alter table item_groups enable row level security;

create policy "item_groups: members and owner read"
  on item_groups for select to authenticated
  using (is_group_member(group_id) or is_item_owner(item_id));

-- ------------------------------------------------- item_unavailable_dates --

create table item_unavailable_dates (
  item_id uuid not null references items (id) on delete cascade,
  day     date not null,
  primary key (item_id, day)
);

alter table item_unavailable_dates enable row level security;

-- Anyone who can see the listing can see which days are closed; the items
-- policy does the visibility work through the subquery.
create policy "unavailable: visible with the item"
  on item_unavailable_dates for select to authenticated
  using (exists (select 1 from items where items.id = item_id));

-- ---------------------------------------------------------------- reviews --

create table reviews (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions (id) on delete cascade,
  from_id        uuid not null references profiles (id) on delete cascade,
  to_id          uuid not null references profiles (id) on delete cascade,
  rating         smallint not null check (rating between 1 and 5),
  tags           text[] not null default '{}'
                 check (tags <@ array['punctual', 'careful', 'communicative', 'asDescribed', 'flexible']),
  comment        text check (char_length(comment) <= 500),
  created_at     timestamptz not null default now(),

  constraint reviews_not_self check (from_id <> to_id),
  -- One review per direction per handover.
  unique (transaction_id, from_id)
);

create index reviews_to_idx on reviews (to_id, created_at desc);

alter table reviews enable row level security;

-- Reviews are public inside the app: they are the trust signal on a profile.
create policy "reviews: readable by signed-in users"
  on reviews for select to authenticated
  using (true);

-- ----------------------------------------------------- conversation_reads --

create table conversation_reads (
  conversation_id uuid not null references conversations (id) on delete cascade,
  user_id         uuid not null references profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table conversation_reads enable row level security;

create policy "conversation_reads: own"
  on conversation_reads for select to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------------ grants --

-- 0002 granted on "all tables" as they existed then; new tables need their own.
grant select on item_groups, item_unavailable_dates, reviews, conversation_reads to authenticated;

-- ------------------------------------------------------------ discovery --

-- Rounds a point to a ~100 m cell and returns the cell centre. Deterministic,
-- so a listing's pin does not wander between refreshes, and coarse enough that
-- the pin never identifies a door.
create or replace function fuzz_point(p extensions.geography)
returns table (lat double precision, lng double precision)
language sql
immutable
set search_path = public, extensions
as $$
  select
    st_y(st_snaptogrid(p::geometry, 0.001)) + 0.0005,
    st_x(st_snaptogrid(p::geometry, 0.001)) + 0.0005;
$$;

create or replace function nearby_items(
  p_lat          double precision,
  p_lng          double precision,
  p_radius_m     integer default 1000,
  p_request_type request_type default 'OFFER',
  p_item_types   item_type[] default null,
  p_limit        integer default 50,
  p_offset       integer default 0
)
returns table (
  id            uuid,
  owner_id      uuid,
  title         text,
  description   text,
  images        text[],
  item_type     item_type,
  request_type  request_type,
  price_per_day numeric,
  currency      text,
  is_group_only boolean,
  group_ids     uuid[],
  status        item_status,
  created_at    timestamptz,
  distance_m    integer,
  approx_lat    double precision,
  approx_lng    double precision
)
language sql
security invoker
set search_path = public, extensions
stable
as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as point
  )
  select
    i.id, i.owner_id, i.title, i.description, i.images, i.item_type,
    i.request_type, i.price_per_day, i.currency, i.is_group_only,
    '{}'::uuid[],
    i.status, i.created_at,
    (round(st_distance(i.location, o.point) / 50) * 50)::integer,
    f.lat, f.lng
  from items i
  cross join origin o
  cross join lateral fuzz_point(i.location) f
  where i.request_type = p_request_type
    and i.status in ('ACTIVE', 'RESERVED')
    and not i.is_group_only
    and i.owner_id <> auth.uid()
    and (p_item_types is null or i.item_type = any (p_item_types))
    and st_dwithin(i.location, o.point, least(greatest(p_radius_m, 100), 20000))
  order by i.location <-> o.point
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

create or replace function group_items(
  p_group_id     uuid,
  p_request_type request_type default 'OFFER',
  p_item_types   item_type[] default null,
  p_lat          double precision default null,
  p_lng          double precision default null,
  p_limit        integer default 50,
  p_offset       integer default 0
)
returns table (
  id            uuid,
  owner_id      uuid,
  title         text,
  description   text,
  images        text[],
  item_type     item_type,
  request_type  request_type,
  price_per_day numeric,
  currency      text,
  is_group_only boolean,
  group_ids     uuid[],
  status        item_status,
  created_at    timestamptz,
  distance_m    integer,
  approx_lat    double precision,
  approx_lng    double precision
)
language sql
security invoker
set search_path = public, extensions
stable
as $$
  select
    i.id, i.owner_id, i.title, i.description, i.images, i.item_type,
    i.request_type, i.price_per_day, i.currency, i.is_group_only,
    coalesce((select array_agg(ig2.group_id) from item_groups ig2 where ig2.item_id = i.id), '{}'),
    i.status, i.created_at,
    case
      when p_lat is null or p_lng is null then null
      else (round(st_distance(
        i.location,
        st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
      ) / 50) * 50)::integer
    end,
    f.lat, f.lng
  from items i
  join item_groups ig on ig.item_id = i.id and ig.group_id = p_group_id
  cross join lateral fuzz_point(i.location) f
  where is_group_member(p_group_id)
    and i.request_type = p_request_type
    and i.status in ('ACTIVE', 'RESERVED')
    and (p_item_types is null or i.item_type = any (p_item_types))
  order by i.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

-- -------------------------------------------------------------- listings --

-- Creates a listing and its group links in one transaction. Coordinates come
-- in as plain numbers so the client never builds geography literals.
create or replace function create_item(
  p_title         text,
  p_description   text,
  p_images        text[],
  p_item_type     item_type,
  p_request_type  request_type,
  p_price_per_day numeric,
  p_lat           double precision,
  p_lng           double precision,
  p_group_ids     uuid[] default '{}'
)
returns items
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_item  items;
  v_group uuid;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  foreach v_group in array coalesce(p_group_ids, '{}') loop
    if not is_group_member(v_group) then
      raise exception 'not_a_member';
    end if;
  end loop;

  insert into items (
    owner_id, title, description, images, item_type, request_type,
    price_per_day, is_group_only, location
  ) values (
    auth.uid(), trim(p_title), coalesce(trim(p_description), ''), coalesce(p_images, '{}'),
    p_item_type, p_request_type,
    case when p_item_type = 'RENT' then p_price_per_day else null end,
    cardinality(coalesce(p_group_ids, '{}')) > 0,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
  )
  returning * into v_item;

  insert into item_groups (item_id, group_id)
  select v_item.id, unnest(coalesce(p_group_ids, '{}'));

  return v_item;
end;
$$;

-- Replaces the whole set of closed days for one of the caller's listings.
create or replace function set_unavailable_dates(p_item_id uuid, p_days date[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_item_owner(p_item_id) then
    raise exception 'item_not_found';
  end if;

  delete from item_unavailable_dates where item_id = p_item_id;
  insert into item_unavailable_dates (item_id, day)
  select p_item_id, d from unnest(coalesce(p_days, '{}')) as d
  where d >= current_date
  on conflict do nothing;
end;
$$;

-- ------------------------------------------------------ conversations --

create or replace function ensure_conversation(p_item_id uuid)
returns conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item items;
  v_conv conversations;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_item from items where id = p_item_id;
  if not found then
    raise exception 'item_not_found';
  end if;
  if v_item.owner_id = auth.uid() then
    raise exception 'own_item';
  end if;
  if is_blocked_either_way(v_item.owner_id) then
    raise exception 'blocked';
  end if;
  if v_item.is_group_only and not can_see_via_group(v_item.id) then
    raise exception 'item_not_found';
  end if;

  insert into conversations (item_id, owner_id, requester_id)
  values (v_item.id, v_item.owner_id, auth.uid())
  on conflict (item_id, requester_id) do update
    set last_message_at = conversations.last_message_at
  returning * into v_conv;

  return v_conv;
end;
$$;

-- Same as 0003, plus: the requested days must not include a day the owner
-- closed, or a day already held by an accepted handover.
create or replace function request_transaction(
  p_item_id    uuid,
  p_start_date date,
  p_end_date   date,
  p_message    text default null
)
returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item  items;
  v_conv  conversations;
  v_tx    transactions;
  v_days  integer;
  v_owner uuid;
  v_borrower uuid;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_item from items where id = p_item_id for update;
  if not found then
    raise exception 'item_not_found';
  end if;
  if v_item.status <> 'ACTIVE' then
    raise exception 'item_unavailable';
  end if;
  if p_end_date < p_start_date or p_start_date < current_date then
    raise exception 'invalid_dates';
  end if;
  if v_item.item_type = 'GIFT' and p_end_date <> p_start_date then
    -- A gift has a handover day and nothing after it.
    p_end_date := p_start_date;
  end if;

  if exists (
    select 1 from item_unavailable_dates
    where item_id = v_item.id and day between p_start_date and p_end_date
  ) or exists (
    select 1 from transactions
    where item_id = v_item.id
      and status in ('ACCEPTED', 'DELIVERED')
      and daterange(start_date, end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'dates_unavailable';
  end if;

  v_conv := ensure_conversation(p_item_id);

  if v_item.request_type = 'OFFER' then
    v_owner := v_item.owner_id;
    v_borrower := auth.uid();
  else
    v_owner := auth.uid();
    v_borrower := v_item.owner_id;
  end if;

  v_days := (p_end_date - p_start_date) + 1;

  begin
    insert into transactions (
      item_id, owner_id, borrower_id, initiated_by,
      start_date, end_date,
      price_per_day_snapshot, total_amount, currency
    ) values (
      v_item.id, v_owner, v_borrower, auth.uid(),
      p_start_date, p_end_date,
      v_item.price_per_day,
      coalesce(v_item.price_per_day, 0) * v_days,
      v_item.currency
    )
    returning * into v_tx;
  exception when unique_violation then
    raise exception 'request_already_open';
  end;

  if nullif(trim(p_message), '') is not null then
    insert into messages (conversation_id, sender_id, kind, body)
    values (v_conv.id, auth.uid(), 'TEXT', trim(p_message));
  end if;

  insert into messages (conversation_id, sender_id, kind, transaction_id)
  values (v_conv.id, auth.uid(), 'REQUEST', v_tx.id);

  return v_tx;
end;
$$;

create or replace function mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_conversation_party(p_conversation_id) then
    raise exception 'conversation_not_found';
  end if;
  insert into conversation_reads (conversation_id, user_id, last_read_at)
  values (p_conversation_id, auth.uid(), now())
  on conflict (conversation_id, user_id) do update set last_read_at = excluded.last_read_at;
end;
$$;

-- The chat list in one round trip: thread, the other person, the last
-- message and how many arrived since the caller last opened it.
create or replace function my_conversations()
returns table (
  id               uuid,
  item_id          uuid,
  other_id         uuid,
  last_message_at  timestamptz,
  last_kind        message_kind,
  last_body        text,
  last_sender_id   uuid,
  unread           integer
)
language sql
security invoker
set search_path = public
stable
as $$
  select
    c.id,
    c.item_id,
    case when c.owner_id = auth.uid() then c.requester_id else c.owner_id end,
    c.last_message_at,
    lm.kind,
    lm.body,
    lm.sender_id,
    (
      select count(*)::integer from messages m
      where m.conversation_id = c.id
        and m.sender_id is distinct from auth.uid()
        and m.created_at > coalesce(
          (select r.last_read_at from conversation_reads r where r.conversation_id = c.id and r.user_id = auth.uid()),
          '-infinity'
        )
    )
  from conversations c
  left join lateral (
    select m.kind, m.body, m.sender_id
    from messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) lm on true
  where auth.uid() in (c.owner_id, c.requester_id)
  order by c.last_message_at desc;
$$;

-- ---------------------------------------------------------------- groups --

create or replace function my_groups()
returns table (
  id           uuid,
  name         text,
  invite_code  text,
  role         group_role,
  member_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.name, g.invite_code, gm.role,
         (select count(*)::integer from group_members x where x.group_id = g.id)
  from groups g
  join group_members gm on gm.group_id = g.id and gm.user_id = auth.uid()
  order by gm.joined_at;
$$;

-- --------------------------------------------------------------- reviews --

create or replace function submit_review(
  p_transaction_id uuid,
  p_rating         smallint,
  p_tags           text[] default '{}',
  p_comment        text default null
)
returns reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx     transactions;
  v_type   item_type;
  v_review reviews;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_tx from transactions where id = p_transaction_id;
  if not found or auth.uid() not in (v_tx.owner_id, v_tx.borrower_id) then
    raise exception 'transaction_not_found';
  end if;

  select item_type into v_type from items where id = v_tx.item_id;
  if not (v_tx.status = 'RETURNED' or (v_type = 'GIFT' and v_tx.status = 'DELIVERED')) then
    raise exception 'not_finished';
  end if;

  begin
    insert into reviews (transaction_id, from_id, to_id, rating, tags, comment)
    values (
      v_tx.id,
      auth.uid(),
      case when auth.uid() = v_tx.owner_id then v_tx.borrower_id else v_tx.owner_id end,
      p_rating,
      coalesce(p_tags, '{}'),
      nullif(trim(p_comment), '')
    )
    returning * into v_review;
  exception when unique_violation then
    raise exception 'already_reviewed';
  end;

  return v_review;
end;
$$;

-- Everything a profile header shows, public or own.
create or replace function profile_summary(p_user_id uuid)
returns table (
  id            uuid,
  display_name  text,
  avatar_path   text,
  area          text,
  member_since  timestamptz,
  rating        numeric,
  review_count  integer,
  shared_count  integer,
  borrowed_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id, p.display_name, p.avatar_path, p.area, p.created_at,
    (select round(avg(r.rating)::numeric, 1) from reviews r where r.to_id = p.id),
    (select count(*)::integer from reviews r where r.to_id = p.id),
    (select count(*)::integer from items i where i.owner_id = p.id and i.request_type = 'OFFER'),
    (select count(*)::integer from transactions t
      where t.borrower_id = p.id and t.status in ('DELIVERED', 'RETURNED'))
  from profiles p
  where p.id = p_user_id
    and auth.uid() is not null
    and not is_blocked_either_way(p.id);
$$;

-- Rating per person, for listing cards and chat headers.
create view profile_ratings
with (security_invoker = true) as
  select to_id as user_id,
         round(avg(rating)::numeric, 1) as rating,
         count(*)::integer as review_count
  from reviews
  group by to_id;

grant select on profile_ratings to authenticated;

-- ------------------------------------------------------------- grants --

revoke all on function can_see_via_group(uuid) from public;
revoke all on function is_item_owner(uuid) from public;
revoke all on function nearby_items(double precision, double precision, integer, request_type, item_type[], integer, integer) from public;
revoke all on function group_items(uuid, request_type, item_type[], double precision, double precision, integer, integer) from public;
revoke all on function create_item(text, text, text[], item_type, request_type, numeric, double precision, double precision, uuid[]) from public;
revoke all on function set_unavailable_dates(uuid, date[]) from public;
revoke all on function mark_conversation_read(uuid) from public;
revoke all on function my_conversations() from public;
revoke all on function my_groups() from public;
revoke all on function submit_review(uuid, smallint, text[], text) from public;
revoke all on function profile_summary(uuid) from public;

grant execute on function can_see_via_group(uuid) to authenticated;
grant execute on function is_item_owner(uuid) to authenticated;
grant execute on function nearby_items(double precision, double precision, integer, request_type, item_type[], integer, integer) to authenticated;
grant execute on function group_items(uuid, request_type, item_type[], double precision, double precision, integer, integer) to authenticated;
grant execute on function create_item(text, text, text[], item_type, request_type, numeric, double precision, double precision, uuid[]) to authenticated;
grant execute on function set_unavailable_dates(uuid, date[]) to authenticated;
grant execute on function mark_conversation_read(uuid) to authenticated;
grant execute on function my_conversations() to authenticated;
grant execute on function my_groups() to authenticated;
grant execute on function submit_review(uuid, smallint, text[], text) to authenticated;
grant execute on function profile_summary(uuid) to authenticated;

-- ---------------------------------------------------------------- realtime --

alter publication supabase_realtime add table conversations;
