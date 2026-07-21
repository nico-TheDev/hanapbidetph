
# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

Phase 0 — Scaffold

## Current Goal

02 — RestroomDirectory seam: typed interface, adapter ports, Vitest harness.

## Completed

- 01 — Next.js scaffold, Tailwind, shadcn/ui, env vars

## In Progress

## Next Up

- 02 — RestroomDirectory seam (blockers cleared)
- 03 — Supabase core schema
- 08 — Google auth (blocked by 01 — ready once auth ticket blockers are met)

## Open Questions

## Architecture Decisions

- App uses Next.js 16 App Router + Tailwind v4 + shadcn/ui (base-nova)
- Brand tokens: Fresh Teal `#006767` primary; Montserrat (headings) + Public Sans (body) via `next/font`

## Session Notes

- Ticket 01 done: `pnpm dev` serves blank `/`; `.env.example` documents TRD public + server env names; TypeScript `strict` enabled.
- Commit pending (not requested this session).
