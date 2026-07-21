# 17 — `adminMerge` + `listOpenReports`

**What to build:** `RestroomDirectory.adminMerge` archives the loser listing, sets `merged_into_id`, reassigns verifiers/reviews skipping UNIQUE conflicts, and recalculates survivor aggregates. `listOpenReports` returns the admin report queue ordered by `created_at`. Tests cover merge semantics and queue ordering.

**Blocked by:** 16 — `adminUpsertRestroom` + `adminSetStatus` + `adminRemovePhoto`; 14 — `reportRestroom` + disputed status transition

**Status:** ready-for-agent

- [ ] Merge archives loser, points `merged_into_id` to survivor, recalculates aggregates
- [ ] Duplicate verifiers/reviews on merge are skipped without violating UNIQUE constraints
- [ ] `listOpenReports` returns open reports for admin queue
- [ ] Vitest suite covers merge semantics and report queue
