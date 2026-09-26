-- StreetShelf — lent-out and rented-out listings leave the feeds
--
-- 0008 kept RESERVED listings (an accepted or ongoing handover) in the feeds,
-- sorted last with an "out until" date. In use that read as clutter: the item
-- is at a neighbour's and cannot be asked for, so it should not be offered.
-- The feeds now list ACTIVE listings only; a listing reappears when it is
-- returned (confirm_return sets it back to ACTIVE). Gifts that were handed
-- over are COMPLETED and were never listed.
--
-- Not affected: the owner still sees their own reserved listings (the client
-- reads those straight from items), and item_positions still returns
-- reserved_until for the detail screen of an item someone already has open.
-- Same signatures and return types as 0008, so create or replace is enough.

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
    and i.status = 'ACTIVE'
    and not i.is_group_only
    and i.owner_id <> auth.uid()
    and not is_blocked_either_way(i.owner_id)
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
    and i.status = 'ACTIVE'
    and (p_item_types is null or i.item_type = any (p_item_types))
  order by i.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;
