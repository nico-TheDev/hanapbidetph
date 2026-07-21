# HanapBidet PH — v1 Spec

**Status:** ready-for-agent  
**Triage:** ready-for-agent  
**Feature slug:** hanapbidet-ph  
**Launch geography:** Metro Manila (soft launch → public)  
**Primary test seam:** RestroomDirectory  
**Sources:** [APPFLOW.md](./APPFLOW.md), [PRD.md](./PRD.md), [TRD.md](./TRD.md), [UI_DESIGN.md](./UI_DESIGN.md), [DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md)

---

## Problem Statement

People who need to use a comfort room (CR) in public — especially those who frequently have bowel movements away from home, and travelers unfamiliar with an area — often cannot find a nearby restroom that has a usable bidet (or know what amenities a CR actually offers). Existing maps show establishments, not restrooms; they rarely say whether there is a bidet, tissue only, high pressure, paid access, or whether the listing is trustworthy. The result is wasted time, anxiety, and uncomfortable wash-ups.

## Solution

**HanapBidet PH** (“Locate the nearest bidet in your area”) is a mobile-first progressive web app that shows nearby restrooms on a map, with clear amenity and trust signals, driven by community contribution.

On open (with location), the user sees comfort rooms within a default **1 km** radius (adjustable up to **5 km**), with distinct pins for bidet vs non-bidet vs unverified listings. They can open a listing for amenities, distance, ratings, photos, and comments, then hand off to Google Maps / Apple Maps for navigation. Signed-in users can add restrooms (anchored to a Google Place / establishment), verify that a listing exists, rate and comment with structured feedback, and report problems. Listings belong to the app once community activity exists. Admins seed Metro Manila data and moderate disputes. Social networking is out of scope; contribution exists for map quality only.

Brand-new visitors land on **Explore** (`/`) immediately — no splash, onboarding, or account wall. Sign-in is required only for Add CR, Profile, Reviews, and verify / rate / report actions.

## User Stories

### Urgency, map & discovery

1. As a person who needs a CR urgently, I want to open the app and see nearby restrooms on a map centered on my location, so that I can find a place quickly without searching blindly.
2. As a nearby user, I want a default search radius of 1 km, so that results feel relevant to “I need something close.”
3. As a nearby user, I want to expand the radius up to 5 km, so that I can look farther when nothing suitable is close.
4. As a user whose location is blocked or unavailable, I want the map to fall back to a Metro Manila default center without distances, so that I can still browse listings.
5. As a user without location, I want to still add a listing via establishment search, so that GPS is not required to contribute.
6. As a traveler unfamiliar with the area, I want to see all nearby CRs by default (not only bidet ones), so that I understand what options exist around me.
7. As a bidet-seeking user, I want bidet restrooms to use a distinct map pin icon (Fresh Teal), so that I can spot them at a glance.
8. As a user, I want non-bidet restrooms to use a standard charcoal pin, so that I can still find tissue-only or basic CRs when needed.
9. As a user, I want unverified (new) listings to show an unverified dashed overlay on either pin type, so that I know community trust is still thin.
10. As a user, I want to filter by “has bidet,” so that I can narrow to the product’s core promise.
11. As a user, I want to filter by free vs paid access, so that I am not surprised by a fee.
12. As a user, I want to filter to community-verified listings only, so that I prefer higher-trust pins.
13. As a user, I want to filter by public access vs needs patronage, so that I know whether I must buy something or be a customer.
14. As a mobile user on Explore, I want a compact top bar (logo, radius, filters, theme toggle, optional avatar) over a full-bleed map, so that I can browse with minimal chrome.
15. As a mobile user, I want pin preview and listing detail in bottom sheets (peek → half → expanded), so that I can scan the map without losing context.
16. As a desktop user, I want a Google Maps–style left sidebar (nearby list → detail panel) with the map on the right and no bottom tabs, so that browsing feels natural on a large screen.
17. As a user, I want to tap a pin (mobile) or pick a sidebar row (desktop) and see restroom details (establishment context, floor/area, amenities, rating summary, photos, comments, distance when location is known), so that I can decide before walking.
18. As a user, I want distance shown between me and the target CR when location is available, so that I can compare options.
19. As a user, I want structured amenity information (bidet type, basics like tissue/soap/dryer, access free/paid and public/patronage), so that listings are comparable and filterable.
20. As a user, I want to see sibling restrooms at the same establishment, so that I can pick the closest or best-equipped CR in a mall.
21. As a user, I want to open directions in Google Maps (or Apple Maps when appropriate), so that I get turn-by-turn without the app building its own navigation.
22. As an anonymous user, I want to browse the map and listing details without signing up, so that urgency is not blocked by an account wall.
23. As a user outside Metro Manila, I want a clear “Coming soon outside Metro Manila” experience with optional “Browse Metro Manila,” so that expectations match launch geography.
24. As a user in coverage with zero pins in my radius, I want “No restrooms nearby” with suggestions to widen radius or clear filters, so that I know what to try next.
25. As a user, I want to toggle light/dark mode from the top bar, so that the UI is readable outdoors and at night.

