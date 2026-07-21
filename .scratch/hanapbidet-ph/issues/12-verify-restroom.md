# 12 — `verifyRestroom` + community-verified threshold

**What to build:** `RestroomDirectory.verifyRestroom` inserts one verify per user per listing, increments `verify_count`, and sets `community_verified` at ≥3 distinct verifiers. Duplicate-add "same CR" path records verify instead of create. Tests cover uniqueness, threshold, and guest denial.

**Blocked by:** 07 — `getRestroom` detail + `listSiblings`; 09 — Return-to-interrupted-flow and auth-gate utility

**Status:** ready-for-agent

- [ ] One verify per user per listing enforced (duplicate rejected)
- [ ] `verify_count` increments; `community_verified` true at ≥3 distinct verifiers
- [ ] Duplicate-add shortcut records verify instead of creating a new listing
- [ ] Guest cannot verify
- [ ] Vitest suite covers uniqueness, threshold, and authz
