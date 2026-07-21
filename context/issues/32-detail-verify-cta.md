# 32 — Verify CTA on listing detail

**What to build:** "Verify this CR" button on listing detail. Auth-gated (→ `/login` if anonymous). One verify per user per listing — button disabled or shows "Verified" after user has verified. Verify count and Community verified badge update after action.

**Blocked by:** 30 — Detail content, siblings, and Maps handoff CTA; 12 — `verifyRestroom` + community-verified threshold; 09 — Return-to-interrupted-flow and auth-gate utility

**Status:** ready-for-agent

- [ ] Anonymous user tapping Verify is sent through auth-gate to `/login` and returns to verify
- [ ] Signed-in user can verify once; second attempt shows already-verified state
- [ ] Verify count updates; Community verified badge appears at ≥3
- [ ] Error state preserves detail view with retry option
