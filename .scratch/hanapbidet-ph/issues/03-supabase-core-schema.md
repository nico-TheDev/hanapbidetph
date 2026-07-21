# 03 — Supabase project, PostGIS, enums, profiles + establishments

**What to build:** Supabase migration enabling PostGIS, all six domain enums, `profiles` table (with `is_admin` partial index), and `establishments` table (`place_id` unique, GIST index on `location`). `on_auth_user_created` trigger bootstraps a `profiles` row from Google metadata on first sign-in.

**Blocked by:** 02 — RestroomDirectory interface, adapter ports, Vitest harness

**Status:** ready-for-agent

- [ ] PostGIS extension enabled
- [ ] All six enums created (`bidet_type`, `access_cost`, `access_scope`, `restroom_status`, `report_reason`, `report_status`)
- [ ] `profiles` and `establishments` tables with indexes match DATA_ARCHITECTURE
- [ ] Profile bootstrap trigger fires on new `auth.users` row
