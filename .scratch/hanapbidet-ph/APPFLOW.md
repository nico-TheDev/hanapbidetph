# HanapBidet PH — App Flow (v1)

**Status:** agreed via grilling  
**Source:** [spec.md](./spec.md), [PRD.md](./PRD.md), [UI_DESIGN.md](./UI_DESIGN.md)

---

## Pages List

| Route | Purpose |
| :---- | :---- |
| `/` | **Explore** — map home; browse nearby restrooms (primary screen) |
| `/restrooms/[id]` | Listing detail (amenities, trust, photos, reviews, actions) |
| `/add` | **Add CR** tab — add restroom flow (auth-gated) |
| `/profile` | **Profile** tab — minimal signed-in home (auth prompt when signed out) |
| `/reviews` | **Reviews** tab — your reviews only (auth-gated list) |
| `/login` | Google sign-in entry (also usable as modal from gated actions) |
| `/auth/callback` | OAuth return (technical; not a product “page”) |
| `/admin` | Admin panel (admin role only) |
| `/admin` nested | Listings seed/edit, report queue (lightweight left nav) |

**Not in v1:** `/dashboard`, `/settings`, public profile URLs, `/signup`, email/password auth, onboarding wizard.

---

## Navigation Type

| Viewport | Pattern |
| :---- | :---- |
| **Mobile** | **Bottom tab bar:** Explore · Add CR · Profile · Reviews. Explore (`/`) is map-first with compact **top bar** (logo, radius, filters, theme toggle, optional avatar). Pin/detail as bottom sheet or full-screen with back to map. Add CR via tab → `/add`. |
| **Desktop** | Google Maps–style **left sidebar**: nearby list → click opens detail in the panel; map stays on the right. Same top-bar controls for radius, filters, account, theme toggle. **No bottom tabs.** |
| **Admin** | Separate layout with simple left nav (listings / reports). Not end-user chrome. |

### Bottom tabs (mobile only)

| Tab | Route | Behavior |
| :---- | :---- | :---- |
| **Explore** | `/` | Map home, nearby pins, filters, radius |
| **Add CR** | `/add` | Auth-gated; anonymous → `/login` then return |
| **Profile** | `/profile` | Signed out → Continue with Google; signed in → name/avatar, Sign out, optional **My contributions** (listings you added/verified). No public profile URL. |
| **Reviews** | `/reviews` | **Your reviews only** — signed out → sign-in prompt; signed in → list of listings you rated (stars + snippet + link to edit on listing detail). Not a public feed. |

---

## First Screen

Brand-new visitor lands on `/` immediately — map + brand visible. **No splash, no onboarding, no account wall.**

1. Request location (browser prompt and/or soft “Use my location”).
2. **Granted:** center on user; show pins in default **1 km** radius; distances on.
3. **Denied / unavailable:** Metro Manila default center; **no distances**; still browseable.
4. Sign-in only when they hit Add CR tab, Profile, Reviews, Verify / Rate / Report.

---

## Auth Flow

Google OAuth via Supabase only. No email verify. No onboarding. No post-login dashboard.

```
Browse anonymously (/)
  → tap Add CR tab / Profile / Reviews / Verify / Rate / Report
  → /login (“Continue with Google”)
  → Google OAuth → /auth/callback
  → return to the interrupted tab or action
```

- First-time and returning Google users share the same path (minimal profile from Google name).
- Signed-in home: **Profile** tab (`/profile`) — name/avatar, Sign out, optional My contributions.
- Avatar may also appear in the top bar on Explore for quick access.
- Admins use the same Google login; `/admin` rejects non-admins.

---

## Core User Journey 1 — Find a CR and get directions

**Goal:** Find a nearby usable comfort room and navigate there.

