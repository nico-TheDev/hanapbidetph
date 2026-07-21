# 10 — `searchPlaces` + `findExistingForPlace`

**What to build:** `RestroomDirectory.searchPlaces` wraps Google Places autocomplete/details via an adapter (not persisted). `findExistingForPlace` returns active restrooms for a given `place_id` during the add flow. Places adapter port + in-memory fake. Vitest covers empty results and existing restrooms at a place.

**Blocked by:** 06 — `listNearby` with radius, filters, and pin-variant classification; 09 — Return-to-interrupted-flow and auth-gate utility

**Status:** ready-for-agent

- [ ] `searchPlaces` returns establishment suggestions from Google Places without persisting
- [ ] `findExistingForPlace` returns active restrooms for a `place_id`
- [ ] Guest cannot call either operation (auth required)
- [ ] Vitest suite covers empty place results and existing restrooms
