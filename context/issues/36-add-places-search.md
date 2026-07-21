# 36 — Add flow: Places search step

**What to build:** Step 1 of `/add`: Google Places autocomplete search. User types establishment name, sees suggestions, selects one. Selected place shows name and address preview. Calls `searchPlaces` adapter; selection passes `place_id` and coordinates to next step.

**Blocked by:** 35 — `/add` auth gate and multi-step page shell; 10 — `searchPlaces` + `findExistingForPlace`

**Status:** ready-for-agent

- [ ] Autocomplete shows establishment suggestions as user types
- [ ] Selecting a place shows name/address preview and advances to duplicate check
- [ ] Places API failure shows inline error with Retry
- [ ] User can go back and change establishment selection
