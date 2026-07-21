# 30 — Detail content, siblings, and Maps handoff CTA

**What to build:** Inside the detail shell, render listing content from `getRestroom`: establishment name/address, floor/area, restroom label, structured amenities, distance, rating summary, Community verified badge, seed photo gallery (or placeholder), and sibling restrooms at the same place. Primary CTA "Open in Google Maps" (teal gradient) hands off to Google Maps / Apple Maps.

**Blocked by:** 29 — Listing detail shell (mobile bottom sheet + desktop panel); 07 — `getRestroom` detail + `listSiblings`

**Status:** done

- [x] All amenity fields and trust signals render correctly
- [x] Distance shown when user location is available
- [x] Community verified badge appears at ≥3 verifies
- [x] Sibling restrooms listed with links to switch detail
- [x] Maps handoff opens external navigation app with correct coordinates
