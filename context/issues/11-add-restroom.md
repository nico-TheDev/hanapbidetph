# 11 — `addRestroom` with establishment creation and seed photos

**What to build:** `RestroomDirectory.addRestroom` creates an establishment if the `place_id` is new, creates a restroom as Active + unverified, and uploads up to 3 compressed seed photos. Tests cover new establishment, sibling at existing establishment, photo limit enforcement, and guest denial.

**Blocked by:** 10 — `searchPlaces` + `findExistingForPlace`; 05 — Storage buckets and upload policies

**Status:** ready-for-agent

- [ ] New `place_id` creates establishment + restroom in one publish
- [ ] Existing `place_id` adds a sibling restroom at the same establishment
- [ ] Listing publishes immediately as Active with unverified overlay (`verify_count = 0`)
- [ ] Max 3 seed photos enforced; guest cannot add
- [ ] Vitest suite covers new/sibling paths and photo limit
