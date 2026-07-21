# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

Phase 6 — End-user shell

## Current Goal

28 — Explore empty states (no pins / filters hide all / outside coverage)

## Completed


- 01 — Next.js scaffold, Tailwind, shadcn/ui, env vars
- 02 — RestroomDirectory interface, adapter ports, Vitest harness
- 03 — Supabase core schema (PostGIS, enums, profiles, establishments, auth bootstrap trigger)
- 04 — Restrooms, photos, verifies, reviews, reports tables + RLS + aggregate triggers
- 05 — Storage buckets (`restroom-photos`, `review-photos`) + storage RLS policies
- 06 — `listNearby` with radius, filters, pin-variant classification, disputed exclusion
- 07 — `getRestroom` detail + `listSiblings` (photos, reviews newest-first, disputed flag, archived/missing → not_found)
- 08 — Google auth via Supabase (`/login`, `/auth/callback`, session proxy, `getSession`/`getUser`)
- 09 — Return-to-interrupted-flow and auth-gate utility (`safeReturnPath`, `loginHref`, `oauthCallbackHref`, `resolveAuthGate`/`requireAuth`, `next` through OAuth callback)
- 10 — `searchPlaces` + `findExistingForPlace` (Places autocomplete via adapter, active restrooms by `place_id`, auth required)
- 11 — `addRestroom` (establishment upsert by `place_id`, active + unverified listing, ≤3 seed photos)
- 12 — `verifyRestroom` + community-verified threshold (one verify/user, `verify_count`, community verified at ≥3)
- 13 — `upsertReview` with photos (one review/user, update-in-place, ≤3 photos, rating aggregates)
- 14 — `reportRestroom` + disputed status transition (open report → `disputed`; map exclusion; detail `isDisputed`)
- 15 — Creator edit/delete with community-activity gate (`updateRestroom` / `deleteRestroom`)
- 16 — Admin upsert / set status / remove photo (`adminUpsertRestroom`, `adminSetStatus`, `adminRemovePhoto`)
- 17 — `adminMerge` + `listOpenReports` (archive loser + `merged_into_id`, skip UNIQUE conflicts, recalculate aggregates; open report queue by `created_at`)
- 18 — `/admin` layout, role gate, and left nav (`profiles.is_admin`; Listings + Reports; non-admin → `/`)
- 19 — Admin listings seed/edit page (table + form; `listAdminRestrooms` + `adminUpsertRestroom`)
- 20 — Admin report queue page (`listOpenReports` + `updateReportStatus` + `adminSetStatus`; dismiss / mark reviewed)
- 21 — App shell: routes, mobile bottom tabs, desktop layout frame
- 22 — Explore top bar (brand, glass chrome, safe areas)
- 23 — Google Map canvas + geolocation + Metro Manila fallback
- 24 — Map pins from `listNearby` (bidet / standard / unverified)
- 25 — Radius selector wired to `listNearby`
- 26 — Filter chips wired to `listNearby`
- 27 — Desktop sidebar list (distance-sorted)

## In Progress

## Next Up

- 28 — Explore empty states (no pins / filters hide all / outside coverage)

## Open Questions

## Architecture Decisions

