# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# What this is

NeighborLend: a hyper-local sharing network. Neighbours gift, lend or rent things to each
other (the 3x2 matrix: GIFT / LEND / RENT × OFFER / WANTED), inside a GPS radius or inside a
closed invite-code group. The PRD is `docs/PRD.md`; read it before touching a flow.

# Stack

Expo Router (typed routes) on Expo SDK 57, React 19, React Native 0.86, TypeScript strict.
Supabase is the planned backend — auth, Postgres with PostGIS, RLS, storage
(`supabase/migrations/`). Zustand for client state, `react-i18next` for copy.

# Phases

Work happens in four phases. Each has a definition of done and rules that apply only once it
starts; do not pull a later phase's work forward without being asked.

## Phase 1 — UI first (done)

Every screen was built on mock data first, then wired. **New screens still follow this**: design it,
screenshot it in the simulator, then connect it to the store.

## Phase 2 — Backend (done, local stack)

The app runs on Supabase end to end; `src/mock/` is gone. What exists and why:

- **Migrations** `0001`–`0008`: schema, RLS, RPCs, storage, the designed features (multi-group
  `item_groups`, closed days, reviews, read markers, fuzzed pins), column-level grants that hide
  exact coordinates (`0006`), a trigger that freezes what a SYSTEM line says (`0007`), and reserved listings that stay visible but sort last with a `reserved_until` date (`0008`). Never
  edit an applied migration; add the next number.
- **Tests**: `npm run db:test` runs `supabase/tests/*.test.sql` (pgTAP) against the seed, each
  sensitive rule with a NEGATIVE case. Add one whenever a policy or RPC changes.
- **Sign-in is email only**: a 6-digit code, never a password or a link. Phone/SMS was removed on
  purpose (every SMS is billed; indie budget) and is disabled in `config.toml`; do not add it
  back unless asked. A new address becomes an account on verification. The code email template is
  `supabase/templates/otp.html`. The root layout's auth guard sends a user who loses their session
  back to Welcome. Production needs a real SMTP sender (Supabase's built-in one allows only a
  handful of emails per hour).
- **Seed** `supabase/seed.sql` mirrors the old mock data, dates relative to today. Accounts:
  melih@, ayse@, mehmet@, zeynep@, can@, elif@`neighborlend.test`; the code lands in Mailpit,
  http://127.0.0.1:54524. Any other address is a brand-new sign-up.
- **Types**: `npx supabase gen types typescript --local > src/services/supabase/database.generated.ts`
  after every migration. Nothing hand-written lives in that file.
- **Services** `src/services/supabase/`, one file per noun, every call throws `AppError` with a
  code from `errors.ts`; the UI shows `errors.codes.<code>`. Row → domain mapping lives only in
  `mappers.ts`.
- **Store** `src/stores/session.ts` (`useSession`): caches plus async actions. Screens call
  `load*` on focus and never call Supabase directly.
- **Realtime**: an open thread subscribes to its messages and its listing's transactions; the tab
  layout keeps one inbox subscription for the badge. Card actions do not append optimistically;
  the server's SYSTEM line arrives over Realtime.
- **Photos**: resized on device (`storage.ts`), uploaded as ArrayBuffer. Handover photos are
  private and shown through signed URLs; listing images and avatars are public.
- **Dev shortcuts** in `src/dev/route.ts`: `DEV_EMAIL` signs in with a seeded address on launch
  (reading the code from Mailpit), `DEV_ROUTE` jumps to a screen. Both stay `null` in commits.
- **Splash**: the native splash (`assets/splash-icon.png`, `imageWidth` 96 in `app.json`) hands
  off to `AnimatedSplash`, which must render the identical mark first. Change the size or the
  artwork in both places together, then rebuild natively (`expo prebuild -p ios --clean`).

Rules that are not obvious from the code:
- Exact coordinates never leave the database. `items.location` and `profiles.home_location` have
  no SELECT grant; distance and the ~100 m pin come only from `nearby_items`, `group_items` and
  `item_positions`. Never select `*` from `items`; use `ITEM_COLUMNS`.
