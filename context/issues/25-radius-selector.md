# 25 — Radius selector wired to `listNearby`

**What to build:** Radius control in the Explore top bar (steps: 0.5 / 1 / 2 / 5 km; default 1 km; max 5 km). Changing radius refetches `listNearby` and updates pins and sidebar list. Distance shown on listings when user location is available.

**Blocked by:** 24 — Map pins from `listNearby` (bidet / standard / unverified)

**Status:** done

- [x] Radius selector shows current value and allows 0.5 / 1 / 2 / 5 km
- [x] Default radius is 1 km on first load
- [x] Changing radius refetches nearby listings and updates map pins
- [x] Distance displayed on listing rows when location is known
