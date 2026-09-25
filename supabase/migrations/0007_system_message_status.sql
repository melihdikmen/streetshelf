-- NeighborLend — a SYSTEM line remembers what happened
--
-- SYSTEM messages ("Mehmet accepted the request") were rendered from the
-- transaction's *current* status, so once the item was handed over, the old
-- "accepted" line in the thread started saying "handed over". The event has
-- to be frozen when it happens.
--
-- Every SYSTEM insert comes from an RPC that has just changed the status, so
-- stamping the status into `body` at insert time records exactly the event.
-- A trigger rather than edits to each RPC keeps the four functions untouched.

create or replace function stamp_system_message()
returns trigger
language plpgsql
as $$
begin
  if new.kind = 'SYSTEM' and new.body is null and new.transaction_id is not null then
    select status::text into new.body from transactions where id = new.transaction_id;
  end if;
  return new;
end;
$$;

create trigger messages_stamp_system
  before insert on messages
  for each row execute function stamp_system_message();
