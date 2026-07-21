# 13 — `upsertReview` with photos

**What to build:** `RestroomDirectory.upsertReview` inserts or updates the caller's own review (stars, cleanliness/amenities/access checkboxes, optional comment, up to 3 photos). Triggers update `rating_avg` and `rating_count`. Tests cover insert, update-in-place, uniqueness, newest-first ordering, and guest denial.

**Blocked by:** 07 — `getRestroom` detail + `listSiblings`; 09 — Return-to-interrupted-flow and auth-gate utility; 05 — Storage buckets and upload policies

**Status:** done

- [x] One review per user per listing; second call updates in place
- [x] Stars, checkboxes, comment, and up to 3 review photos persisted
- [x] `rating_avg` and `rating_count` recomputed on insert/update
- [x] Reviews returned newest-first on detail
- [x] Guest cannot review; Vitest suite covers insert, update, and uniqueness
