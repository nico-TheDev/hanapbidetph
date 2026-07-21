# HanapBidet PH — Product Requirements Document (v1)

**Status:** ready for implementation planning  
**Source:** [spec.md](./spec.md)  
**Launch geography:** Metro Manila (soft launch → public)  
**Primary test seam:** RestroomDirectory

---

## Product one-pager

| Field | Answer |
| :---- | :---- |
| **App Name** | HanapBidet PH |
| **Tagline** | Locate the nearest bidet in your area. |
| **Problem** | People who need a comfort room (CR) in public—especially those who frequently have bowel movements away from home, and travelers unfamiliar with an area—cannot reliably find a nearby restroom that has a usable bidet, or know what amenities a CR actually offers. Existing maps show establishments, not restrooms; they rarely say whether there is a bidet, tissue only, high pressure, paid access, or whether the listing is trustworthy. The result is wasted time, anxiety, and uncomfortable wash-ups. |
| **Target User** | Primary: Metro Manila locals who often need a public CR and care whether it has a bidet (manual spray, high-pressure, or built-in). Secondary: travelers and visitors who don’t know the area and need any usable nearby CR fast. Both groups need urgency-friendly findability—open the app, see what’s close, decide, navigate—without an account wall for browsing. |
| **Core Features (Must Have)** | See below |
| **Nice to Have** | See below |
| **Out of Scope** | See below |
| **User Stories** | See below (condensed from spec; full list in [spec.md](./spec.md)) |
| **Success Metrics** | See below |

---

## Problem

People who need to use a comfort room in public—especially those who frequently have bowel movements away from home, and travelers unfamiliar with an area—often cannot find a nearby restroom that has a usable bidet (or know what amenities a CR actually offers).

Existing maps show establishments, not restrooms. They rarely indicate bidet vs tissue-only, pressure/type, paid vs free access, public vs needs patronage, or whether the listing is trustworthy. Users waste time, feel anxiety, and end up with uncomfortable wash-ups.

---

## Solution

**HanapBidet PH** is a mobile-first progressive web app that shows nearby restrooms on a map, with clear amenity and trust signals, driven by community contribution.

On open (with location), the user sees comfort rooms within a default **1 km** radius (adjustable up to **5 km**), with distinct pins for bidet vs non-bidet vs unverified listings. They can open a listing for amenities, distance, ratings, photos, and comments, then hand off to Google Maps / Apple Maps for navigation. Signed-in users can add restrooms (anchored to a Google Place), verify that a listing exists, rate and comment with structured feedback, and report problems. Admins seed Metro Manila data and moderate disputes. Social networking is out of scope; contribution exists for map quality only.

---

## Target user

**Primary:** Metro Manila residents who frequently need a public CR and specifically want a bidet (or need to know when one is available). They value speed, proximity, and trust signals over discovery browsing.

**Secondary:** Travelers and visitors unfamiliar with the area who need any usable nearby CR, with clear amenity and access info (free/paid, public/patronage).

Both should be able to browse anonymously under urgency; sign-in is only required to contribute (add, verify, rate, report).

---

## Core features (must have)

**Map & discovery**
- Map home centered on user location; default radius 1 km, adjustable up to 5 km
- Show all nearby CRs by default (not bidet-only)
- Three pin variants: bidet pin, standard pin, unverified overlay (combinable)
- Filters: has bidet; free vs paid; community verified only; public vs needs patronage
- Location denied → Metro Manila default center; omit distance until location available
- Empty / “coming soon” outside launch metro (no fake national map)

**Listing detail**
- Establishment context, floor/area, restroom label, structured amenities
- Distance when location known; rating summary; photos; comments (newest first)
- Sibling restrooms at the same establishment
- Community verified badge (≥3 distinct verifies) vs unverified
- Hand off to Google Maps / Apple Maps (no in-app routing)

