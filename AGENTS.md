# AGENTS.md

This file orients any agent working in this repository.

## Project Snapshot

- Product: HanapBidet PH (Metro Manila-first restroom finder)
- Platform: Next.js 16 + Supabase + Google Maps/Places
- Current state: planning and ticketization docs are ready; implementation is expected to follow tickets
- Primary domain seam: `RestroomDirectory` (single behavioral seam for v1)

## Canonical Docs Map

Use this order unless the task says otherwise.

1. `.scratch/hanapbidet-ph/spec.md`
   - Canonical v1 scope, decisions, and full user stories.
   - Start here for product intent, boundaries, and implementation phases.

2. `.scratch/hanapbidet-ph/PRD.md`
   - Product framing, launch constraints, and success metrics.
   - Use when validating "what matters" and out-of-scope features.

3. `.scratch/hanapbidet-ph/TRD.md`
   - Technical stack, architecture constraints, env var names, and backend boundaries.
   - Use before touching infra, auth, APIs, or deployment-related choices.

4. `.scratch/hanapbidet-ph/DATA_ARCHITECTURE.md`
   - Database schema, enums, RLS model, storage model, and `RestroomDirectory` API surface.
   - Use for any data contract, authz, migration, or moderation behavior.

5. `.scratch/hanapbidet-ph/APPFLOW.md`
   - Route-by-route UX behavior and navigation flows (mobile vs desktop vs admin).
   - Use when implementing pages, auth redirects, and empty/error states.

6. `.scratch/hanapbidet-ph/UI_DESIGN.md`
   - UX style direction and interaction conventions for v1.
   - Use for visual consistency, not for changing product logic.

7. `.scratch/hanapbidet-ph/design/DESIGN.md`
   - Concrete token values (colors, typography, radii, etc).
   - Use as the source of truth for design token wiring.

8. `.scratch/hanapbidet-ph/issues/*.md`
   - Execution queue split into tracer-bullet tickets with blockers.
   - Use to select the next implementable ticket on the frontier.

## Ticket-First Workflow

When implementing:

1. Pick a ticket in `.scratch/hanapbidet-ph/issues/` whose blockers are complete.
2. Re-read `spec.md` + the ticket + relevant supporting docs above.
3. Implement only the end-to-end behavior promised by that ticket.
4. Verify with tests/lints relevant to changed behavior.
5. Update progress in the ticket or adjacent planning docs if requested.

## Domain Vocabulary (Do Not Drift)

- Restroom listing: the map pin and moderation unit
- Establishment: Google Place grouping (`place_id`), may have sibling restrooms
- Community verified: listing has at least 3 distinct verifies
- Statuses: active, disputed, closed, archived
- Roles: guest, user, admin
- Launch geo: Metro Manila first

Use these terms consistently in code comments, docs, commits, and PR text.

## Non-Negotiable v1 Boundaries

- Anonymous browse is allowed; contribution actions require auth
- Google OAuth only (no email/password in v1)
- No social platform features (public profiles, feeds, follows, gamification)
- No in-app turn-by-turn navigation
- No monetization mechanics in v1 (ads, paid ranking, subscriptions)
- Keep one behavioral seam: `RestroomDirectory`

## Decision Priority

If docs seem to conflict, prefer:

1. `spec.md` (latest canonical synthesis)
2. `DATA_ARCHITECTURE.md` and `TRD.md` for technical/data details
3. `APPFLOW.md` and `UI_DESIGN.md` for UX interaction details
4. `PRD.md` for product framing and success criteria

If conflict remains, ask before implementing.

## Practical Guidance For Future Agents

- Keep tickets vertical: schema/API/UI/tests together for each behavior.
- Avoid broad refactors unless a ticket explicitly calls for one.
- Prefer small, demoable increments that match ticket acceptance criteria.
- Preserve existing terminology and route structure from app-flow docs.
- Treat `.scratch/hanapbidet-ph/` as the planning source of truth for this repo.
