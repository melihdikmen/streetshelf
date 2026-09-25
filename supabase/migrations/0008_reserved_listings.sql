-- NeighborLend — reserved listings stay visible, but last and labelled
--
-- A LEND or RENT listing with an accepted handover is RESERVED: it takes no
-- new requests, yet it is coming back. Hiding it would make the street look
-- emptier than it is, so the feeds keep it, sort it after everything
-- available, and say until when it is out (`reserved_until`, the latest end
-- date of an accepted or delivered handover). The date is not private: it is
-- what a neighbour would be told if they asked.
--
-- Return types change, so the three functions are dropped and recreated.

drop function nearby_items(double precision, double precision, integer, request_type, item_type[], integer, integer);
drop function group_items(uuid, request_type, item_type[], double precision, double precision, integer, integer);
drop function item_positions(uuid[], double precision, double precision);

-- Latest end date among live handovers, or null when the listing is free.
create or replace function reserved_until(p_item_id uuid)
returns date
language sql
security definer
set search_path = public
stable
as $$
  select max(end_date) from transactions
  where item_id = p_item_id and status in ('ACCEPTED', 'DELIVERED');
$$;

create function nearby_items(
  p_lat          double precision,
  p_lng          double precision,
  p_radius_m     integer default 1000,
  p_request_type request_type default 'OFFER',
  p_item_types   item_type[] default null,
  p_limit        integer default 50,
  p_offset       integer default 0
)
returns table (
  id             uuid,
  owner_id       uuid,
  title          text,
  description    text,
  images         text[],
  item_type      item_type,
  request_type   request_type,
  price_per_day  numeric,
  currency       text,
  is_group_only  boolean,
  group_ids      uuid[],
  status         item_status,
  created_at     timestamptz,
  distance_m     integer,
  approx_lat     double precision,
  approx_lng     double precision,
  reserved_until date
)
language sql
security definer
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
    f.lat, f.lng,
    case when i.status = 'RESERVED' then reserved_until(i.id) end
  from items i
  cross join origin o
  cross join lateral fuzz_point(i.location) f
  where auth.uid() is not null
    and i.request_type = p_request_type
    and i.status in ('ACTIVE', 'RESERVED')
    and not i.is_group_only
    and i.owner_id <> auth.uid()
    and not is_blocked_either_way(i.owner_id)
    and (p_item_types is null or i.item_type = any (p_item_types))
    and st_dwithin(i.location, o.point, least(greatest(p_radius_m, 100), 20000))
  -- Available first, nearest first within each half.
  order by (i.status = 'RESERVED'), i.location <-> o.point
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

create function group_items(
  p_group_id     uuid,
  p_request_type request_type default 'OFFER',
  p_item_types   item_type[] default null,
  p_lat          double precision default null,
  p_lng          double precision default null,
  p_limit        integer default 50,
  p_offset       integer default 0
)
returns table (
  id             uuid,
  owner_id       uuid,
  title          text,
  description    text,
  images         text[],
  item_type      item_type,
  request_type   request_type,
  price_per_day  numeric,
  currency       text,
  is_group_only  boolean,
  group_ids      uuid[],
  status         item_status,
  created_at     timestamptz,
  distance_m     integer,
  approx_lat     double precision,
  approx_lng     double precision,
  reserved_until date
)
language sql
security definer
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
    f.lat, f.lng,
    case when i.status = 'RESERVED' then reserved_until(i.id) end
  from items i
  join item_groups ig on ig.item_id = i.id and ig.group_id = p_group_id
  cross join lateral fuzz_point(i.location) f
  where is_group_member(p_group_id)
    and not is_blocked_either_way(i.owner_id)
    and i.request_type = p_request_type
    and i.status in ('ACTIVE', 'RESERVED')
    and (p_item_types is null or i.item_type = any (p_item_types))
  order by (i.status = 'RESERVED'), i.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

create function item_positions(
  p_item_ids uuid[],
  p_lat      double precision default null,
  p_lng      double precision default null
)
returns table (
  id             uuid,
  distance_m     integer,
  approx_lat     double precision,
  approx_lng     double precision,
  reserved_until date
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select
    i.id,
    case
      when p_lat is null or p_lng is null or i.owner_id = auth.uid() then null
      else (round(st_distance(
        i.location,
        st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
      ) / 50) * 50)::integer
    end,
    f.lat, f.lng,
    case when i.status = 'RESERVED' then reserved_until(i.id) end
  from items i
  cross join lateral fuzz_point(i.location) f
  where i.id = any (p_item_ids)
    and auth.uid() is not null
    and (
      i.owner_id = auth.uid()
      or (
        not is_blocked_either_way(i.owner_id)
        and ((not i.is_group_only) or can_see_via_group(i.id))
      )
    );
$$;

revoke all on function reserved_until(uuid) from public;
revoke all on function nearby_items(double precision, double precision, integer, request_type, item_type[], integer, integer) from public;
revoke all on function group_items(uuid, request_type, item_type[], double precision, double precision, integer, integer) from public;
revoke all on function item_positions(uuid[], double precision, double precision) from public;

grant execute on function nearby_items(double precision, double precision, integer, request_type, item_type[], integer, integer) to authenticated;
grant execute on function group_items(uuid, request_type, item_type[], double precision, double precision, integer, integer) to authenticated;
grant execute on function item_positions(uuid[], double precision, double precision) to authenticated;
