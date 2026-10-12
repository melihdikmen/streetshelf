-- StreetShelf — fixes from the pre-release QA pass
--
-- 1. A report outlived nothing: deleting the reported account or listing took
--    the report with it (ON DELETE CASCADE), so abusing someone and then
--    deleting the account erased the evidence. The foreign keys now go NULL and
--    the target's id is kept in a plain column.
-- 2. Owners could set `items.status` to anything, which put a lent-out listing
--    back in the feed (undoing 0009). The column grant is gone; archiving goes
--    through `archive_item`, which only turns a listing into ARCHIVED and only
--    while nobody holds it.
-- 3. `create_item` accepted any coordinates; PostGIS wrapped them silently.

-- ---------------------------------------------------------------- reports --

alter table reports
  add column reported_user_id uuid,
  add column reported_item_id uuid;

update reports set reported_user_id = user_id, reported_item_id = item_id;

alter table reports drop constraint reports_user_id_fkey;
alter table reports drop constraint reports_item_id_fkey;
alter table reports
  add constraint reports_user_id_fkey foreign key (user_id) references profiles (id) on delete set null,
  add constraint reports_item_id_fkey foreign key (item_id) references items (id) on delete set null;

alter table reports drop constraint reports_has_target;
alter table reports
  add constraint reports_has_target check (reported_user_id is not null or reported_item_id is not null);

-- The snapshot is filled from what the client sends, so a client cannot lie
-- about it and the check above holds after the target is gone.
create or replace function reports_snapshot_target()
returns trigger
language plpgsql
as $$
begin
  new.reported_user_id := new.user_id;
  new.reported_item_id := new.item_id;
  return new;
end;
$$;

create trigger reports_snapshot_target
  before insert on reports
  for each row execute function reports_snapshot_target();

-- ------------------------------------------------------------ item status --

revoke update on items from authenticated;
grant update (title, description, images, price_per_day) on items to authenticated;

create or replace function archive_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_item_owner(p_item_id) then
    raise exception 'item_not_found';
  end if;

  update items set status = 'ARCHIVED'
  where id = p_item_id and status = 'ACTIVE';
  if not found then
    raise exception 'item_unavailable';
  end if;
end;
$$;

revoke all on function archive_item(uuid) from public;
grant execute on function archive_item(uuid) to authenticated;

-- ------------------------------------------------------------ coordinates --

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

  -- PostGIS wraps a latitude of 999 round to -81 instead of failing.
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid_location';
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