- App uses Next.js 16 App Router + Tailwind v4 + shadcn/ui (base-nova)
- Brand tokens: Fresh Teal `#006767` primary; Montserrat (headings) + Public Sans (body) via `next/font`
- Domain seam lives at `lib/restroom-directory` with Zod I/O schemas, adapter ports (Places, Postgres, Storage, Auth, Geolocation), and in-memory fakes for Vitest
- Supabase migrations under `supabase/migrations/`; core schema enables PostGIS, six domain enums, `profiles` + `establishments`, and `on_auth_user_created` profile bootstrap
- Domain tables migration adds `restrooms` (+ photos/verifies/reviews/reports), RLS (anon read / scoped auth writes / `is_admin` bypass), and triggers for `verify_count` + rating aggregates
- Storage buckets `restroom-photos` / `review-photos` are public; object paths `{entity_id}/{photo_id}.webp`; SELECT gated to published (`removed_at IS NULL`) + uploader/admin; INSERT scoped to entity ownership; soft-delete via photo-row `removed_at` (no authenticated storage DELETE)
- `listNearby` uses PostgresPort `findActiveRestroomsNear` (PostGIS `ST_DWithin` pattern); in-memory fake haversine stand-in seeds domain rows, excludes non-`active`, applies filters, and computes `hasBidet` / `communityVerified` / `pinVariant`
- `getRestroom` / `listSiblings` uses PostgresPort `findRestroomDetail` + `findActiveSiblings`; directory maps public photo URLs via StoragePort, sets `isDisputed` from status, treats archived/missing as `not_found`; siblings are other `active` restrooms at the same establishment
- Google OAuth via Supabase Auth + `@supabase/ssr`: JWT in HTTP-only cookies; root `proxy.ts` refreshes session; `/login` + `/auth/callback` (PKCE code exchange); `getSession` / `getUser` helpers for Server Actions
- Auth gate: gated surfaces call `resolveAuthGate` / `requireAuth` with the interrupted path; anonymous → `/login?next=…`; Google OAuth `redirectTo` carries safe `next` to `/auth/callback`; success redirects to that same-origin path (open redirects rejected)
- `searchPlaces` uses PlacesPort `autocomplete` (not persisted); `findExistingForPlace` uses PostgresPort `findActiveRestroomsByPlaceId`; both require signed-in actor (`unauthenticated` for guests)
- `addRestroom` finds-or-creates establishment by `place_id`, inserts active restroom (`verify_count = 0`), uploads ≤3 seed photos to `restroom-photos/{restroom_id}/{photo_id}.webp`, and returns detail; guests get `unauthenticated`
- `verifyRestroom` inserts one verify per user per listing via PostgresPort `insertVerify` (UNIQUE conflict → `conflict`); increments `verify_count`; `communityVerified` at ≥3; duplicate-add "same CR" path is this op (no new listing); guests get `unauthenticated`
- `upsertReview` inserts or updates the caller's review (UNIQUE restroom_id + user_id), uploads ≤3 photos to `review-photos/{review_id}/{photo_id}.webp`, recomputes `rating_avg` / `rating_count`; guests get `unauthenticated`
- `reportRestroom` inserts an open report via PostgresPort `insertReport` and sets restroom `status = 'disputed'` (syncs nearby listing seed); guests get `unauthenticated`; detail remains readable with `isDisputed: true`
- `updateRestroom` / `deleteRestroom`: creator may edit amenities/labels/seed photos or hard-delete only when no other-user verify/review exists; own verify does not gate; admin always allowed; guests → `unauthenticated`, non-creator → `forbidden`
- `adminUpsertRestroom` / `adminSetStatus` / `adminRemovePhoto`: admin-only (guest → `unauthenticated`, user → `forbidden`); upsert seeds or edits any listing fields + optional status/photos; setStatus covers active/disputed/closed/archived; removePhoto soft-deletes restroom or review photos via `removed_at`
- `adminMerge` / `listOpenReports`: admin-only; merge archives loser (`merged_into_id` → survivor), reassigns non-conflicting verifies/reviews, recalculates survivor aggregates (seed photos not copied); open reports queue oldest-first with establishment + reporter display names
- `/admin` layout: separate left-nav chrome (Listings / Reports); `requireAdmin` / `resolveAdminGate` enforce `profiles.is_admin` (non-admin and anonymous redirect to `/`)
- Admin listings page: table of all statuses via `listAdminRestrooms`; seed/edit form persists through `adminUpsertRestroom` (session AuthPort + Supabase Postgres adapter for list/upsert path)
- Admin report queue: `/admin/reports` lists open reports oldest-first via `listOpenReports`; dismiss → `updateReportStatus(dismissed)`; mark reviewed → `updateReportStatus(reviewed)` + `adminSetStatus`; empty copy “No open reports.”
- End-user app shell: `(end-user)` route group wraps `/`, `/add`, `/profile`, `/reviews`, `/restrooms/[id]` with mobile bottom tabs (`md:hidden`) and desktop left sidebar + map frame; `/login` and `/admin` stay outside
- Explore (`/`) top bar: glassmorphic overlay (backdrop blur + soft shadow) with HanapBidet brand, safe-area padding, and placeholder slots for radius / filters / theme; shown only on `/` so sidebar-only tabs stay clean; mobile Explore is map-first (sidebar list `md+` only)
- Explore map canvas: `@vis.gl/react-google-maps` full-bleed under top bar; `BrowserGeolocation` adapter; denied/unavailable → `NEXT_PUBLIC_DEFAULT_MAP_CENTER_*` + enable-location banner (`distancesAvailable: false`); outside `NEXT_PUBLIC_LAUNCH_GEO` → coming-soon + Browse Metro Manila CTA
- Explore map pins: `listNearby` → AdvancedMarker HTML pins; bidet Fresh Teal `#006767`, standard charcoal `#4f5e67`, Soft Aqua dashed overlay when unverified; tap selects (preview); Supabase `findActiveRestroomsNear` haversine stand-in for soft-launch scale; default radius 1 km
- Explore radius: top-bar selector steps 0.5 / 1 / 2 / 5 km (default 1 km); `ExploreSession` shares radius + listings with map pins and sidebar rows; distance labels gated on `distancesAvailable`
- Explore filters: four Soft Aqua / teal chips (Has bidet, Free/Paid cycle, Community verified only, Public/Needs patronage cycle); multi-select → `listNearby` filters; horizontal scroll on mobile; session shares filters with map refetch
- Explore desktop sidebar: scrollable distance-ordered `listNearby` rows (name, distance when known, bidet + community-verified icons); row click shares `selectedId` with map pin highlight via `ExploreSession`

