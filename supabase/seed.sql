-- Local development data. Loaded by `supabase db reset`, never by a migration.
--
-- Mirrors src/mock/data.ts so the app looks the same the day it switches from
-- mock to Supabase. Dates are relative to today so the seed never goes stale.
--
-- Sign in by email; the 6-digit code arrives in Mailpit, http://127.0.0.1:54524.
--   melih@streetshelf.test   Melih (the main account)
--   ayse@streetshelf.test    Ayşe K.
--   mehmet@streetshelf.test  Mehmet D.
--   zeynep@streetshelf.test  Zeynep A.
--   can@streetshelf.test     Can Y.
--   elif@streetshelf.test    Elif S.
-- Any other address is a brand-new sign-up.
--
-- Invite codes: PRK7B2 (Melih is a member), ODTU26 (Melih is not — try joining).
--
-- Runs as `postgres`, so RLS is bypassed and no impersonation is needed.

set search_path = public, extensions;

-- ------------------------------------------------------------- accounts --

-- The token columns must be empty strings, not null: some GoTrue builds read
-- them into non-nullable strings and fail the login with nothing in the logs.
insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_sso_user, is_anonymous,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  u.email, now(),
  now() - u.age, now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  -- onboarded: these people already set their name and location, so the
  -- app must not send them through the profile step again.
  jsonb_build_object('display_name', u.name, 'onboarded', true),
  false, false, '', '', '', '', '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'melih@streetshelf.test', 'Melih',     interval '207 days'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'ayse@streetshelf.test', 'Ayşe K.',   interval '167 days'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'mehmet@streetshelf.test', 'Mehmet D.', interval '219 days'),
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'zeynep@streetshelf.test', 'Zeynep A.', interval '116 days'),
  ('a0000000-0000-4000-8000-000000000005'::uuid, 'can@streetshelf.test', 'Can Y.',    interval '243 days'),
  ('a0000000-0000-4000-8000-000000000006'::uuid, 'elif@streetshelf.test', 'Elif S.',   interval '15 days')
) as u(id, email, name, age);

insert into auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at, last_sign_in_at)
select gen_random_uuid(), u.id, 'email', u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.id::text like 'a0000000-%';

-- Profiles already exist via the on_auth_user_created trigger; fill in the rest.
update profiles p set
  avatar_path = v.avatar,
  area = v.area,
  created_at = u.created_at,
  home_location = st_setsrid(st_makepoint(32.8386, 39.8676), 4326)::geography
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'https://i.pravatar.cc/120?img=12', 'Çankaya · Park Oran'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'https://i.pravatar.cc/120?img=47', 'Çankaya · Park Oran'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'https://i.pravatar.cc/120?img=33', 'Çankaya · Oran'),
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'https://i.pravatar.cc/120?img=5',  'Çankaya · Park Oran'),
  ('a0000000-0000-4000-8000-000000000005'::uuid, 'https://i.pravatar.cc/120?img=68', 'Çankaya · ODTÜ'),
  ('a0000000-0000-4000-8000-000000000006'::uuid, 'https://i.pravatar.cc/120?img=9',  'Çankaya · Yıldız')
) as v(id, avatar, area)
join auth.users u on u.id = v.id
where p.id = v.id;

-- --------------------------------------------------------------- groups --

insert into groups (id, name, invite_code, created_by) values
  ('b0000000-0000-4000-8000-000000000001', 'Park Oran B Blok', 'PRK7B2', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'ODTÜ Kampüs',      'ODTU26', 'a0000000-0000-4000-8000-000000000005');

insert into group_members (group_id, user_id, role) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'ADMIN'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'MEMBER'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'MEMBER'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'MEMBER'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'ADMIN'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000006', 'MEMBER');

-- ---------------------------------------------------------------- items --