### Navigation & auth

26. As a mobile user, I want bottom tabs for Explore, Add CR, Profile, and Reviews, so that primary actions are one tap away.
27. As a contributor hitting a gated action, I want to sign in with Google via `/login` and return to the interrupted tab or action, so that auth friction is minimal.
28. As a returning Google user, I want the same login path as first-time users with a minimal profile from my Google name, so that there is no separate onboarding.
29. As a signed-in user, I want my avatar in the Explore top bar for quick access to Profile, so that account state is visible while browsing.
30. As a signed-out user on Profile, I want “Continue with Google” and short copy (“Sign in to add, verify, and rate”), so that I understand why to sign in.
31. As a signed-in user on Profile, I want my name/avatar, Sign out, and optional “My contributions” (listings I added or verified), so that I have a minimal signed-in home without a public profile URL.
32. As a signed-out user on Reviews, I want a sign-in prompt (“See and manage your reviews”), so that I know the tab is personal.
33. As a signed-in user on Reviews, I want a list of listings I rated (stars + snippet + link to edit on listing detail), so that I can manage my feedback without a public social feed.
34. As a signed-in user with no reviews yet, I want “You haven’t rated any restrooms yet” with a CTA to Explore, so that I know where to go next.

### Contribution & trust

35. As a contributor, I want optional Google sign-in via Supabase Auth, so that I can add, verify, rate, and report with low friction.
36. As a signed-in user, I want to add a CR by searching an establishment via Google Places and using that place as the pin reference, so that listings are tied to real establishments.
37. As a signed-in user adding a listing, I want to enter floor/area, restroom label, amenity checklist, and optional seed photos (max 3), so that others know which specific restroom I mean inside a building.
38. As a signed-in user, I want new listings to publish immediately as Active with an unverified overlay, so that contribution is not blocked by an approval queue.
39. As a signed-in user searching to add a CR, I want existing restroom listings for that place to appear, so that I do not create duplicates.
40. As a signed-in user who finds a matching existing CR, I want to be asked “Is this the same CR?” and, if yes, trigger verify instead of create, so that trust accrues to the real pin.
41. As a signed-in user who finds the same establishment but a different restroom, I want to continue adding a sibling listing, so that malls can have multiple restroom pins.
42. As a signed-in user on listing detail, I want to verify that a CR exists (one verify per listing from me), so that others spend less time on fake pins.
43. As a community, I want a listing to become “Community verified” (teal checkmark) after at least three distinct verifies, so that trust is visible on the map and detail page.
44. As a signed-in user, I want to rate 1–5 stars with cleanliness / amenities / access checkboxes, optional comment, and optional review photos (max 3), so that feedback is structured and comparable.
45. As a signed-in user, I want only one review per listing (editable later), so that scores are not gamed by spam reviews.
46. As a browser of a listing, I want newest feedback first, so that I see live conditions from recent visitors.
47. As a browser of a listing with no reviews, I want “No feedback yet — be the first to rate” (auth-gated), so that I am encouraged to contribute.
48. As a signed-in user, I want to report a listing (doesn’t exist / wrong location / permanently closed / inappropriate photos), so that bad data can be disputed or removed.
49. As a user, I want disputed listings hidden from the default map but openable via direct link with a warning banner, so that I am less likely to chase bad pins while admins investigate.
50. As a creator of a brand-new listing with no community activity from others, I want to edit amenities, floor/labels, and seed photos, so that I can fix mistakes I made.
51. As a creator of a brand-new listing with no community activity from others, I want to delete it, so that mistaken adds can be undone.
52. As a creator of a listing that already has verifies, ratings, or comments from others, I want the data to remain in the app (I cannot hard-delete), so that community trust is protected.
53. As a reader of reviews/verifies, I want light attribution (e.g. “Maria S.”) without profile pages, so that feedback feels human without building a social network.
54. As a user uploading photos, I want images compressed/resized before upload and failed uploads to allow remove/retry without losing other form fields, so that the app stays fast and resilient.

### Admin & launch

