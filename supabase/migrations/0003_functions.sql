-- NeighborLend — RPCs
--
-- Everything that touches more than one row, or that must not be forged by
-- a client, is a function here. All are SECURITY DEFINER with an explicit
-- `auth.uid()` check up front, and all raise with a short stable code the
-- app maps to a translated message (see src/services/supabase/errors.ts).

-- ------------------------------------------------------------- discovery --

-- Public listings within a radius, nearest first.
--
-- Runs as the caller (SECURITY INVOKER) so the items RLS policy applies —
-- blocked users and other people's group-only listings fall out here. The
-- exact coordinates are deliberately not returned; `distance_m` is rounded
-- to 50 m.
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
  group_id      uuid,
  status        item_status,
  created_at    timestamptz,
  distance_m    integer
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
    i.request_type, i.price_per_day, i.currency, i.is_group_only, i.group_id,
    i.status, i.created_at,
    (round(st_distance(i.location, o.point) / 50) * 50)::integer as distance_m
  from items i, origin o
  where i.request_type = p_request_type
    and i.status = 'ACTIVE'
    and not i.is_group_only
    and (p_item_types is null or i.item_type = any (p_item_types))
    and st_dwithin(i.location, o.point, least(greatest(p_radius_m, 100), 20000))
  order by i.location <-> o.point
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

-- Listings inside one of the caller's groups. Distance is still measured
-- from the caller when a position is given, so the card design stays the
-- same across both feeds.
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
  group_id      uuid,
  status        item_status,
  created_at    timestamptz,
  distance_m    integer
)
language sql
security invoker
set search_path = public, extensions
stable
as $$
  select
    i.id, i.owner_id, i.title, i.description, i.images, i.item_type,
    i.request_type, i.price_per_day, i.currency, i.is_group_only, i.group_id,
    i.status, i.created_at,
    case
      when p_lat is null or p_lng is null then null
      else (round(st_distance(
        i.location,
        st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
      ) / 50) * 50)::integer
    end as distance_m
  from items i
  where i.group_id = p_group_id
    and i.request_type = p_request_type
    and i.status = 'ACTIVE'
    and (p_item_types is null or i.item_type = any (p_item_types))
  order by i.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------- groups --

-- Six characters from an alphabet with no 0/O or 1/I, so a code read out
-- loud on a stairwell survives the trip.
create or replace function generate_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from groups where invite_code = code);
  end loop;
  return code;
end;
$$;

create or replace function create_group(p_name text)
returns groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group groups;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  insert into groups (name, invite_code, created_by)
  values (trim(p_name), generate_invite_code(), auth.uid())
  returning * into v_group;

  insert into group_members (group_id, user_id, role)
  values (v_group.id, auth.uid(), 'ADMIN');

  return v_group;
end;
$$;

create or replace function join_group(p_code text)
returns groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group groups;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_group
  from groups
  where invite_code = upper(trim(p_code));

  if not found then
    raise exception 'invite_not_found';
  end if;

  insert into group_members (group_id, user_id)
  values (v_group.id, auth.uid())
  on conflict do nothing;

  return v_group;
end;
$$;

-- ---------------------------------------------------------- transactions --

-- Finds or opens the thread between the caller and a listing's owner.
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
  if v_item.is_group_only and not is_group_member(v_item.group_id) then
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

-- Opens a request on a listing and drops the REQUEST card into the thread.
--
-- Direction depends on the listing: on an OFFER the caller wants to receive
-- the item; on a WANTED the caller is offering to provide it. Either way the
-- listing's owner is the one who did not initiate, and is the one who will
-- accept or reject.
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
  if p_end_date < p_start_date then
    raise exception 'invalid_dates';
  end if;
  if v_item.item_type = 'GIFT' and p_end_date <> p_start_date then
    -- A gift has a handover day and nothing after it.
    p_end_date := p_start_date;
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

  insert into messages (conversation_id, sender_id, kind, body, transaction_id)
  values (v_conv.id, auth.uid(), 'REQUEST', nullif(trim(p_message), ''), v_tx.id);

  return v_tx;
end;
$$;

-- Accept or reject. Only the party who did not initiate may answer.
create or replace function respond_transaction(p_transaction_id uuid, p_accept boolean)
returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx   transactions;
  v_conv conversations;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_tx from transactions where id = p_transaction_id for update;
  if not found or auth.uid() not in (v_tx.owner_id, v_tx.borrower_id) then
    raise exception 'transaction_not_found';
  end if;
  if v_tx.initiated_by = auth.uid() then
    raise exception 'not_your_turn';
  end if;
  if v_tx.status <> 'PENDING' then
    raise exception 'invalid_transition';
  end if;

  update transactions
     set status = case when p_accept then 'ACCEPTED' else 'REJECTED' end::transaction_status,
         responded_at = now()
   where id = v_tx.id
   returning * into v_tx;

  if p_accept then
    update items set status = 'RESERVED' where id = v_tx.item_id;
  end if;

  select * into v_conv
  from conversations
  where item_id = v_tx.item_id
    and requester_id = case
      when v_tx.initiated_by = v_tx.owner_id then v_tx.owner_id else v_tx.borrower_id end
  limit 1;

  if found then
    insert into messages (conversation_id, sender_id, kind, transaction_id)
    values (v_conv.id, auth.uid(), 'SYSTEM', v_tx.id);
  end if;

  return v_tx;
end;
$$;

