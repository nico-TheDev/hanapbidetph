# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

Phase 1 — Data foundation

## Current Goal

06 — `listNearby` via RestroomDirectory + PostGIS.

## Completed

- 01 — Next.js scaffold, Tailwind, shadcn/ui, env vars
- 02 — RestroomDirectory interface, adapter ports, Vitest harness
- 03 — Supabase core schema (PostGIS, enums, profiles, establishments, auth bootstrap trigger)
- 04 — Restrooms, photos, verifies, reviews, reports tables + RLS + aggregate triggers
- 05 — Storage buckets (`restroom-photos`, `review-photos`) + storage RLS policies

## In Progress

## Next Up

- 06 — listNearby (blocked by 04 — cleared)
- 07 — getRestroom + siblings (blocked by 04 — cleared)
- 08 — Google auth (blocked by auth ticket prerequisites)

## Open Questions

## Architecture Decisions

- App uses Next.js 16 App Router + Tailwind v4 + shadcn/ui (base-nova)
- Brand tokens: Fresh Teal `#006767` primary; Montserrat (headings) + Public Sans (body) via `next/font`
- Domain seam lives at `lib/restroom-directory` with Zod I/O schemas, adapter ports (Places, Postgres, Storage, Auth, Geolocation), and in-memory fakes for Vitest
- Supabase migrations under `supabase/migrations/`; core schema enables PostGIS, six domain enums, `profiles` + `establishments`, and `on_auth_user_created` profile bootstrap
- Domain tables migration adds `restrooms` (+ photos/verifies/reviews/reports), RLS (anon read / scoped auth writes / `is_admin` bypass), and triggers for `verify_count` + rating aggregates
- Storage buckets `restroom-photos` / `review-photos` are public; object paths `{entity_id}/{photo_id}.webp`; SELECT gated to published (`removed_at IS NULL`) + uploader/admin; INSERT scoped to entity ownership; soft-delete via photo-row `removed_at` (no authenticated storage DELETE)

## Session Notes

- Ticket 01 done: `pnpm dev` serves blank `/`; `.env.example` documents TRD public + server env names; TypeScript `strict` enabled.
- Ticket 02 done: `pnpm test` green with smoke test through `createRestroomDirectory` + in-memory adapters; stub ops return `not_implemented` except `listNearby` (empty list via Postgres fake).
- Ticket 03 done: `supabase/migrations/20260722000000_core_schema.sql` — PostGIS, six enums, profiles (partial `is_admin` index), establishments (`place_id` unique + GIST on generated `location`), `on_auth_user_created` → "Maria S." display name from Google metadata; Vitest contract tests green.
- Ticket 04 done: `supabase/migrations/20260722000001_domain_tables_rls_triggers.sql` — six tables + indexes/UNIQUEs, RLS policies per auth model, `after_insert_verify` / `after_delete_verify` / `after_review_change`; Vitest contract tests green.
- Ticket 05 done: `supabase/migrations/20260722000002_storage_buckets.sql` — public `restroom-photos` / `review-photos` buckets (WebP), SELECT for published photos, authenticated INSERT scoped to restroom creator / review author path context, soft-delete via `removed_at`; Vitest contract tests green.
