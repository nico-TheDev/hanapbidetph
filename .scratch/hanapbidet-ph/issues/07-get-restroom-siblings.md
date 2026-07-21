# 07 — `getRestroom` detail + `listSiblings`

**What to build:** `RestroomDirectory.getRestroom` returns establishment context, amenities, aggregates, non-removed seed photos, and reviews newest-first. `listSiblings` returns other active restrooms at the same establishment. Archived/missing listings return an error; disputed listings are allowed with an `is_disputed` flag.

**Blocked by:** 04 — Restrooms, photos, verifies, reviews, reports tables + RLS + triggers

**Status:** ready-for-agent

- [ ] `getRestroom` returns full detail payload including photos and reviews (newest first)
- [ ] `listSiblings` returns active restrooms at the same establishment excluding the current one
- [ ] Archived/missing listing returns a not-found error
- [ ] Disputed listing is returned with `is_disputed: true`
- [ ] Vitest suite covers detail, siblings, and error cases