**Contribution (signed-in via Google)**
- Add CR: Google Places search → place as pin reference → floor/label/amenities → optional seed photos (max 3, optimized) → publish immediately as Active + unverified
- Duplicate check: existing restrooms for that place → “same CR?” → Yes = verify, No = add sibling
- Verify (one per user per listing); community verified at ≥3 distinct verifies
- Rate 1–5 stars + optional comment + cleanliness/amenities/access checkboxes + optional review photos; one review per listing (editable)
- Report: doesn’t exist / wrong location / permanently closed / inappropriate photos
- Disputed listings warned or hidden per policy
- Creator edit/delete only when no community activity; otherwise app-owned data

**Anonymous use**
- Browse map and listing details without signup

**Admin (`/admin`)**
- Seed/create/edit listings (~50–100 Metro Manila seeds for soft launch)
- Moderate reports/disputes; merge duplicates; archive spam; remove abusive photos; always edit listing fields

**Product / platform**
- Mobile-first responsive UI + PWA (Add to Home Screen)
- English UI; free-text comments in any language
- 100% free in v1: no ads, no paid pin ranking
- Stack: Next.js + Supabase (Postgres, Auth, Storage) + Google Maps/Places + Vercel
- Domain seam: RestroomDirectory for all core restroom behaviors

---

## Nice to have (v2 / if time allows)

- Native Android / iOS apps (reuse RestroomDirectory domain rules)
- Broader geography (additional metros / nationwide)
- OpenStreetMap / MapLibre as a cost escape hatch for map tiles
- Full bilingual UI / i18n
- Optional small drag to fine-tune pin coordinates after Places anchoring
- Proximity-gated verify
- Heavier admin analytics / bulk tools
- Email/password or additional auth providers
- Richer establishment details beyond name, address, coordinates, `place_id`
- Social / gamification layers (explicitly deferred; see Out of Scope)

---

## Out of scope (this version)

- Native Android/iOS store apps (web + PWA only)
- Social features: profiles, followers, feeds, DMs, check-ins, gamification, leaderboards, user-to-user interaction beyond light attribution (e.g. “Maria S.”)
- In-app turn-by-turn navigation / routing
- Nationwide or multi-metro coverage at launch (Metro Manila first)
- Ads, subscriptions, paid pin placement, or any monetization
- Full bilingual UI / i18n
- Showing every Google establishment detail beyond restroom identification needs
- Freeform amenity tags; more than three map pin variants
- Proximity-gated verify; hard admin approval queue for every new listing
- OpenStreetMap / MapLibre as the v1 map renderer
- Heavy admin analytics, bulk marketing tools, or a second public CMS
- Email/password auth (Google only)

---

## User stories

### Urgency & map

1. As a person who needs a CR urgently, I want to open the app and see nearby restrooms on a map centered on my location, so that I can find a place quickly without searching blindly.
2. As a nearby user, I want a default search radius of 1 km (expandable up to 5 km), so that results feel relevant and I can look farther when nothing suitable is close.
3. As a user whose location is blocked or unavailable, I want the map to fall back to a Metro Manila default center without distances, so that I can still browse listings.
4. As a traveler unfamiliar with the area, I want to see all nearby CRs by default (not only bidet ones), so that I understand what options exist around me.
5. As a bidet-seeking user, I want bidet restrooms to use a distinct map pin (and standard / unverified variants for others), so that I can spot options and trust level at a glance.
6. As a user, I want to filter by has bidet, free vs paid, community verified only, and public vs patronage, so that I can narrow to what I need.
7. As a user, I want to tap a pin and see restroom details (amenities, rating, photos, comments, distance when known), then open directions in Google/Apple Maps, so that I can decide and navigate without in-app routing.
8. As an anonymous user, I want to browse the map and listing details without signing up, so that urgency is not blocked by an account wall.

### Contribution & trust

