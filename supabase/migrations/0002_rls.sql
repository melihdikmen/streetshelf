-- NeighborLend — row level security
--
-- The anon key ships inside the app, so these policies are the only thing
-- between one neighbour's data and another's. Shapes of access:
--
--   * Anyone signed in may read public listings and the profiles behind them.
--   * Group-only listings are visible to that group's members only.
--   * A transaction and a conversation are visible to their two parties only.
--   * Nobody edits state machines directly — transactions move through the
--     RPCs in 0003, which are the only writers of `status`.

alter table profiles      enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;
alter table items         enable row level security;
alter table transactions  enable row level security;
alter table conversations enable row level security;
alter table messages      enable row level security;
alter table blocks        enable row level security;
alter table reports       enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- ------------------------------------------------------------------ helpers --

-- SECURITY DEFINER: `group_members` has its own policy that only shows the
-- caller's rows, which is exactly enough to answer this without recursion.
create or replace function is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function is_transaction_party(p_transaction_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from transactions
    where id = p_transaction_id
      and auth.uid() in (owner_id, borrower_id)
  );
$$;

create or replace function is_conversation_party(p_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from conversations
    where id = p_conversation_id
      and auth.uid() in (owner_id, requester_id)
  );
$$;

-- Either direction: I blocked them, or they blocked me. Used to hide people
-- from each other symmetrically.
create or replace function is_blocked_either_way(p_other uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from blocks
    where (blocker_id = auth.uid() and blocked_id = p_other)
       or (blocker_id = p_other and blocked_id = auth.uid())
  );
$$;

-- ---------------------------------------------------------------- profiles --

-- Profiles are public within the app: a listing card shows who is offering.
-- Phone numbers are never stored here at all — that is the PRD's privacy
-- promise, kept structurally rather than by policy.
create policy "profiles: readable by signed-in users"
  on profiles for select to authenticated
  using (true);

create policy "profiles: owner updates own"
  on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ------------------------------------------------------------------ groups --

-- A group row is readable only by its members. Joining is by invite code
-- through `join_group`, which is SECURITY DEFINER and looks the code up
-- itself — so the code cannot be brute-forced by scanning this table.
create policy "groups: members read"
  on groups for select to authenticated
  using (is_group_member(id));

create policy "group_members: see own memberships"
  on group_members for select to authenticated
  using (user_id = auth.uid() or is_group_member(group_id));

create policy "group_members: leave"
  on group_members for delete to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------------- items --

create policy "items: public or my group or mine"
  on items for select to authenticated
  using (
    owner_id = auth.uid()
    or (
      not is_blocked_either_way(owner_id)
      and (
        (not is_group_only)
        or is_group_member(group_id)
      )
    )
  );

create policy "items: owner inserts"
  on items for insert to authenticated
  with check (
    owner_id = auth.uid()
    and status = 'ACTIVE'
    and (group_id is null or is_group_member(group_id))
  );

-- Owners edit copy, photos, price and archive their listing. `status` is
-- also driven by the transaction RPCs, which run as definer and bypass this.
create policy "items: owner updates"
  on items for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "items: owner deletes"
  on items for delete to authenticated
  using (owner_id = auth.uid());

-- ------------------------------------------------------------ transactions --

create policy "transactions: parties read"
  on transactions for select to authenticated
  using (auth.uid() in (owner_id, borrower_id));

-- No insert/update/delete policies on purpose: every state change goes
-- through the SECURITY DEFINER functions in 0003.

-- ----------------------------------------------------------- conversations --

create policy "conversations: parties read"
  on conversations for select to authenticated
  using (auth.uid() in (owner_id, requester_id));

-- Opening a thread is allowed directly (a plain "is this still available?"
-- needs no transaction), but only towards a listing the caller can see, and
-- only as the requester.
create policy "conversations: requester opens"
  on conversations for insert to authenticated
  with check (
    requester_id = auth.uid()
    and owner_id <> auth.uid()
    and not is_blocked_either_way(owner_id)
    and exists (
      select 1 from items
      where id = item_id and owner_id = conversations.owner_id
    )
  );

-- ---------------------------------------------------------------- messages --

create policy "messages: parties read"
  on messages for select to authenticated
  using (is_conversation_party(conversation_id));

-- Clients may only send plain text. Cards are inserted by the RPCs.
create policy "messages: parties send text"
  on messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and kind = 'TEXT'
    and is_conversation_party(conversation_id)
  );

-- ---------------------------------------------------------- trust & safety --

create policy "blocks: own"
  on blocks for all to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

create policy "reports: file own"
  on reports for insert to authenticated
  with check (reporter_id = auth.uid());

create policy "reports: read own"
  on reports for select to authenticated
  using (reporter_id = auth.uid());