-- Positions are projected from Melih's home at the mock distance and a fixed
-- bearing, so the feed's "250 m" labels match the mock ones.
insert into items (id, owner_id, title, description, images, item_type, request_type, price_per_day, is_group_only, location, status, created_at)
select
  v.id, v.owner, v.title, v.description, v.images, v.itype::item_type, v.rtype::request_type,
  v.price, v.group_only,
  st_project(st_setsrid(st_makepoint(32.8386, 39.8676), 4326)::geography, v.dist, radians(v.bearing)),
  v.status::item_status,
  now() - v.age
from (values
  ('c0000000-0000-4000-8000-000000000001'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, 'Bosch darbeli matkap',
   'Beton delebilen darbeli matkap, 6-8-10 mm uçlar dahil. Hafta içi akşam teslim edebilirim.',
   array['https://picsum.photos/seed/drill/800/600', 'https://picsum.photos/seed/drill2/800/600'], 'RENT', 'OFFER', 150::numeric, false, 250, 40, 'RESERVED', interval '17 hours'),
  ('c0000000-0000-4000-8000-000000000002'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, '4 kişilik kamp çadırı',
   'Quechua 2 Seconds, iki kez kullanıldı. Hafta sonu için ödünç verebilirim.',
   array['https://picsum.photos/seed/tent/800/600'], 'LEND', 'OFFER', null, false, 400, 110, 'ACTIVE', interval '1 day 2 hours'),
  ('c0000000-0000-4000-8000-000000000003'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, 'Bebek arabası (Chicco)',
   'Çocuğumuz büyüdü, ihtiyacı olan bir komşuya hediye. Temiz ve sağlam.',
   array['https://picsum.photos/seed/stroller/800/600'], 'GIFT', 'OFFER', null, true, 50, 300, 'ACTIVE', interval '2 days'),
  ('c0000000-0000-4000-8000-000000000004'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, 'Projeksiyon cihazı + perde',
   'Xiaomi Mi Smart Projector 2. Film gecesi için ideal, HDMI kablo dahil.',
   array['https://picsum.photos/seed/projector/800/600'], 'RENT', 'OFFER', 200, false, 800, 330, 'ACTIVE', interval '3 days'),
  ('c0000000-0000-4000-8000-000000000005'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, 'Alüminyum merdiven 3 basamak',
   'Tavan lambası, perde askısı için yeterli. Aynı gün iade tercih ederim.',
   array['https://picsum.photos/seed/ladder/800/600'], 'LEND', 'OFFER', null, false, 150, 200, 'RESERVED', interval '3 days 10 hours'),
  ('c0000000-0000-4000-8000-000000000006'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, 'Roman kutusu (24 kitap)',
   'Okunmuş, iyi durumda Türkçe romanlar. Bir kutu, tek seferde alınmalı.',
   array['https://picsum.photos/seed/books/800/600'], 'GIFT', 'OFFER', null, false, 400, 80, 'ACTIVE', interval '4 days'),
  ('c0000000-0000-4000-8000-000000000007'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, 'Halı yıkama makinesi',
   'Kärcher SE 4. Deterjanı sizden. Kullanımı 2 dakikada anlatırım.',
   array['https://picsum.photos/seed/carpet/800/600'], 'RENT', 'OFFER', 250, false, 1200, 150, 'ACTIVE', interval '5 days'),
  ('c0000000-0000-4000-8000-000000000008'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, 'Şehir bisikleti 28 jant',
   'Kilit ve kask dahil. Kampüs içi kullanım için.',
   array['https://picsum.photos/seed/bike/800/600'], 'LEND', 'OFFER', null, true, 2100, 240, 'ACTIVE', interval '6 days'),
  -- WANTED
  ('c0000000-0000-4000-8000-000000000011'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, 'Hafta sonu için kamp çadırı',
   'Cumartesi-Pazar 2 kişilik yeter. Temiz iade sözü.', '{}'::text[], 'LEND', 'WANTED', null, false, 50, 10, 'ACTIVE', interval '14 hours'),
  ('c0000000-0000-4000-8000-000000000012'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, 'Taşınma için el arabası',
   '2 günlüğüne, günlük 100₺''ye kadar verebilirim.', '{}'::text[], 'RENT', 'WANTED', 100, false, 150, 170, 'ACTIVE', interval '23 hours'),
  ('c0000000-0000-4000-8000-000000000013'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, 'Çocuk bisikleti 16 jant',
   'Kullanmadığınız bir bisiklet varsa memnuniyetle sahipleniriz.', '{}'::text[], 'GIFT', 'WANTED', null, true, 250, 60, 'ACTIVE', interval '2 days 1 hour'),
  ('c0000000-0000-4000-8000-000000000014'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, 'Uzatma kablosu 20 m',
   'Bahçe partisi için bir akşamlığına.', '{}'::text[], 'LEND', 'WANTED', null, false, 800, 290, 'ACTIVE', interval '2 days 14 hours'),
  -- Melih's own
  ('c0000000-0000-4000-8000-000000000021'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'Dikey süpürge (Dyson V8)',
   'Günlük kiralık, şarjı dolu teslim.', array['https://picsum.photos/seed/vacuum/800/600'], 'RENT', 'OFFER', 120, false, 0, 0, 'ACTIVE', interval '7 days'),
  ('c0000000-0000-4000-8000-000000000022'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'Masa tenisi seti',
   'Raket ve toplar, ağ dahil.', array['https://picsum.photos/seed/pingpong/800/600'], 'LEND', 'OFFER', null, true, 0, 0, 'ACTIVE', interval '10 days')
) as v(id, owner, title, description, images, itype, rtype, price, group_only, dist, bearing, status, age);