9. As a contributor, I want optional Google sign-in via Supabase Auth, so that I can add, verify, rate, and report with low friction.
10. As a signed-in user, I want to add a CR via Google Places (with floor/area, label, amenities, optional seed photos), publish immediately as unverified, and avoid duplicates by verifying an existing match or adding a sibling restroom at the same place.
11. As a signed-in user, I want to verify that a CR exists (one verify per listing from me) and see “Community verified” after ≥3 distinct verifies, so that others spend less time on fake pins.
12. As a signed-in user, I want to rate 1–5 stars with structured checkboxes, optional comment/photos, and only one review per listing (editable), so that feedback is comparable and not spam-gamed.
13. As a signed-in user, I want to report bad listings and see disputed listings warned or hidden per policy, so that I am less likely to chase bad pins.
14. As a creator of a brand-new listing with no community activity, I want to edit or delete it; once others have verified/rated/commented, I want the data to remain in the app, so that community trust is protected.

### Admin & launch

15. As an admin, I want a lightweight `/admin` panel to seed listings, moderate reports, merge duplicates, archive spam, edit fields, and remove abusive photos, so that soft launch and ops stay workable.
16. As a soft-launch participant, I want ~50–100 seeded Metro Manila listings marked unverified until community verifies, so that the app is useful on first open.
17. As a user outside the launch metro, I want a clear empty or “coming soon” experience, so that expectations match Metro Manila–first coverage.
18. As a mobile user, I want a mobile-first responsive UI and PWA install, so that the product feels app-like without native stores in v1.
19. As a product owner, I want the product to remain 100% free with no ads or paid pin ranking in v1, so that urgent findability is not compromised by monetization.

*Full numbered stories (1–56), including developer/seam stories, live in [spec.md](./spec.md).*

---

## Success metrics

### Soft-launch / v1 “done” (product readiness)

Per spec, soft launch success means:

- Nearby map works in Metro Manila (default 1 km, max 5 km, filters, pin variants)
- Listing detail + distance (when location known) + Maps handoff works
- Signed-in add / verify / rate flows work
- Admin can seed and moderate
- PWA usable on mobile Chrome / Safari

### Launch quality targets (suggested)

| Metric | Target (v1 soft → public) |
| :---- | :---- |
| Seeded Metro Manila listings at soft launch | ~50–100 Active listings |
| Cold-start usefulness | Soft-launch users can open map and see pins without an empty map in covered areas |
| Time-to-first-useful result | User with location can see nearby pins within seconds of map load (no account required) |
| Community trust signal | Listings reach “Community verified” (≥3 distinct verifies) without admin bottleneck for normal adds |
| Contribution health | Soft-launch cohort can add, verify, and rate; duplicate-add path prefers verify over spam pins |
| Data integrity | Disputed / fake pins are reportable and admin-resolvable (merge, archive, photo removal) |
| Monetization constraint | 0 ads / paid ranking in v1 |

### Explicit non-goals for success scoring

- Signup/DAU vanity metrics without map usefulness
- Nationwide coverage at launch
- Social engagement (follows, feeds, leaderboards)

---

## Domain & constraints (summary)

| Topic | Decision |
| :---- | :---- |
| Listing unit | Restroom listing = map pin; establishment = Google Place grouping (many restrooms per place) |
| Amenities | Structured: bidet type; tissue/soap/dryer; free/paid; public/patronage |
| Statuses | Active, Disputed, Closed, Archived |
| Ownership | App-owned after community activity; creator hard-delete only with no other-user verify/rating/comment |
| Auth | Google OAuth via Supabase Auth; anonymous read |
| Maps | Google Maps JS + Places; external navigation handoff |
| Primary seam | RestroomDirectory (nearby, detail, add, verify, rate, report, lifecycle, admin mutations) |

---

## Risks & notes

- **Cold start** is a product risk; seeding and soft launch are intentional, not optional polish.
- Indoor GPS is unreliable; establishment coordinates + floor/area labels are the honest model for mall CRs.
- Future OSM map tiles remain a cost optimization, not a v1 requirement.

---

## References

- Product spec: [spec.md](./spec.md)
- Visual design system: [design/DESIGN.md](./design/DESIGN.md)
- Stitch design brief: [stitch-design-brief.md](./stitch-design-brief.md)
