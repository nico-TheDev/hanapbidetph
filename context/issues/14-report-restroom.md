# 14 — `reportRestroom` + disputed status transition

**What to build:** `RestroomDirectory.reportRestroom` inserts a report and sets restroom `status = 'disputed'` on open report. `listNearby` excludes disputed listings; `getRestroom` allows access with `is_disputed` flag. Tests cover status transition and guest denial.

**Blocked by:** 07 — `getRestroom` detail + `listSiblings`; 09 — Return-to-interrupted-flow and auth-gate utility

**Status:** ready-for-agent

- [ ] Report inserted with reason and optional details
- [ ] Restroom status becomes `disputed` when report is open
- [ ] `listNearby` excludes disputed; `getRestroom` returns with `is_disputed: true`
- [ ] Guest cannot report
- [ ] Vitest suite covers status transition and map exclusion
