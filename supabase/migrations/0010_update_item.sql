-- StreetShelf — owners edit their listings
--
-- Copy, photos, price and group visibility change; the kind of listing
-- (GIFT/LEND/RENT, OFFER/WANTED) and its location do not: a transaction may
-- already hang off it, and changing what it is under someone's request would
-- change the deal. Group links are rewritten in the same transaction as the
-- row, which is why this is an RPC rather than a plain update (clients have
-- no write access to item_groups).

create or replace function update_item(
  p_item_id       uuid,
  p_title         text,
  p_description   text,
  p_images        text[],
  p_price_per_day numeric,
  p_group_ids     uuid[] default '{}'
)
returns items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item  items;
  v_group uuid;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_item from items where id = p_item_id for update;
  -- Someone else's listing looks exactly like a missing one.
  if not found or v_item.owner_id <> auth.uid() then
    raise exception 'item_not_found';
  end if;

  foreach v_group in array coalesce(p_group_ids, '{}') loop
    if not is_group_member(v_group) then
      raise exception 'not_a_member';
    end if;
  end loop;

  update items set
    title         = trim(p_title),
    description   = coalesce(trim(p_description), ''),
    images        = coalesce(p_images, '{}'),
    price_per_day = case when v_item.item_type = 'RENT' then p_price_per_day else null end,
    is_group_only = cardinality(coalesce(p_group_ids, '{}')) > 0
  where id = v_item.id
  returning * into v_item;

  delete from item_groups where item_id = v_item.id;
  insert into item_groups (item_id, group_id)
  select v_item.id, unnest(coalesce(p_group_ids, '{}'));

  return v_item;
end;
$$;

revoke all on function update_item(uuid, text, text, text[], numeric, uuid[]) from public;
grant execute on function update_item(uuid, text, text, text[], numeric, uuid[]) to authenticated;
