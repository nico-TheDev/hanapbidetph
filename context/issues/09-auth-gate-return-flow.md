# 09 — Return-to-interrupted-flow and auth-gate utility

**What to build:** A reusable auth-gate wrapper that captures the interrupted route (e.g. `/add`, `/reviews`, verify/rate/report on listing detail), redirects anonymous users to `/login`, and returns them to the original action after successful sign-in.

**Blocked by:** 08 — Supabase Auth setup, `/login`, `/auth/callback`, session middleware

**Status:** ready-for-agent

- [ ] Anonymous user hitting a gated route is redirected to `/login` with return URL preserved
- [ ] After successful Google sign-in, user lands on the originally requested route or action
- [ ] Auth-gate utility is reusable across Add CR, Profile, Reviews, and detail contribution CTAs