55. As an admin, I want a lightweight `/admin` panel (admin role only; non-admins redirected home), so that ops are separated from end-user chrome.
56. As an admin, I want left nav for listings seed/edit and report queue, so that moderation is workable without a full CMS.
57. As an admin, I want to seed/create/edit listings (~50–100 Metro Manila seeds for soft launch), so that the map is useful on first open.
58. As an admin, I want to moderate reports, merge duplicates, archive spam, set status, and remove abusive photos, so that the map stays trustworthy.
59. As a soft-launch participant, I want seeded listings marked unverified until community verifies, so that seed data is honest about trust level.
60. As a mobile user, I want a mobile-first responsive UI and PWA install (Add to Home Screen), so that the product feels app-like without native stores in v1.
61. As a product owner, I want the product to remain 100% free with no ads or paid pin ranking in v1, so that urgent findability is not compromised by monetization.
62. As a Filipino or traveling user, I want English UI with free-text comments in any language, so that v1 ships without full i18n.

### Errors & resilience

63. As a user when location is denied, I want a soft banner to enable location while still browsing Metro Manila default, so that I am not blocked.
64. As a user when map or Places API fails, I want an inline error with Retry on the current screen, so that transient failures are recoverable.
65. As a user when network/API fails for nearby, detail, or contribute actions, I want a toast or banner with Retry and last-known UI preserved where possible, so that I do not lose context.
66. As a user when auth is cancelled or fails, I want to stay on `/login` with retry or return to the previous screen on cancel, so that failed OAuth is not a dead end.
67. As a user opening an archived or missing listing, I want “This restroom isn’t available” with a CTA home, so that dead links are handled gracefully.

### Developer & platform

68. As a developer, I want all core restroom behaviors exposed through a RestroomDirectory seam, so that UI, admin, and tests share one behavioral boundary.
69. As a developer, I want Google Maps for both map canvas and Places in v1, so that pin placement and establishment search stay consistent.
70. As a developer, I want Supabase PostgreSQL (+ PostGIS), Google Auth via Supabase Auth, image storage, and Vercel hosting, so that the stack matches the agreed architecture.
71. As a future native-app effort, I want v1 kept as web/PWA with a clear domain seam, so that Android/iOS can reuse behavior later without rewriting product rules.

## Implementation Decisions

### Product scope and geography

- Brand: HanapBidet PH; tagline: “Locate the nearest bidet in your area.”
- Launch: Metro Manila first; soft launch with ~50–100 seeded listings, then public.
- Default radius 1 km; max 5 km; user-adjustable (sensible steps e.g. 0.5 / 1 / 2 / 5 km).
- `NEXT_PUBLIC_LAUNCH_GEO` gates empty/coming-soon UX outside coverage (application-level, not a DB boundary).
- English UI; UGC language unrestricted. Free product in v1; no ads; no paid ranking.

### Routes and navigation (from APPFLOW)

| Route | Purpose |
| :---- | :---- |
| `/` | Explore — map home (primary screen) |
| `/restrooms/[id]` | Listing detail |
| `/add` | Add CR tab — auth-gated contribute flow |
| `/profile` | Profile tab — minimal signed-in home; sign-in prompt when signed out |
| `/reviews` | Reviews tab — your reviews only; auth-gated |
| `/login` | Google sign-in entry |
| `/auth/callback` | OAuth return (technical) |
| `/admin` | Admin panel with nested listings + report queue (admin only) |

Mobile: bottom tabs (Explore · Add CR · Profile · Reviews). Desktop: no bottom tabs; left sidebar + map. Admin: separate layout with simple left nav.

### Domain model

- **Restroom listing** = map pin; unit of verify / rate / report.
- **Establishment** = Google Place grouping (`place_id` unique); coordinates on establishment; sibling restrooms share `establishment_id`.
- Statuses: `active`, `disputed`, `closed`, `archived`.
- `community_verified` = `verify_count >= 3` (computed, not stored).
- `pin_variant` = bidet / standard + unverified overlay when `verify_count < 3` and `status = active`.
- Creator hard-delete / edit only when no other-user verify or review exists; otherwise app-owned; admin can always edit/archive/merge.
- One verify per user per listing; one review per user per listing (upsert/edit).
- Attribution: Google given name + last initial; no public profile URLs.

### Amenities taxonomy (enums)

```sql
bidet_type: none | manual_spray | high_pressure | built_in
access_cost: free | paid
access_scope: public | needs_patronage
restroom_status: active | disputed | closed | archived
report_reason: doesnt_exist | wrong_location | permanently_closed | inappropriate_photos
report_status: open | reviewed | dismissed
```

