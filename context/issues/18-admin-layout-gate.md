# 18 — `/admin` layout, role gate, and left nav

**What to build:** `/admin` route with a separate layout from end-user chrome. Simple left nav with Listings and Reports sections. Non-admin users are redirected to `/`. Admin role checked via `profiles.is_admin`.

**Blocked by:** 09 — Return-to-interrupted-flow and auth-gate utility

**Status:** done

- [x] `/admin` uses a distinct layout (no bottom tabs, no map chrome)
- [x] Left nav links to Listings and Reports sections
- [x] Non-admin signed-in user and anonymous user are redirected to `/`
- [x] Admin user can access `/admin` without error
