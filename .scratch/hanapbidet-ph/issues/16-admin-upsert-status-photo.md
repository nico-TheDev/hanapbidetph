# 16 — `adminUpsertRestroom` + `adminSetStatus` + `adminRemovePhoto`

**What to build:** Admin operations to seed/edit any listing fields, set lifecycle status (active/disputed/closed/archived), and soft-delete photos via `removed_at`. Service-role path available for seed scripts. Tests verify admin vs non-admin authorization.

**Blocked by:** 06 — `listNearby` with radius, filters, and pin-variant classification; 09 — Return-to-interrupted-flow and auth-gate utility

**Status:** ready-for-agent

- [ ] Admin can upsert listings with any field (seed path for soft launch)
- [ ] Admin can set restroom status to active, disputed, closed, or archived
- [ ] Admin can soft-remove restroom or review photos
- [ ] Non-admin users are rejected for all admin operations
- [ ] Vitest suite covers authz and status transitions