- All transaction state changes go through the RPCs; there is no update grant on `transactions`.
- Clients insert only `kind = 'TEXT'` messages; cards come from the RPCs.
- **Map view never loads "all items".** When the map grows past the demo, add an
  `items_in_bounds(min_lat, min_lng, max_lat, max_lng, zoom)` RPC called from `onCameraMove`
  with a ~300 ms debounce, returning server-side clusters (PostGIS `ST_SnapToGrid` or
  `ST_ClusterKMeans`) below a zoom threshold, at most ~100 rows either way. Keep the client
  rules: markers memoised on data only, focus in separate state, camera captured once,
  `MAX_PINS` as a last-resort cap.
- Environments follow Vouch: `.env.local` (local stack, LAN IP) and `.env.production`
  (hosted), no bare `.env`. **`supabase db reset --linked` wipes production**; only `db push`
  may target it. There is no hosted project yet.

Known gaps carried into Phase 3: editing a listing (the Edit button opens an empty create form),
account deletion (Settings says so honestly), push notifications, older-message paging in chat.

## Phase 3 — Hardening and release

- Push notifications (request, accept, message) via Expo push or FCM, driven by DB
  triggers, with a device-token table and a migration for it.
- Offline: MMKV session storage (`react-native-mmkv` is installed but unused), a queued
  retry for handover-photo uploads, an offline banner. Domain data is never cached in MMKV.
- Error and empty states for every network call (the `errors.*` keys exist), Crashlytics or
  Sentry, analytics events for the funnel (view listing → request → accept → handover).
- Store requirements: block/report are already modelled; add account deletion that really
  deletes (an edge function with the service role), privacy policy and terms URLs in
  Settings, camera/photo/location permission copy in `app.json`.
- EAS build profiles, TestFlight and internal testing track; a release checklist in
  `docs/release.md`.

## Phase 4 — Post-MVP (UI designed, no backend)

The screens exist on mock data — ratings and public profiles, the map view, multi-group
visibility, the availability calendar, sharing — see PRD §8. **In-app payment and the wallet
were designed and then removed on purpose**: as an indie developer the user will not take on
a payment provider now, so RENT is cash at the handover and the UI says so. Do not bring
payment UI back unless asked. Each remaining item needs a product decision before it is
wired: rating rules, how far to fuzz map pins. Backend work they will need: a `reviews` table with one-review-per-transaction-per-direction, an
`item_groups` join table replacing `items.group_id`, an `item_unavailable_dates` table
checked inside `request_transaction`, and a fuzzed `approx_location` column returned by
the feed RPCs. Do not start any of it until asked.

# Routes

`app/` holds: `welcome`, `auth/{phone,otp,profile,location}`, `(tabs)/{index,chats,create,groups,profile}`,
`item/[id]`, `request/[itemId]` (modal), `chat/[id]`, `camera` (fullScreenModal), `search`,
`transactions`, `group/{join,create,[id]}`, `settings`, `report` (modal), `user/[id]`,
`reviews/[userId]`, `review/[transactionId]` (modal), `availability/[itemId]`. Register every new
route in `app/_layout.tsx` with its presentation. Sheets (`presentation: 'modal'`) are for quick
interruptions of the current screen; anything the user will spend time in is a push.

# Performance

Every screen and component is written to cause the fewest performance problems possible.
This is a rule, not a cleanup pass. Concretely:

- **Store selectors return stable references.** Never `filter`/`map`/`reduce` to an
  array or object inside a `useMockSession` (later Supabase) selector — it returns a new
  reference every render and re-renders forever (this already bit Profile and Group
  detail). Select the raw slice, derive with `useMemo`. Numbers, strings and `find`
  results are fine.
