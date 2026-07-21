
# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

Phase 0 — Scaffold (complete) → Phase 1 — Data foundation

## Current Goal

03 — Supabase core schema (enums, profiles, establishments, PostGIS).

## Completed

- 01 — Next.js scaffold, Tailwind, shadcn/ui, env vars
- 02 — RestroomDirectory interface, adapter ports, Vitest harness

## In Progress

## Next Up

- 03 — Supabase core schema
- 08 — Google auth (blocked by auth ticket prerequisites)

## Open Questions

## Architecture Decisions

- App uses Next.js 16 App Router + Tailwind v4 + shadcn/ui (base-nova)
- Brand tokens: Fresh Teal `#006767` primary; Montserrat (headings) + Public Sans (body) via `next/font`
- Domain seam lives at `lib/restroom-directory` with Zod I/O schemas, adapter ports (Places, Postgres, Storage, Auth, Geolocation), and in-memory fakes for Vitest

## Session Notes

- Ticket 01 done: `pnpm dev` serves blank `/`; `.env.example` documents TRD public + server env names; TypeScript `strict` enabled.
- Ticket 02 done: `pnpm test` green with smoke test through `createRestroomDirectory` + in-memory adapters; stub ops return `not_implemented` except `listNearby` (empty list via Postgres fake).