1. Open **Explore** tab (`/`) — anonymous OK.
2. Grant location → map centers on me; pins within **1 km**.
3. Optionally filter (e.g. Has bidet, Free).
4. Optionally widen radius (up to **5 km**) if nothing suitable is close.
5. Tap a pin (mobile) **or** pick a row in the desktop sidebar list.
6. Read detail: amenities, distance, trust (verified / unverified), photos, sibling restrooms at the same place.
7. Tap **Directions** → hand off to Google Maps / Apple Maps.
8. Done — app does not provide in-app routing.

---

## Core User Journey 2 — Contribute / improve the map

**Goal:** Add a missing CR, or strengthen an existing listing (verify / rate / report).

### Add path (primary)

1. Tap **Add CR** tab → if anonymous, `/login` → Google → return to `/add`.
2. On `/add`: search establishment via Google Places.
3. Select place → see any **existing restrooms** at that place.
4. If a match: **“Is this the same CR?”**
   - **Yes** → record **verify** (no new pin) → land on that listing.
   - **No** → continue as **sibling** restroom.
5. Enter floor/area, restroom label, amenity checklist; optional seed photos (max 3).
6. Publish immediately → Active + **unverified** overlay → detail of new listing.

### From listing detail (same journey family)

- **Verify** (one per user per listing) → counts toward Community verified (≥3).
- **Rate** (1–5 + checkboxes + optional comment/photos; one review per listing, editable).
- **Report** (doesn’t exist / wrong location / permanently closed / inappropriate photos).

### Reviews tab (manage your feedback)

1. Tap **Reviews** tab → if anonymous, sign-in prompt → `/login` → return to `/reviews`.
2. See list of listings you rated (stars + snippet).
3. Tap a row → listing detail → edit your review in place.

---

## Empty States

| Situation | What shows |
| :---- | :---- |
| Outside Metro Manila / uncovered area | Map loads; clear **“Coming soon outside Metro Manila”**. Optional “Browse Metro Manila” → default center. No fake national pins. |
| In coverage, 0 pins in radius | “No restrooms nearby” + suggest widen radius and/or clear filters. Signed-in: **Add CR** tab. |
| Filters hide everything | Same empty copy; emphasize **Clear filters**. |
| Listing has no reviews | “No feedback yet — be the first to rate” (auth-gated). |
| Listing has no photos | Placeholder / amenity-focused detail; no broken gallery. |
| Add flow: no existing CRs at place | Skip duplicate prompt; go straight to create form. |
| Profile tab (signed out) | Continue with Google + short copy (“Sign in to add, verify, and rate”). |
| Profile tab (signed in, no contributions) | Name/avatar + Sign out; optional empty “My contributions”. |
| Reviews tab (signed out) | Sign-in prompt (“See and manage your reviews”). |
| Reviews tab (signed in, no reviews) | “You haven’t rated any restrooms yet” + CTA to Explore. |
| Admin: empty report queue | “No open reports.” |

---

## Error States

No payments in v1 — no failed-payment path.

| Error | Recovery |
| :---- | :---- |
| Location denied / unavailable | Stay on `/`; Metro Manila default center; no distances; soft banner to enable location. |
| Map / Places API failure | Inline error + **Retry**; stay on current screen. |
| Network / API failure (nearby, detail, contribute) | Toast or inline banner + **Retry**; keep last-known UI when possible. Detail fail → back to map with error. |
| Auth cancelled / Google fail | Stay on `/login` with retry; cancel returns to previous screen. |
| Add / verify / rate / report fail | Stay on form/detail; show error; preserve input for retry. |
| Photo upload fail | Keep other fields; mark failed image; allow remove/retry (photos optional for publish). |
| Listing not found / archived | “This restroom isn’t available” + CTA to `/`. |
| Non-admin hits `/admin` | Redirect to `/` (or 403 with link home). |
| Disputed listing | Warning badge and/or hidden from default map per policy; openable if deep-linked. |

---

## References

- Product spec: [spec.md](./spec.md)
- PRD: [PRD.md](./PRD.md)
- UI design: [UI_DESIGN.md](./UI_DESIGN.md)
- Design tokens: [design/DESIGN.md](./design/DESIGN.md)
