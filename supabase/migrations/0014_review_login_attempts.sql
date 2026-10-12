-- StreetShelf — failed attempts at the store-review sign-in
--
-- The app stores' reviewers cannot read an emailed code, so one fixed address
-- signs in through the `review-login` edge function with a code kept in the
-- function's secrets. A code that short can be guessed, so every wrong guess
-- is written here and the function refuses after a handful in a quarter hour.
-- Only the service role touches this table; no policy names any other role.

create table review_login_attempts (
  id bigint generated always as identity primary key,
  attempted_at timestamptz not null default now()
);

create index review_login_attempts_at_idx on review_login_attempts (attempted_at);

alter table review_login_attempts enable row level security;
revoke all on table review_login_attempts from anon, authenticated;