Basics checklist: `has_tissue`, `has_soap`, `has_hand_drying` (boolean).

### Data layer (Supabase PostgreSQL + PostGIS)

Tables: `profiles`, `establishments`, `restrooms`, `restroom_photos`, `verifies`, `reviews`, `review_photos`, `reports`.

- Geo: GIST index on `establishments.location`; nearby via `ST_DWithin` joined to active `restrooms`.
- Denormalized aggregates on `restrooms`: `verify_count`, `rating_avg`, `rating_count` (maintained by triggers).
- RLS: anonymous read of public listings; authenticated writes scoped to own rows; admin via `profiles.is_admin` or service role on server.
- Storage buckets: `restroom-photos/{restroom_id}/`, `review-photos/{review_id}/`; max 3 photos per listing seed and per review; WebP preferred; client compress before upload.
- Disputed policy: excluded from `listNearby` default; allowed on direct `/restrooms/[id]` with warning banner.

### RestroomDirectory (primary seam)

Single application/domain boundary. All product rules live here; UI pages and `/admin` are callers only.

**Operations:**

| Operation | Auth | Notes |
| :---- | :---- | :---- |
| `listNearby` | guest+ | Radius, filters, pin variants; excludes disputed from default |
| `getRestroom` | guest+ | Detail, photos, reviews newest-first, aggregates |
| `listSiblings` | guest+ | Active restrooms at same establishment |
| `searchPlaces` | user+ | Google Places; not persisted |
| `findExistingForPlace` | user+ | Duplicate check on add |
| `addRestroom` | user | Create establishment if needed; immediate `active` |
| `verifyRestroom` | user | Insert verify; duplicate-add shortcut |
| `upsertReview` | user | One per user per listing |
| `reportRestroom` | user | May set `disputed` |
| `deleteRestroom` / `updateRestroom` | user (creator, gated) / admin | Community-activity gate for creator |
| `listMyReviews` | user | Reviews tab |
| `listMyContributions` | user | Profile tab |
| `adminUpsertRestroom` | admin | Seed/edit |
| `adminSetStatus` | admin | Lifecycle |
| `adminMerge` | admin | Archive loser, reassign verifiers/reviews per merge rules |
| `adminRemovePhoto` | admin | Soft-delete via `removed_at` |
| `listOpenReports` | admin | Report queue |

**Adapters (mocked in tests):** Google Places/Maps, Supabase Auth, Postgres, storage/image pipeline, browser geolocation.

Expose primarily via **Next.js Server Actions**; thin Route Handlers only where client cache (e.g. TanStack Query for map filters) needs them.

### Technical stack (from TRD)

- **Frontend:** Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, Zod validation.
- **Maps (v1):** `@vis.gl/react-google-maps`; Google Maps JS + Places APIs.
- **Backend:** Next.js server layer only; no Supabase Edge Functions in v1.
- **Auth:** Supabase Auth — Google OAuth only; JWT in HTTP-only cookie; profile bootstrap on first login.
- **PWA:** Serwist or `@ducanh2912/next-pwa`.
- **Tests:** Vitest against RestroomDirectory behavior.
- **Hosting:** Vercel + Supabase (Postgres, Auth, Storage).

### UI system (from UI_DESIGN + DESIGN.md)

- Aesthetic: modern minimal, map-first, glassmorphic overlays; calm assurance; not clinical or playful.
- Primary teal `#006767`; CTA gradient to `#008282`; Soft Aqua chips `#d0e7e9`; error `#ba1a1a`.
- Fonts: Montserrat (headlines), Public Sans (body). Light mode default; dark mode via top-bar toggle.
- Map pins: bidet = teal; standard = charcoal `#4f5e67`; unverified = dashed overlay.
- Mobile bottom sheets: peek 240px → half → expanded 95%; 40×4px drag handle.
- Primary navigation CTA: “Open in Google Maps” (teal gradient).

### Phased implementation plan (tracer bullets)

Execute in order; each phase should leave the repo in a verifiable state. Tests accumulate on RestroomDirectory from phase 1.

