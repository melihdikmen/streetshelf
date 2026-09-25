-- NeighborLend — schema
--
-- One table per PRD noun. The 3x2 matrix (GIFT/LEND/RENT × OFFER/WANTED)
-- lives on `items`; the lifecycle of a single handover lives on
-- `transactions`; every conversation hangs off an item so the chat can embed
-- the transaction cards the PRD describes.
--
-- Locations are PostGIS geography points. The exact point is stored, but it
-- never leaves the database: `nearby_items` returns a distance rounded to
-- 50 m and no coordinates, so a neighbour learns "about 250 m away" and not
-- which door.

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------------- enums --

create type item_type          as enum ('GIFT', 'LEND', 'RENT');
create type request_type       as enum ('OFFER', 'WANTED');
create type item_status        as enum ('ACTIVE', 'RESERVED', 'COMPLETED', 'ARCHIVED');
create type transaction_status as enum (
  'PENDING', 'ACCEPTED', 'REJECTED', 'DELIVERED', 'RETURNED', 'CANCELLED'
);
-- MVP has no payment provider: RENT money changes hands in person and the
-- app only records that it did. The column exists so the flow does not have
-- to be redesigned when a PSP arrives.
create type payment_status     as enum ('NONE', 'HELD', 'CAPTURED', 'REFUNDED');
create type message_kind       as enum ('TEXT', 'REQUEST', 'PICKUP_PHOTO', 'RETURN_PHOTO', 'SYSTEM');
create type group_role         as enum ('ADMIN', 'MEMBER');

-- ----------------------------------------------------------------- helpers --

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- profiles --

create table profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text not null check (char_length(display_name) between 2 and 40),
  avatar_path     text,
  -- Where "near me" is measured from when the phone has no fix yet. Optional.
  home_location   extensions.geography(Point, 4326),
  search_radius_m integer not null default 1000
                  check (search_radius_m in (500, 1000, 2000, 5000)),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- A profile row appears the moment an auth user does, so no screen ever has
-- to handle "signed in but no profile". The display name is taken from the
-- sign-up metadata and falls back to the local part of the email.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, 'komsu'), '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------------ groups --

create table groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 60),
  invite_code text not null unique,
  created_by  uuid not null references profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table group_members (
  group_id  uuid not null references groups (id) on delete cascade,
  user_id   uuid not null references profiles (id) on delete cascade,
  role      group_role not null default 'MEMBER',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on group_members (user_id);

-- ------------------------------------------------------------------- items --

create table items (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 3 and 80),
  description   text not null default '' check (char_length(description) <= 2000),
  -- Storage object paths in the `item-images` bucket, in display order.
  images        text[] not null default '{}',
  item_type     item_type not null,
  request_type  request_type not null,
  -- For OFFER+RENT: the asking price. For WANTED+RENT: the most the
  -- requester will pay. Null for GIFT and LEND.
  price_per_day numeric(10, 2),
  currency      text not null default 'TRY',
  is_group_only boolean not null default false,
  group_id      uuid references groups (id) on delete set null,
  -- Required even for group-only listings: the card still shows a distance,
  -- and the map view planned for later needs somewhere to pin it.
  location      extensions.geography(Point, 4326) not null,
  status        item_status not null default 'ACTIVE',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint items_price_matches_type check (
    (item_type = 'RENT' and price_per_day is not null and price_per_day > 0)
    or (item_type <> 'RENT' and price_per_day is null)
  ),
  constraint items_group_matches_visibility check (
    (is_group_only and group_id is not null)
    or (not is_group_only and group_id is null)
  ),
  constraint items_max_images check (cardinality(images) <= 6)
);

create index items_location_idx on items using gist (location);
create index items_owner_idx    on items (owner_id);
create index items_group_idx    on items (group_id) where group_id is not null;
create index items_feed_idx     on items (request_type, status, created_at desc);

create trigger items_updated_at
  before update on items
  for each row execute function set_updated_at();

-- ------------------------------------------------------------ transactions --

