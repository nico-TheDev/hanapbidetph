# 27 — Desktop sidebar nearby list

**What to build:** On desktop, a left sidebar lists nearby restrooms from `listNearby` (name, distance when known, key amenity icons). Clicking a row selects the listing and opens detail in the panel (detail content wired in a later ticket). Map stays visible on the right.

**Blocked by:** 25 — Radius selector wired to `listNearby`; 26 — Filter chips wired to `listNearby`

**Status:** ready-for-agent

- [ ] Desktop layout shows scrollable sidebar list beside the map
- [ ] Each row shows establishment name, distance (when location known), and bidet/verified indicators
- [ ] Clicking a row selects the listing and highlights the corresponding map pin
- [ ] List updates when radius or filters change
