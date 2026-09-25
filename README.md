# StreetShelf

Hyper-local sharing network: gift, lend or rent things to your neighbours, or post what you
need. Expo SDK 57 + Expo Router on Supabase. PRD in `docs/PRD.md`.

## Run

Needs Docker for the local Supabase stack.

```bash
npm install
npm run db:start      # local Supabase on ports 545xx, applies migrations + seed
cp .env.example .env.local   # then put your Mac's LAN IP in the URL
npm run ios           # dev client build
npm run db:test       # pgTAP: RLS and transaction flows
```

Sign in with melih@streetshelf.test; the code lands in Mailpit at http://127.0.0.1:54524.
Other accounts are listed in supabase/seed.sql.

## Layout

```
app/                 routes (Expo Router)
  (tabs)/            discover · chats · create · groups · profile
  item/[id]          listing detail
  chat/[id]          thread with transaction cards
  group/join         invite-code entry
src/components/      atoms / molecules / organisms
src/screens/         *.styles.ts for routes, mirroring app/
src/theme/tokens.ts  colours, spacing, radius, type
src/i18n/            tr (source) + en
src/services/        supabase/ (one file per noun), location
src/stores/          session.ts: caches + async actions over the services
supabase/migrations/ 0001–0008
supabase/tests/      pgTAP
docs/PRD.md          product spec v3.1
```
