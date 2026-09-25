-- StreetShelf — exact coordinates never leave the database
--
-- RLS decides which *rows* a user sees; it says nothing about *columns*. With
-- the table-wide grant from 0002, any signed-in user could read
-- `items.location` or `profiles.home_location` straight through PostgREST and
-- learn a neighbour's door. Column privileges close that: both columns are
-- dropped from the authenticated role's grants, and the two feed functions,
-- which need the point to compute distance and the fuzzed pin, become
-- SECURITY DEFINER with the visibility rules written out explicitly.

revoke select, insert, update on items from authenticated;
grant select (
  id, owner_id, title, description, images, item_type, request_type,
  price_per_day, currency, is_group_only, status, created_at, updated_at
) on items to authenticated;
-- Owners edit copy, photos, price and status; never the point, never the owner.
grant update (title, description, images, price_per_day, status) on items to authenticated;
-- Listings are created through create_item(), which takes lat/lng as numbers.

revoke select, update on profiles from authenticated;
grant select (id, display_name, avatar_path, area, search_radius_m, created_at, updated_at) on profiles to authenticated;
grant update (display_name, avatar_path, area, search_radius_m) on profiles to authenticated;

-- The direct-insert policy from 0005 is now unreachable (no insert grant);
-- drop it so nobody reads it as a live path.
drop policy "items: owner inserts public" on items;

-- ------------------------------------------------------- feed functions --

-- Visibility here must match the items select policy: not blocked either way,
-- public or in one of the caller's groups, and never the caller's own.
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
    f.lat, f.lng
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
    f.lat, f.lng
  from items i
  join item_groups ig on ig.item_id = i.id and ig.group_id = p_group_id
  cross join lateral fuzz_point(i.location) f
  where is_group_member(p_group_id)
    and not is_blocked_either_way(i.owner_id)
    and i.request_type = p_request_type
    and i.status in ('ACTIVE', 'RESERVED')
    and (p_item_types is null or i.item_type = any (p_item_types))
  order by i.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

-- Distance and fuzzed pin for listings fetched some other way (detail screen,
-- search, a profile's listings). Only rows the caller may see are answered.
create or replace function item_positions(
  p_item_ids uuid[],
  p_lat      double precision default null,
  p_lng      double precision default null
)
returns table (
  id         uuid,
  distance_m integer,
  approx_lat double precision,
  approx_lng double precision
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
    f.lat, f.lng
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

revoke all on function item_positions(uuid[], double precision, double precision) from public;
grant execute on function item_positions(uuid[], double precision, double precision) to authenticated;
