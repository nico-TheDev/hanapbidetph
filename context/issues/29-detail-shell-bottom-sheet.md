# 29 — Listing detail shell (mobile bottom sheet + desktop panel)

**What to build:** Listing detail container: on mobile, a bottom sheet with peek (240px) → half → expanded (95%) states and a 40×4px drag handle; on desktop, detail opens in the left sidebar panel while map stays visible. Pin tap or sidebar row opens this shell for the selected listing.

**Blocked by:** 24 — Map pins from `listNearby` (bidet / standard / unverified); 27 — Desktop sidebar nearby list

**Status:** done

- [x] Mobile pin tap opens bottom sheet at peek height
- [x] Sheet expands to half and full via drag or CTA
- [x] Desktop row click opens detail panel in sidebar without hiding map
- [x] Back/close returns to map-only Explore state
