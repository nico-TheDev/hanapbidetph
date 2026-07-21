# 25 — Radius selector wired to `listNearby`

**What to build:** Radius control in the Explore top bar (steps: 0.5 / 1 / 2 / 5 km; default 1 km; max 5 km). Changing radius refetches `listNearby` and updates pins and sidebar list. Distance shown on listings when user location is available.

**Blocked by:** 24 — Map pins from `listNearby` (bidet / standard / unverified)

**Status:** ready-for-agent

- [ ] Radius selector shows current value and allows 0.5 / 1 / 2 / 5 km
- [ ] Default radius is 1 km on first load
- [ ] Changing radius refetches nearby listings and updates map pins
- [ ] Distance displayed on listing rows when location is known