## Session Notes

- Ticket 01 done: `pnpm dev` serves blank `/`; `.env.example` documents TRD public + server env names; TypeScript `strict` enabled.
- Ticket 02 done: `pnpm test` green with smoke test through `createRestroomDirectory` + in-memory adapters; stub ops return `not_implemented` except `listNearby` (empty list via Postgres fake).
- Ticket 03 done: `supabase/migrations/20260722000000_core_schema.sql` — PostGIS, six enums, profiles (partial `is_admin` index), establishments (`place_id` unique + GIST on generated `location`), `on_auth_user_created` → "Maria S." display name from Google metadata; Vitest contract tests green.
- Ticket 04 done: `supabase/migrations/20260722000001_domain_tables_rls_triggers.sql` — six tables + indexes/UNIQUEs, RLS policies per auth model, `after_insert_verify` / `after_delete_verify` / `after_review_change`; Vitest contract tests green.
- Ticket 05 done: `supabase/migrations/20260722000002_storage_buckets.sql` — public `restroom-photos` / `review-photos` buckets (WebP), SELECT for published photos, authenticated INSERT scoped to restroom creator / review author path context, soft-delete via `removed_at`; Vitest contract tests green.
- Ticket 06 done: `listNearby` Vitest suite (`list-nearby.test.ts`) covers radius ordering, disputed/non-active exclusion, four filters + combo, pin variants (`bidet` / `standard` / `*_unverified`), and 1 km default / 5 km max validation; `InMemoryPostgres.seedListings` + `pin-variant.ts` helpers.
- Ticket 07 done: `get-restroom-siblings.test.ts` covers full detail (establishment, amenities, aggregates, non-removed photos, reviews newest-first), disputed `isDisputed`, archived/missing `not_found`, active siblings excluding current / disputed / archived / other establishments; PostgresPort grew `findRestroomDetail` + `findActiveSiblings`.
- Ticket 08 done: `/login` (“Continue with Google”), `/auth/callback` PKCE exchange into HTTP-only cookies (no tokens in redirect URL), `proxy.ts` session refresh, `lib/auth` `getSession`/`getUser` + failure/cancel retry messaging; Vitest auth suite green.
- Ticket 09 done: reusable `resolveAuthGate`/`requireAuth` + `loginHref`/`oauthCallbackHref`/`safeReturnPath`; `/login` + OAuth callback preserve `next` end-to-end; signed-in users on `/login` redirect to return path; Vitest covers anonymous redirect, authenticated pass-through, success return, and open-redirect rejection.
- Ticket 10 done: `searchPlaces` / `findExistingForPlace` auth-gated; PlacesPort autocomplete + Postgres `findActiveRestroomsByPlaceId`; Vitest covers empty Places matches, existing active restrooms (excludes disputed/archived/other places), guest `unauthenticated`, and no persistence on search.
- Ticket 11 done: `addRestroom` auth-gated; find-or-create establishment by `place_id`, insert Active + `verify_count = 0`, upload ≤3 seed photos via StoragePort; Vitest covers new place, sibling at existing establishment, photo limit, guest denial.
- Ticket 12 done: `verifyRestroom` auth-gated; PostgresPort `insertVerify` enforces one verify/user, increments `verify_count`, communityVerified at ≥3; duplicate-add same-CR path verifies without creating; Vitest covers uniqueness, threshold, guest denial, archived/missing `not_found`.
- Ticket 13 done: `upsertReview` auth-gated; one review per user per listing (update-in-place), stars/checkboxes/comment + ≤3 `review-photos`, rating aggregates recomputed; Vitest covers insert, update, uniqueness, newest-first detail, guest denial.
- Ticket 14 done: `reportRestroom` auth-gated; PostgresPort `insertReport` opens report + sets `disputed`; `listNearby` drops pin, `getRestroom` returns `isDisputed: true`; Vitest covers guest denial, status transition, map exclusion, multi-report.
- Ticket 15 done: `updateRestroom` / `deleteRestroom` creator-gated on other-user verify/review; optional seed-photo replace; admin override; Vitest covers allowed, blocked, own-verify carve-out, non-creator forbid, admin path.
- Ticket 16 done: `adminUpsertRestroom` / `adminSetStatus` / `adminRemovePhoto` admin-gated; seed/edit any fields + status transitions + soft-remove photos; Vitest covers guest/user denial, upsert create/edit, all four statuses vs map visibility, restroom/review photo soft-delete.
- Ticket 17 done: `adminMerge` / `listOpenReports` admin-gated; loser archived with `merged_into_id`, unique verifies/reviews reassigned (duplicates skipped), survivor aggregates recalculated; open report queue oldest-first; Vitest covers merge semantics, UNIQUE skip, queue ordering, auth gates.
- Ticket 18 done: `/admin` distinct layout (left nav Listings `/admin/listings` + Reports `/admin/reports`); `resolveAdminGate`/`requireAdmin` via `profiles.is_admin`; anonymous and non-admin → `/`; Vitest admin-gate suite green.
- Ticket 19 done: `/admin/listings` table (name/status/verify count) + seed/edit form; `listAdminRestrooms` admin-gated; form saves via `adminUpsertRestroom`; Vitest covers list authz + form parse/create/edit persistence.
- Ticket 20 done: `/admin/reports` open-queue UI (reason/details/listing/reporter); `updateReportStatus` seam + PostgresPort; dismiss or mark reviewed + `adminSetStatus`; empty “No open reports.”; Vitest covers parse/resolve/authz/ordering.
- Ticket 21 done: end-user shell under `app/(end-user)` — four mobile bottom tabs (Explore · Add CR · Profile · Reviews), desktop sidebar + map placeholders, listing detail route; admin/login layouts untouched; Vitest covers tab order + active-tab resolution.
- Ticket 22 done: Explore top bar overlays map chrome on `/` only (glass + safe areas + brand + radius/filters/theme placeholders); mobile Explore map-first; Vitest covers visibility + layout contract.
- Ticket 23 done: Explore Google Map canvas via `@vis.gl/react-google-maps` + `BrowserGeolocation`; Metro Manila fallback + enable-location banner; outside launch-geo coming-soon + Browse Metro Manila; Vitest covers `resolveMapViewState` / launch bounds / env / geolocation adapter (no live Maps API).
- Ticket 24 done: Explore pins from `listNearby` (teal / charcoal / unverified dashed overlay + selected preview); `loadNearbyRestroomsAction` + Supabase nearby adapter; Vitest covers pin appearance, selection sync, and fake `listNearby` → pin models (no live Maps API).
- Ticket 25 done: Explore top-bar radius selector (0.5 / 1 / 2 / 5 km, default 1 km) refetches `listNearby` and refreshes pins + sidebar rows; distance labels only when location known; Vitest covers steps, distance formatting, and radius widen → farther listings.
- Ticket 26 done: Explore filter chips (Has bidet, Free/Paid cycle, Community verified only, Public/Needs patronage cycle) Soft Aqua / teal styling, horizontal scroll, multi-select → `listNearby` + pin refresh via `ExploreSession`; Vitest covers chip toggle/cycle → filters and filtered loadNearby pins.
- Ticket 27 done: Desktop sidebar scrollable nearby list (distance-sorted `listNearby` rows with name, gated distance, bidet/verified icons); row select ↔ map pin highlight via shared `ExploreSession.selectedId`; Vitest covers row model, selection sync, and pin highlight.
