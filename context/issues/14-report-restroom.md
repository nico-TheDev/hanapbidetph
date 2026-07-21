# 14 — `reportRestroom` + disputed status transition

**What to build:** `RestroomDirectory.reportRestroom` inserts a report and sets restroom `status = 'disputed'` on open report. `listNearby` excludes disputed listings; `getRestroom` allows access with `is_disputed` flag. Tests cover status transition and guest denial.

**Blocked by:** 07 — `getRestroom` detail + `listSiblings`; 09 — Return-to-interrupted-flow and auth-gate utility

**Status:** done

- [x] Report inserted with reason and optional details
- [x] Restroom status becomes `disputed` when report is open
- [x] `listNearby` excludes disputed; `getRestroom` returns with `is_disputed: true`
- [x] Guest cannot report
- [x] Vitest suite covers status transition and map exclusion
