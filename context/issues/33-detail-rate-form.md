# 33 — Rate/review form on listing detail

**What to build:** Rate form on listing detail: 1–5 stars, cleanliness/amenities/access checkboxes, optional comment, optional review photos (max 3, client compress). One review per listing — form pre-fills for edit if user already reviewed. Submits via `upsertReview`; feed refreshes newest-first.

**Blocked by:** 31 — Reviews feed on detail (read-only); 13 — `upsertReview` with photos; 09 — Return-to-interrupted-flow and auth-gate utility

**Status:** done

- [x] Anonymous user is auth-gated before showing submit
- [x] New review submits stars, checkboxes, comment, and up to 3 photos
- [x] Existing review opens form in edit mode with current values
- [x] After submit, review appears at top of feed and rating summary updates