-- One handover. `owner_id` is always the person who has the thing and
-- `borrower_id` always the person who receives it — regardless of who
-- opened the listing. For an OFFER the borrower initiates; for a WANTED
-- the owner does ("I have one, want it?"). `initiated_by` records which, so
-- the *other* party is the one who accepts.
create table transactions (
  id                     uuid primary key default gen_random_uuid(),
  item_id                uuid not null references items (id) on delete cascade,
  owner_id               uuid not null references profiles (id) on delete cascade,
  borrower_id            uuid not null references profiles (id) on delete cascade,
  initiated_by           uuid not null references profiles (id) on delete cascade,
  status                 transaction_status not null default 'PENDING',
  start_date             date not null,
  end_date               date not null,
  -- Snapshots: the listing may be edited after the request is made, and the
  -- agreed price must not move with it.
  price_per_day_snapshot numeric(10, 2),
  total_amount           numeric(10, 2) not null default 0,
  currency               text not null default 'TRY',
  payment_status         payment_status not null default 'NONE',
  pickup_photo_path      text,
  return_photo_path      text,
  responded_at           timestamptz,
  delivered_at           timestamptz,
  returned_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint transactions_two_parties check (owner_id <> borrower_id),
  constraint transactions_initiator_is_party check (initiated_by in (owner_id, borrower_id)),
  constraint transactions_date_order check (end_date >= start_date)
);

create index transactions_item_idx     on transactions (item_id);
create index transactions_owner_idx    on transactions (owner_id, status);
create index transactions_borrower_idx on transactions (borrower_id, status);

-- A pair may only have one live request per item at a time. Rejected and
-- cancelled ones do not count, so a "no" can be followed by a new "please?".
create unique index transactions_one_open_per_pair
  on transactions (item_id, borrower_id, owner_id)
  where status in ('PENDING', 'ACCEPTED', 'DELIVERED');

create trigger transactions_updated_at
  before update on transactions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------- messages --

-- One thread per (item, other person). The listing owner is always
-- `owner_id`, the person who reached out is `requester_id` — this is about
-- who started the conversation, not who ends up holding the item.
create table conversations (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references items (id) on delete cascade,
  owner_id        uuid not null references profiles (id) on delete cascade,
  requester_id    uuid not null references profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),

  constraint conversations_two_parties check (owner_id <> requester_id),
  unique (item_id, requester_id)
);

create index conversations_owner_idx     on conversations (owner_id, last_message_at desc);
create index conversations_requester_idx on conversations (requester_id, last_message_at desc);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id       uuid references profiles (id) on delete set null,
  kind            message_kind not null default 'TEXT',
  body            text check (char_length(body) <= 2000),
  -- Set for REQUEST / PICKUP_PHOTO / RETURN_PHOTO / SYSTEM cards, so the
  -- widget in the chat can render live status from the transaction row.
  transaction_id  uuid references transactions (id) on delete set null,
  -- Object path in the private `handover-photos` bucket.
  photo_path      text,
  created_at      timestamptz not null default now(),

  constraint messages_text_has_body check (kind <> 'TEXT' or body is not null),
  constraint messages_card_has_transaction check (
    kind in ('TEXT', 'SYSTEM') or transaction_id is not null
  ),
  constraint messages_photo_kinds_have_photo check (
    kind not in ('PICKUP_PHOTO', 'RETURN_PHOTO') or photo_path is not null
  )
);

create index messages_conversation_idx on messages (conversation_id, created_at);

create or replace function bump_conversation()
returns trigger
language plpgsql
as $$
begin
  update conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_bump_conversation
  after insert on messages
  for each row execute function bump_conversation();

-- ---------------------------------------------------------- trust & safety --

-- The stores require a way to block and report other users in any app with
-- user-generated content, so these ship with the MVP even though the UI for
-- them is a single button each.

create table blocks (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

create table reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  item_id     uuid references items (id) on delete cascade,
  user_id     uuid references profiles (id) on delete cascade,
  reason      text not null check (char_length(reason) between 3 and 1000),
  created_at  timestamptz not null default now(),
  constraint reports_has_target check (item_id is not null or user_id is not null)
);

-- ---------------------------------------------------------------- realtime --

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table transactions;
