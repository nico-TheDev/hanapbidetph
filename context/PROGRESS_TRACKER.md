# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

Phase 4 — Write path (user)

## Current Goal

11 — `addRestroom`

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

## In Progress

_(none)_

## Next Up

- 11 — `addRestroom`

## Open Questions

## Architecture Decisions

- App uses Next.js 16 App Router + Tailwind v4 + shadcn/ui (base-nova)
- Brand tokens: Fresh Teal `#006767` primary; Montserrat (headings) + Public Sans (body) via `next/font`
- Domain seam lives at `lib/restroom-directory` with Zod I/O schemas, adapter ports (Places, Postgres, Storage, Auth, Geolocation), and in-memory fakes for Vitest
- Supabase migrations under `supabase/migrations/`; core schema enables PostGIS, six domain enums, `profiles` + `establishments`, and `on_auth_user_created` profile bootstrap
- Domain tables migration adds `restrooms` (+ photos/verifies/reviews/reports), RLS (anon read / scoped auth writes / `is_admin` bypass), and triggers for `verify_count` + rating aggregates
- Storage buckets `restroom-photos` / `review-photos` are public; object paths `{entity_id}/{photo_id}.webp`; SELECT gated to published (`removed_at IS NULL`) + uploader/admin; INSERT scoped to entity ownership; soft-delete via photo-row `removed_at` (no authenticated storage DELETE)
- `listNearby` uses PostgresPort `findActiveRestroomsNear` (PostGIS `ST_DWithin` pattern); in-memory fake haversine stand-in seeds domain rows, excludes non-`active`, applies filters, and computes `hasBidet` / `communityVerified` / `pinVariant`
- `getRestroom` / `listSiblings` use PostgresPort `findRestroomDetail` + `findActiveSiblings`; directory maps public photo URLs via StoragePort, sets `isDisputed` from status, treats archived/missing as `not_found`; siblings are other `active` restrooms at the same establishment
- Google OAuth via Supabase Auth + `@supabase/ssr`: JWT in HTTP-only cookies; root `proxy.ts` refreshes session; `/login` + `/auth/callback` (PKCE code exchange); `getSession` / `getUser` helpers for Server Actions
- Auth gate: gated surfaces call `resolveAuthGate` / `requireAuth` with the interrupted path; anonymous → `/login?next=…`; Google OAuth `redirectTo` carries safe `next` to `/auth/callback`; success redirects to that same-origin path (open redirects rejected)
- `searchPlaces` uses PlacesPort `autocomplete` (not persisted); `findExistingForPlace` uses PostgresPort `findActiveRestroomsByPlaceId`; both require signed-in actor (`unauthenticated` for guests)

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