| Phase | Goal | Deliverables |
| :---- | :---- | :---- |
| **0 — Scaffold** | Runnable app shell | Next.js 16 + TS + Tailwind + shadcn; env var names; Vitest; empty `RestroomDirectory` interface + test harness with mocked adapters |
| **1 — Data foundation** | Persisted domain | Supabase migrations: enums, tables, indexes, PostGIS, RLS, triggers (`verify_count`, ratings); storage buckets + policies |
| **2 — Read path** | Browse works | `listNearby`, `getRestroom`, `listSiblings` + tests (radius, filters, pin variants, disputed exclusion) |
| **3 — Auth** | Google sign-in | Supabase Auth, `/login`, `/auth/callback`, profile bootstrap, session in Server Actions, return-to-interrupted-flow |
| **4 — Write path (user)** | Contribute works | `searchPlaces`, `findExistingForPlace`, `addRestroom`, `verifyRestroom`, `upsertReview`, `reportRestroom`, creator edit/delete gates + full RestroomDirectory test suite for contribution/trust rules |
| **5 — Admin** | Ops works | `admin*` operations, service-role seed path, `/admin` layout + listings + report queue |
| **6 — Explore UI** | Map home | `/` with Google Map, pins, filters, radius, location grant/deny, desktop sidebar vs mobile sheets, empty/coming-soon states |
| **7 — Detail UI** | Decision screen | `/restrooms/[id]` amenities, siblings, reviews, verify/rate/report CTAs, Maps handoff, disputed banner |
| **8 — Add flow UI** | `/add` | Places search, duplicate prompt, amenity form, photo upload pipeline |
| **9 — Account tabs** | Profile + Reviews | `/profile`, `/reviews`, mobile bottom nav, auth gates |
| **10 — PWA & polish** | Ship-ready | PWA manifest/service worker, theme toggle, error/retry states, responsive pass |
| **11 — Soft launch** | Cold start solved | Seed ~50–100 Metro Manila listings via admin; grant `is_admin` to ops accounts |

**Definition of done (v1):** Nearby map works in Metro Manila; listing detail + distance + Maps handoff; signed-in add/verify/rate; admin seed/moderate; PWA usable on mobile Chrome/Safari.

### Maps cost escape hatch (documented, not v1)

Replace map renderer with MapLibre + OSM tiles; keep Google Places and `place_id` values until a separate migration.

## Testing Decisions

### What makes a good test

- Test **external behavior through RestroomDirectory only**: given actor, location, radius, filters, existing listings, and mutation inputs, assert outputs and resulting listing state visible to callers.
- Do **not** test implementation details: SQL column names, React trees, Map SDK call sequences, CSS, or PWA manifest wiring in the core suite.
- **One seam** — RestroomDirectory. Adapters are mocked; UI gets thin smoke/e2e checks later if needed.

### Modules to test

- `RestroomDirectory` exclusively for product rules.
- Adapter contracts tested only via RestroomDirectory integration tests with fakes (not live Google/Supabase in CI).

### Coverage checklist

- Nearby within radius; outside radius excluded; filter combinations; pin-variant classification.
- Add anchored to `place_id`; siblings; duplicate → verify instead of create.
- Verify uniqueness; community verified at ≥3.
- Review uniqueness, update-in-place, checkboxes, newest-first ordering.
- Report → disputed status; default map exclusion; direct-link warning path.
- Creator delete/edit gated on community activity; admin archive/merge always available.
- Authz: guest cannot mutate; user can contribute; admin for admin ops; non-admin rejected.

### Prior art

Greenfield repository — RestroomDirectory tests are the first and primary prior art.

## Out of Scope

- Native Android/iOS store apps (web + PWA only).
- Social features: public profiles, followers, feeds, DMs, check-ins, gamification, leaderboards.
- In-app turn-by-turn navigation.
- Nationwide or multi-metro coverage at launch.
- Ads, subscriptions, paid pin placement, monetization.
- Full bilingual UI / i18n.
- Freeform amenity tags; more than three pin variants.
- Proximity-gated verify; hard admin approval queue for every new listing.
- OpenStreetMap / MapLibre as v1 map renderer.
- Supabase Edge Functions as primary backend.
- Email/password auth.
- Heavy admin analytics, bulk marketing tools, second public CMS.
- `/dashboard`, `/settings`, public profile URLs, `/signup`, onboarding wizard.

## Further Notes

- **Testing seam confirmation:** RestroomDirectory is the sole behavioral seam for v1 (agreed in PRD, TRD, DATA_ARCHITECTURE, and spec). UI, admin, and Server Actions call it; adapters are swappable test doubles. If you expect a different seam (e.g. splitting read vs write modules), say so before `/to-tickets`.
- Cold start is a product risk; seeding is intentional, not polish.
- Indoor GPS is unreliable; establishment coordinates + floor/area labels are the honest model.
- After this spec: split into tracer-bullet tickets via `/to-tickets`, then implement per ticket.
- Issue tracker: local markdown under `context/` until `/setup-matt-pocock-skills` configures GitHub Issues.
