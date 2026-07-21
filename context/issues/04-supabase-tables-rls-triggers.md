# 04 — Restrooms, photos, verifies, reviews, reports tables + RLS + triggers

**What to build:** Supabase migration for `restrooms`, `restroom_photos`, `verifies`, `reviews`, `review_photos`, and `reports` with all indexes, constraints, and foreign keys. RLS policies enforce anonymous read, authenticated scoped writes, and admin bypass. Triggers maintain denormalized `verify_count`, `rating_avg`, and `rating_count` on `restrooms`.

**Blocked by:** 03 — Supabase project, PostGIS, enums, profiles + establishments

**Status:** done

- [x] All six tables created with indexes and UNIQUE constraints per DATA_ARCHITECTURE
- [x] RLS enabled on every table with policies matching the auth model
- [x] Verify-count and rating-aggregate triggers fire correctly on insert/update/delete
