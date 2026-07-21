# 05 — Storage buckets and upload policies

**What to build:** Supabase Storage buckets `restroom-photos` and `review-photos` with RLS policies: public read, authenticated insert scoped to upload context, admin/service-role soft-delete. Path conventions (`{restroom_id}/{photo_id}.webp`, `{review_id}/{photo_id}.webp`) documented.

**Blocked by:** 03 — Supabase project, PostGIS, enums, profiles + establishments

**Status:** done

- [x] Both storage buckets exist with correct path conventions
- [x] Public read policy allows serving published photos
- [x] Authenticated users can upload only within their upload context
- [x] Admin/service role can soft-delete via `removed_at` pattern
