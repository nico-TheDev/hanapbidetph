# 24 — Map pins from `listNearby` (bidet / standard / unverified)

**What to build:** Restroom pins rendered on the Explore map from `listNearby` results. Bidet listings use Fresh Teal pin; standard use charcoal; unverified listings show dashed overlay on either variant. Tapping a pin selects it (preview state — detail wired in a later ticket).

**Blocked by:** 23 — Google Map canvas + geolocation + Metro Manila fallback

**Status:** done

- [x] Pins appear at establishment coordinates from `listNearby`
- [x] Bidet pin is teal; standard pin is charcoal; unverified overlay visible when `verify_count < 3`
- [x] Pin tap selects the listing (visual selected state)
- [x] Map updates pins when nearby data changes
