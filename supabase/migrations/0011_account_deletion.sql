-- StreetShelf — deleting an account
--
-- The `delete-account` edge function calls `prepare_account_deletion` with the
-- service role, removes the returned files through the Storage API (storage
-- rows cannot be deleted from SQL), then deletes the auth user. Everything
-- else goes with the `on delete cascade` from auth.users → profiles: listings,
-- transactions, conversations, reviews, memberships, blocks and reports.
--
-- Two things the cascade would get wrong are settled here first:
--
--   * A handover in progress. Deleting someone who has a neighbour's ladder,
--     or whose drill a neighbour is about to collect, would erase the only
--     record of who has what. ACCEPTED and DELIVERED block deletion until the
--     thing is back or the request is cancelled; PENDING ones just go.
--   * Groups. `groups.created_by` cascades, so deleting a group's founder
--     would delete the group under every other member. It is handed to the
--     longest-standing remaining member instead, who becomes ADMIN. A group
--     with nobody else in it goes with its founder.

create or replace function prepare_account_deletion(p_user uuid)
returns table (bucket text, path text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_heir  uuid;
begin
  if not exists (select 1 from profiles where id = p_user) then
    raise exception 'not_signed_in';
  end if;

  if exists (
    select 1 from transactions
    where p_user in (owner_id, borrower_id)
      and status in ('ACCEPTED', 'DELIVERED')
  ) then
    raise exception 'active_transactions';
  end if;

  for v_group in select id from groups where created_by = p_user loop
    select user_id into v_heir
    from group_members
    where group_id = v_group and user_id <> p_user
    order by (role = 'ADMIN') desc, joined_at, user_id
    limit 1;

    if v_heir is not null then
      update groups set created_by = v_heir where id = v_group;
      update group_members set role = 'ADMIN' where group_id = v_group and user_id = v_heir;
    end if;
  end loop;

  -- Paths follow 0004: items/<user>/…, avatars/<user>.jpg, and
  -- transactions/<transaction>/… for every handover the user was part of
  -- (those transactions are deleted with the user, so the photos would be
  -- orphaned).
  return query
  select o.bucket_id::text, o.name::text
  from storage.objects o
  where (o.bucket_id = 'item-images' and o.name like 'items/' || p_user::text || '/%')
     or (o.bucket_id = 'avatars' and o.name = 'avatars/' || p_user::text || '.jpg')
     or (o.bucket_id = 'handover-photos' and (storage.foldername(o.name))[2] in (
          select t.id::text from transactions t where p_user in (t.owner_id, t.borrower_id)
        ));
end;
$$;

-- Only the edge function may call this: it takes any user id, and it is the
-- first step of something that cannot be undone.
revoke all on function prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function prepare_account_deletion(uuid) to service_role;

-- The cascade from profiles reaches transactions before it reaches the
-- conversations that show them, and clearing `messages.transaction_id` on a
-- REQUEST card breaks `messages_card_has_transaction`. Removing the person's
-- conversations first (with their cards) lets the rest cascade cleanly. Every
-- conversation about their listings has them as `owner_id`, so this also
-- covers threads the item cascade would reach.
create or replace function delete_profile_conversations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from conversations where old.id in (owner_id, requester_id);
  return old;
end;
$$;

create trigger profiles_delete_conversations
  before delete on profiles
  for each row execute function delete_profile_conversations();