insert into item_groups (item_id, group_id) values
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000022', 'b0000000-0000-4000-8000-000000000001');

insert into item_unavailable_dates (item_id, day) values
  ('c0000000-0000-4000-8000-000000000001', current_date + 4),
  ('c0000000-0000-4000-8000-000000000001', current_date + 5),
  ('c0000000-0000-4000-8000-000000000001', current_date + 9);

-- --------------------------------------------------------- transactions --

insert into transactions (id, item_id, owner_id, borrower_id, initiated_by, status, start_date, end_date,
                          price_per_day_snapshot, total_amount, pickup_photo_path, return_photo_path,
                          responded_at, delivered_at, returned_at, created_at) values
  -- Melih rents Mehmet's drill this weekend; accepted, waiting for handover.
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'ACCEPTED', current_date + 2, current_date + 3, 150, 300, null, null,
   now() - interval '14 hours', null, null, now() - interval '15 hours'),
  -- Ayşe asks to borrow Melih's table tennis set; pending on Melih.
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000022',
   'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'PENDING', current_date + 1, current_date + 1, null, 0, null, null,
   null, null, null, now() - interval '50 minutes'),
  -- Melih has Elif's ladder right now; return pending.
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000005',
   'a0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'DELIVERED', current_date - 1, current_date, null, 0, 'https://picsum.photos/seed/handover1/800/600', null,
   now() - interval '2 days', now() - interval '20 hours', null, now() - interval '2 days 1 hour'),
  -- Finished rental of Can's projector, ready to be rated.
  ('d0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004',
   'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'RETURNED', current_date - 13, current_date - 12, 200, 400,
   'https://picsum.photos/seed/handover2/800/600', 'https://picsum.photos/seed/handover3/800/600',
   now() - interval '14 days', now() - interval '13 days', now() - interval '12 days', now() - interval '14 days 1 hour'),
  -- Past handovers that the reviews below hang off.
  ('d0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000021',
   'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'RETURNED', current_date - 12, current_date - 11, 120, 240, null, null, now() - interval '13 days', now() - interval '12 days', now() - interval '11 days', now() - interval '13 days'),
  ('d0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000021',
   'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000005',
   'RETURNED', current_date - 24, current_date - 23, 120, 240, null, null, now() - interval '25 days', now() - interval '24 days', now() - interval '23 days', now() - interval '25 days'),
  ('d0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000022',
   'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004',
   'RETURNED', current_date - 36, current_date - 36, null, 0, null, null, now() - interval '37 days', now() - interval '36 days', now() - interval '36 days', now() - interval '37 days'),
  ('d0000000-0000-4000-8000-000000000014', 'c0000000-0000-4000-8000-000000000007',
   'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'RETURNED', current_date - 27, current_date - 26, 250, 500, null, null, now() - interval '28 days', now() - interval '27 days', now() - interval '26 days', now() - interval '28 days'),
  ('d0000000-0000-4000-8000-000000000015', 'c0000000-0000-4000-8000-000000000007',
   'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000006',
   'RETURNED', current_date - 45, current_date - 44, 250, 500, null, null, now() - interval '46 days', now() - interval '45 days', now() - interval '44 days', now() - interval '46 days');

-- ------------------------------------------------------------- reviews --

insert into reviews (transaction_id, from_id, to_id, rating, tags, comment, created_at) values
  ('d0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 5, array['punctual', 'careful'], 'Süpürgeyi şarjı dolu ve tertemiz teslim etti, teşekkürler.', now() - interval '11 days'),
  ('d0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 5, array['communicative'], null, now() - interval '23 days'),
  ('d0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 4, array['asDescribed'], 'Her şey yolundaydı.', now() - interval '36 days'),
  ('d0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 5, array['punctual', 'asDescribed'], 'Matkap tarif edildiği gibiydi, uçlar da vardı.', now() - interval '26 days'),
  ('d0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', 5, array['careful'], null, now() - interval '44 days');

-- ------------------------------------------------------- conversations --

insert into conversations (id, item_id, owner_id, requester_id, created_at) values
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', now() - interval '16 hours'),
  ('e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', now() - interval '1 hour'),
  ('e0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', now() - interval '2 days 2 hours'),
  ('e0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', now() - interval '14 days 2 hours');

-- The bump trigger keeps last_message_at in step as these go in.
insert into messages (conversation_id, sender_id, kind, body, transaction_id, photo_path, created_at) values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'TEXT', 'Merhaba, matkabı hafta sonu 2 günlüğüne alabilir miyim?', null, null, now() - interval '15 hours 1 minute'),
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'REQUEST', null, 'd0000000-0000-4000-8000-000000000001', null, now() - interval '15 hours'),
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'TEXT', 'Tabii, uçları da veririm.', null, null, now() - interval '14 hours 1 minute'),
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'SYSTEM', 'ACCEPTED', 'd0000000-0000-4000-8000-000000000001', null, now() - interval '14 hours'),
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'TEXT', 'Cumartesi 10 gibi kapıda olurum.', null, null, now() - interval '20 minutes'),

  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'TEXT', 'Masa tenisi setini yarın alabilir miyim?', null, null, now() - interval '51 minutes'),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'REQUEST', null, 'd0000000-0000-4000-8000-000000000002', null, now() - interval '50 minutes'),

  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'REQUEST', null, 'd0000000-0000-4000-8000-000000000003', null, now() - interval '2 days 1 hour'),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'SYSTEM', 'ACCEPTED', 'd0000000-0000-4000-8000-000000000003', null, now() - interval '2 days'),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'PICKUP_PHOTO', null, 'd0000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/handover1/800/600', now() - interval '20 hours'),

  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'REQUEST', null, 'd0000000-0000-4000-8000-000000000004', null, now() - interval '14 days 1 hour'),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', 'SYSTEM', 'ACCEPTED', 'd0000000-0000-4000-8000-000000000004', null, now() - interval '14 days'),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', 'PICKUP_PHOTO', null, 'd0000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/handover2/800/600', now() - interval '13 days'),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', 'RETURN_PHOTO', null, 'd0000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/handover3/800/600', now() - interval '12 days');

-- Melih has read everything except Mehmet's last line and Ayşe's request.
insert into conversation_reads (conversation_id, user_id, last_read_at) values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', now() - interval '13 hours'),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', now()),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', now());