- **Lists are `FlatList`/`FlashList`, never a mapped `ScrollView`,** once they can exceed a
  screen. `renderItem` gets a stable callback, rows are `React.memo` where props are
  primitives, `keyExtractor` uses the id, and `getItemLayout` is set when row height is
  fixed. Heavy header/filter UI lives in `ListHeaderComponent`, not above the list.
- **No new objects in render.** Styles come from the sibling `.styles.ts`
  (`StyleSheet.create` runs once); inline style objects are only for values that truly
  depend on runtime numbers (an image width, a safe-area inset). Callbacks passed to
  children come from `useCallback`; derived arrays from `useMemo`.
- **Images go through `expo-image`** with an explicit size, `contentFit`, and a short
  `transition`; feed thumbnails never load the full-size asset once the backend is wired.
- **Animation stays on the UI thread**: `react-native-reanimated` (`useSharedValue`,
  `withSpring`, layout animations), never `Animated` from React Native with
  `useNativeDriver: false`, and never state-driven animation on the JS thread.
- **Keep the JS thread free on navigation.** Nothing synchronous and heavy in a route's
  render or first effect; defer non-critical work with `InteractionManager` or after the
  first frame. Screens render a skeleton immediately rather than blocking on data.
- **Text input is uncontrolled where it can be** (chat composer, search) if typing lags;
  otherwise keep the controlled state local to the input's screen, never in the store.
- **Measure before optimising further**: Metro's perf monitor for JS FPS, Xcode Instruments
  for native; a fix without a measurement is a guess. Run the `react-native-best-practices`
  skill's checklist when touching lists, animations or anything that re-renders often.

# Styling

Plain `StyleSheet.create` plus the tokens in `src/theme/tokens.ts` (`colors`, `spacing`,
`radius`, `touchTarget`, `type`, `shadow`). No NativeWind, no inline hex colours, no raw
pixel numbers for spacing/radius/font size — use the tokens or extend them.

The design rules the tokens encode, from the `mobile-app-ui-design` skill:

- **60/30/10**: canvas is 60 %, ink (text, primary buttons) 30 %, leaf-green accent 10 %.
  The accent goes on *one* action per screen — the one in the thumb zone.
- **8-point grid**: `spacing.*` only. Related things 8–12 apart, sections 32 apart.
- **Four sizes, two weights**: `AppText` variants only; never set `fontSize` on a screen.
- **44 pt minimum tap target**, 56 pt for the pinned primary CTA.
- **Mode colours**: GIFT rose, LEND blue, RENT amber — on badges and tints only, never as
  a fill behind body text.

Every `StyleSheet.create` lives in a sibling `<Name>.styles.ts`, never inline. For
`src/components/` that file sits next to the component. For `app/` routes it cannot (Expo
Router treats every file under `app/` as a route), so screen styles live under
`src/screens/`, mirroring the route path: `app/(tabs)/index.tsx` →
`src/screens/tabs/index.styles.ts`, `app/item/[id].tsx` → `src/screens/item/[id].styles.ts`.

# Component structure

`src/components/` is tiered — `atoms/` (no custom deps), `molecules/` (composed patterns),
`organisms/` (page structure; `Screen` is the frame every route renders through). Each tier
has a barrel and `src/components/index.ts` re-exports them — always import from
`src/components`, never a tier folder.

# i18n

Every user-facing string goes through `react-i18next`. Keys live in
`src/i18n/locales/tr.ts` (the source of truth) and `en.ts`, which is typed as `typeof tr`
so a missing key is a compile error. Turkish is the default language.

# TypeScript & imports

Strict mode, no `any`, no non-null `!`. Relative imports, external packages first, blank
line, then local. `interface` for props, `type` for unions.

# Comments

Every function, hook and exported component gets a `/** */` doc comment saying what it does.
Inline comments are for *why*, not *what*.

# Commands

```bash
npm run typecheck     # tsc --noEmit — run before calling anything done
npm run ios           # expo run:ios (dev client; Expo Go is not used)
npm run android
npm run db:start      # local Supabase (needs Docker); ports are defaults +200
npm run db:reset      # apply migrations + seed
```
