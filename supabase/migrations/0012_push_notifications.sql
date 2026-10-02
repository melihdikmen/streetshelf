-- StreetShelf — push notifications
--
-- Every event worth a notification already writes a message: a text, a
-- REQUEST card, a SYSTEM line (accepted, declined, cancelled, returned), a
-- handover photo. So one trigger on `messages` drives every push, and the
-- RPCs stay untouched.
--
-- The trigger only queues an HTTP call (pg_net sends it after commit, from a
-- background worker); the `send-push` edge function looks up the recipient's
-- devices, writes the text in each device's language and sends it through
-- FCM (Firebase Messaging, which also delivers to iOS through the APNs key).
-- Where to call and with which secret comes from Vault, so the same migration
-- works locally (seed.sql stores the local values) and in production (stored
-- once by hand, see AGENTS.md). Without them the trigger does nothing.
--
-- The secret is a value of its own, not the service role key: it leaves the
-- database on every event, and if it leaks the most it can do is ask for a
-- push about a message that exists. A service key there could do anything.

create extension if not exists pg_net with schema extensions;

-- ------------------------------------------------------------- push_tokens --

-- One row per device. The token is the key, not (user, token): signing in as
-- someone else on the same phone moves the device to the new account, so
-- the previous one stops receiving that phone's notifications. `updated_at`
-- is refreshed by every registration (each launch with a session), so
-- `send-push` can drop devices nobody has opened the app on for 60 days.
create table push_tokens (
  token      text primary key check (char_length(token) between 10 and 4096),
  user_id    uuid not null references profiles (id) on delete cascade,
  platform   text not null check (platform in ('ios', 'android')),
  -- The app's language on that device, so the push reads like the app.
  locale     text not null default 'tr' check (locale in ('tr', 'en')),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_idx on push_tokens (user_id);

-- No policies: clients go through the two functions below, and only the
-- service role (the edge function) reads tokens.
alter table push_tokens enable row level security;

-- Registers this device for the signed-in user, or refreshes it.
create or replace function register_push_token(p_token text, p_platform text, p_locale text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  insert into push_tokens (token, user_id, platform, locale)
  values (p_token, auth.uid(), p_platform, case when p_locale = 'en' then 'en' else 'tr' end)
  on conflict (token) do update
    set user_id    = excluded.user_id,
        platform   = excluded.platform,
        locale     = excluded.locale,
        updated_at = now();
end;
$$;

-- Stops this device receiving the signed-in user's notifications (sign-out).
create or replace function unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from push_tokens where token = p_token and user_id = auth.uid();
$$;

revoke all on function register_push_token(text, text, text) from public;
revoke all on function unregister_push_token(text) from public;
grant execute on function register_push_token(text, text, text) to authenticated;
grant execute on function unregister_push_token(text) to authenticated;

-- ----------------------------------------------------------------- trigger --

create or replace function queue_message_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  -- A request's note is inserted just before its REQUEST card, in the same
  -- transaction (same `now()`). The card's push carries the note, so the
  -- note alone would be a second buzz for one event.
  if new.kind = 'TEXT' and exists (
    select 1 from messages m
    where m.conversation_id = new.conversation_id
      and m.kind = 'REQUEST'
      and m.created_at = new.created_at
  ) then
    return null;
  end if;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'push_function_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'push_function_secret';
  if v_url is null or v_secret is null then
    return null;
  end if;

  perform net.http_post(
    url     := v_url,
    body    := jsonb_build_object('message_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
    timeout_milliseconds := 5000
  );
  return null;
end;
$$;

-- Deferred to commit, so the REQUEST card exists when its note is checked,
-- and a rolled-back RPC never notifies anyone.
create constraint trigger messages_queue_push
  after insert on messages
  deferrable initially deferred
  for each row execute function queue_message_push();
