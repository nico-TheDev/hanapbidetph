# 15 — Creator edit/delete with community-activity gate

**What to build:** `RestroomDirectory.updateRestroom` allows creator edits only when no other-user verify or review exists. `deleteRestroom` hard-deletes only with no community activity; otherwise denied. Admin can always edit/delete. Tests cover allowed, blocked, and admin paths.

**Blocked by:** 11 — `addRestroom` with establishment creation and seed photos; 12 — `verifyRestroom` + community-verified threshold; 13 — `upsertReview` with photos

**Status:** done

- [x] Creator can edit amenities/labels/seed photos when no other-user community activity
- [x] Creator edit/delete blocked after another user verifies or reviews
- [x] Admin can always edit and archive/delete regardless of community activity
- [x] Vitest suite covers gate logic and admin override