-- The owner records the handover with a photo. A GIFT is complete here: the
-- item is marked COMPLETED and there is no return step.
create or replace function confirm_pickup(p_transaction_id uuid, p_photo_path text)
returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx   transactions;
  v_item items;
  v_conv conversations;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_tx from transactions where id = p_transaction_id for update;
  if not found or auth.uid() not in (v_tx.owner_id, v_tx.borrower_id) then
    raise exception 'transaction_not_found';
  end if;
  if auth.uid() <> v_tx.owner_id then
    raise exception 'owner_only';
  end if;
  if v_tx.status <> 'ACCEPTED' then
    raise exception 'invalid_transition';
  end if;
  if p_photo_path is null or p_photo_path not like 'transactions/' || v_tx.id || '/%' then
    raise exception 'invalid_photo_path';
  end if;

  select * into v_item from items where id = v_tx.item_id;

  update transactions
     set status = 'DELIVERED',
         pickup_photo_path = p_photo_path,
         delivered_at = now(),
         payment_status = case when v_item.item_type = 'RENT' then 'CAPTURED' else 'NONE' end::payment_status
   where id = v_tx.id
   returning * into v_tx;

  if v_item.item_type = 'GIFT' then
    update items set status = 'COMPLETED' where id = v_item.id;
  end if;

  select * into v_conv
  from conversations
  where item_id = v_tx.item_id
    and requester_id = case
      when v_tx.initiated_by = v_tx.owner_id then v_tx.owner_id else v_tx.borrower_id end
  limit 1;

  if found then
    insert into messages (conversation_id, sender_id, kind, transaction_id, photo_path)
    values (v_conv.id, auth.uid(), 'PICKUP_PHOTO', v_tx.id, p_photo_path);
  end if;

  return v_tx;
end;
$$;

-- The owner records the item coming back. LEND and RENT only.
create or replace function confirm_return(p_transaction_id uuid, p_photo_path text)
returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx   transactions;
  v_item items;
  v_conv conversations;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_tx from transactions where id = p_transaction_id for update;
  if not found or auth.uid() not in (v_tx.owner_id, v_tx.borrower_id) then
    raise exception 'transaction_not_found';
  end if;
  if auth.uid() <> v_tx.owner_id then
    raise exception 'owner_only';
  end if;
  if v_tx.status <> 'DELIVERED' then
    raise exception 'invalid_transition';
  end if;

  select * into v_item from items where id = v_tx.item_id;
  if v_item.item_type = 'GIFT' then
    raise exception 'invalid_transition';
  end if;
  if p_photo_path is null or p_photo_path not like 'transactions/' || v_tx.id || '/%' then
    raise exception 'invalid_photo_path';
  end if;

  update transactions
     set status = 'RETURNED',
         return_photo_path = p_photo_path,
         returned_at = now()
   where id = v_tx.id
   returning * into v_tx;

  update items set status = 'ACTIVE' where id = v_item.id;

  select * into v_conv
  from conversations
  where item_id = v_tx.item_id
    and requester_id = case
      when v_tx.initiated_by = v_tx.owner_id then v_tx.owner_id else v_tx.borrower_id end
  limit 1;

  if found then
    insert into messages (conversation_id, sender_id, kind, transaction_id, photo_path)
    values (v_conv.id, auth.uid(), 'RETURN_PHOTO', v_tx.id, p_photo_path);
  end if;

  return v_tx;
end;
$$;

-- Either party may back out before the handover.
create or replace function cancel_transaction(p_transaction_id uuid)
returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx   transactions;
  v_conv conversations;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_tx from transactions where id = p_transaction_id for update;
  if not found or auth.uid() not in (v_tx.owner_id, v_tx.borrower_id) then
    raise exception 'transaction_not_found';
  end if;
  if v_tx.status not in ('PENDING', 'ACCEPTED') then
    raise exception 'invalid_transition';
  end if;

  update transactions
     set status = 'CANCELLED'
   where id = v_tx.id
   returning * into v_tx;

  -- Free the listing again if the cancelled request was the one holding it.
  update items
     set status = 'ACTIVE'
   where id = v_tx.item_id
     and status = 'RESERVED';

  select * into v_conv
  from conversations
  where item_id = v_tx.item_id
    and requester_id = case
      when v_tx.initiated_by = v_tx.owner_id then v_tx.owner_id else v_tx.borrower_id end
  limit 1;

  if found then
    insert into messages (conversation_id, sender_id, kind, transaction_id)
    values (v_conv.id, auth.uid(), 'SYSTEM', v_tx.id);
  end if;

  return v_tx;
end;
$$;

-- ------------------------------------------------------------- grants --

revoke all on function nearby_items(double precision, double precision, integer, request_type, item_type[], integer, integer) from public;
revoke all on function group_items(uuid, request_type, item_type[], double precision, double precision, integer, integer) from public;
revoke all on function generate_invite_code() from public;
revoke all on function create_group(text) from public;
revoke all on function join_group(text) from public;
revoke all on function ensure_conversation(uuid) from public;
revoke all on function request_transaction(uuid, date, date, text) from public;
revoke all on function respond_transaction(uuid, boolean) from public;
revoke all on function confirm_pickup(uuid, text) from public;
revoke all on function confirm_return(uuid, text) from public;
revoke all on function cancel_transaction(uuid) from public;

grant execute on function nearby_items(double precision, double precision, integer, request_type, item_type[], integer, integer) to authenticated;
grant execute on function group_items(uuid, request_type, item_type[], double precision, double precision, integer, integer) to authenticated;
grant execute on function create_group(text) to authenticated;
grant execute on function join_group(text) to authenticated;
grant execute on function ensure_conversation(uuid) to authenticated;
grant execute on function request_transaction(uuid, date, date, text) to authenticated;
grant execute on function respond_transaction(uuid, boolean) to authenticated;
grant execute on function confirm_pickup(uuid, text) to authenticated;
grant execute on function confirm_return(uuid, text) to authenticated;
grant execute on function cancel_transaction(uuid) to authenticated;
