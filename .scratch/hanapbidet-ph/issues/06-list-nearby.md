# 06 — `listNearby` with radius, filters, and pin-variant classification

**What to build:** `RestroomDirectory.listNearby` using PostGIS `ST_DWithin` with default 1 km / max 5 km radius, filters (has_bidet, access_cost, access_scope, community_verified), computed pin variants (bidet / standard + unverified overlay), and disputed exclusion. Full Vitest suite with in-memory fake.

**Blocked by:** 04 — Restrooms, photos, verifies, reviews, reports tables + RLS + triggers

**Status:** ready-for-agent

- [ ] Returns restrooms within radius ordered by distance
- [ ] Excludes restrooms outside radius and disputed listings from default results
- [ ] All four filter combinations work correctly
- [ ] Pin-variant classification (bidet, standard, unverified overlay) is computed per listing
- [ ] Vitest suite covers radius, filters, pin variants, and disputed exclusion
