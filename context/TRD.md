# HanapBidet PH — Technical Requirements Document (v1)

**Status:** agreed (post-grill)  
**Source:** [spec.md](./spec.md), [PRD.md](./PRD.md)  
**Launch geography:** Metro Manila (soft launch → public)  
**Primary application seam:** RestroomDirectory

---

## Stack summary

| Area | Decision |
| :---- | :---- |
| **Frontend** | Next.js 16 (App Router) with TypeScript, Tailwind CSS, shadcn/ui; mobile-first; installable PWA |
| **Backend** | Next.js server layer (Server Actions and/or Route Handlers) owning `RestroomDirectory`; talks to Supabase from the server. No Supabase Edge Functions in v1 |
| **Database** | PostgreSQL via Supabase; Supabase Storage for images; RLS aligned with anonymous read vs authenticated write |
| **Auth** | Supabase Auth — Google OAuth only (no email/password in v1) |
| **Hosting** | Vercel (Next.js app); Supabase (Postgres, Auth, Storage) |
| **Third-party APIs** | See below |
| **Key Libraries** | See below |
| **Environment Variables** | See below (names only) |
| **Constraints** | See below |

---

## Third-party APIs

| Service | Purpose | Tier notes |
| :---- | :---- | :---- |
| **Google Maps JavaScript API** | Map canvas, markers/pins, camera centering | Pay-as-you-go after per-SKU free monthly usage caps (Essentials/Pro/Enterprise). Billing-enabled Google Cloud project required. |
| **Google Places API** | Establishment search, place details, `place_id` anchoring for restroom pins | Same Maps Platform billing model; often higher sensitivity to cost under Autocomplete/Details SKUs. |
| **Google OAuth** | Sign-in identity via Supabase Auth | Free for standard OAuth client usage. |
| **Supabase** | Postgres, Auth, Storage, RLS | Free tier preferred for soft launch; paid plan if quotas are exceeded. |
| **Vercel** | Hosting / CDN for the Next.js app | Hobby/free preferred for soft launch; Pro if needed. |

### Maps cost escape hatch (not v1)

When Google Maps canvas cost is no longer affordable:

1. **Replace map renderer** with **MapLibre GL + OpenStreetMap** (or equivalent) tiles for the map canvas and pins.
2. **Keep Google Places** (and existing Google `place_id` values on establishments) until a separate migration decides otherwise.
3. Full Places replacement is **out of scope** for the first escape hatch and is a later decision.

v1 ships Google Maps for **both** map canvas and Places (consistent pin placement + establishment search).

---

## Key libraries

| Area | Choice |
| :---- | :---- |
| UI primitives | shadcn/ui |
| Icons | Lucide Icons |
| Validation | Zod (forms + `RestroomDirectory` inputs/outputs) |
| Server/client data | Prefer Server Components + Server Actions; TanStack Query only where client cache/optimistic UI is needed (e.g. map filters, verify/rate) |
| Maps (v1) | `@vis.gl/react-google-maps` (Google Maps JS loader wrapper) |
| Image upload pipeline | Client-side compress/resize (e.g. `browser-image-compression`) before Supabase Storage upload |
| PWA | Serwist or `@ducanh2912/next-pwa` for Add to Home Screen / installability |
| Tests | Vitest — primary suite against `RestroomDirectory` behavior |

---

## Environment variables

Names only — never commit values.

### Public (client-safe)

| Variable | Purpose |
| :---- | :---- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-enforced) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps JS (+ client Places if used); restrict by HTTP referrer |
| `NEXT_PUBLIC_APP_URL` | Canonical app origin (auth redirects, absolute links) |
| `NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT` | Metro Manila fallback center (location denied) |
| `NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG` | Metro Manila fallback center (location denied) |
| `NEXT_PUBLIC_LAUNCH_GEO` | Launch geography flag (e.g. `metro-manila`) for empty / coming-soon outside coverage |

### Server-only

| Variable | Purpose |
| :---- | :---- |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin/seed paths only; never expose to the client |
| `GOOGLE_PLACES_API_KEY` | Optional separate server Places key (IP-restricted) if Places calls run server-side |

Admin authorization: prefer `profiles.is_admin` (or equivalent role flag) in the database over a separate email allowlist env var.

---

## Constraints

- **Mobile-first PWA** — usable on mobile Chrome/Safari; Add to Home Screen in v1; no native store apps.
- **Metro Manila first** — outside launch geo shows empty / coming-soon, not a fake national map.
- **Prefer free/cheap infra for v1** — Supabase/Vercel free tiers preferred; **Google Cloud billing enabled is OK** (Maps/Places free caps, then pay-as-you-go).
- **Product is free** — no ads, subscriptions, or paid pin ranking in v1.
- **English UI** — UGC (comments) may be any language; no full i18n in v1.
- **Anonymous browse** — map + detail without signup; auth required only for add / verify / rate / report / photo upload.
- **Single behavior seam** — UI and `/admin` call `RestroomDirectory`; do not fork product rules into separate seams.
- **Maps escape hatch documented** — MapLibre/OSM for canvas later; Places/`place_id` stay until a second migration.

---

## Architecture notes

### RestroomDirectory (primary seam)

Application/domain boundary for:

- Nearby query (radius, filters, pin-variant classification)
- Restroom detail + sibling restrooms at the same establishment
- Places search + find-existing-for-place
- Add restroom (immediate publish as Active + unverified)
- Duplicate path → verify instead of create
- Verify (one per user), review upsert (one per user), report
- Lifecycle/status and ownership/delete rules
- Admin mutations (upsert, set status, merge, remove photo)

**Adapters** (mocked in tests): Google Places/Maps, Supabase Auth, Postgres, storage/image pipeline, browser geolocation.

**Callers:** Next.js pages/components (including map UI) and lightweight `/admin`.

### Logical data (from spec)

Tables (or equivalent): `profiles`, `establishments` (`place_id` unique), `restrooms`, `verifies`, `reviews`, `reports`, restroom/review photos, admin role flag.

Representative operations: `listNearby`, `getRestroom`, `listSiblings`, `searchPlaces`, `findExistingForPlace`, `addRestroom`, `verifyRestroom`, `upsertReview`, `reportRestroom`, `adminUpsertRestroom`, `adminSetStatus`, `adminMerge`, `adminRemovePhoto`.

### Access control

- Public read of Active listings (and policy-defined Disputed visibility).
- Writes require authenticated Google user.
- Admin operations require admin role.
- Creator hard-delete only when there is no community activity from other users; otherwise admin soft-delete/archive only.

---

## Testing requirements

- Test **external behavior through `RestroomDirectory` only**.
- Do **not** treat SQL column names, React trees, Map SDK call sequences, CSS, or PWA manifest wiring as the core suite.
- Cover nearby radius/filters/pin variants, add + siblings + duplicate→verify, verify uniqueness + community-verified at ≥3, review uniqueness/update + newest-first, report→status transitions, creator delete rules, and authz (anon / signed-in / admin).

---

## Out of scope (technical)

- Supabase Edge Functions as the primary backend for v1
- Email/password auth
- In-app routing / turn-by-turn
- OpenStreetMap / MapLibre as the v1 map renderer
- Native Android/iOS apps
- Full i18n
- Heavy admin analytics / second public CMS

---

## References

- Product spec: [spec.md](./spec.md)
- Product requirements: [PRD.md](./PRD.md)
- Visual design system: [design/DESIGN.md](./design/DESIGN.md)
- Stitch design brief: [stitch-design-brief.md](./stitch-design-brief.md)
