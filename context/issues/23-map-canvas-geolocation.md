# 23 — Google Map canvas + geolocation + Metro Manila fallback

**What to build:** Full-bleed Google Map on Explore via `@vis.gl/react-google-maps`. Requests browser location on load. Granted → map centers on user. Denied/unavailable → Metro Manila default center with soft banner to enable location. Outside launch geo (`NEXT_PUBLIC_LAUNCH_GEO`) shows "Coming soon outside Metro Manila" with optional "Browse Metro Manila" CTA.

**Blocked by:** 21 — App shell: routes, mobile bottom tabs, desktop layout frame; 06 — `listNearby` with radius, filters, and pin-variant classification

**Status:** done

- [x] Map renders full-bleed behind UI chrome on `/`
- [x] Location granted centers map on user position
- [x] Location denied falls back to Metro Manila default; distances omitted until location available
- [x] Outside coverage shows coming-soon state with browse-Metro-Manila option
