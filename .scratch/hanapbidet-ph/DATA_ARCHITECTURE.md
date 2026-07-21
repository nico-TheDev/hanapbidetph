# HanapBidet PH — Data Architecture (v1)

**Status:** agreed (derived from post-grill specs)  
**Source:** [spec.md](./spec.md), [APPFLOW.md](./APPFLOW.md), [TRD.md](./TRD.md), [PRD.md](./PRD.md)  
**Stack:** Supabase PostgreSQL + PostGIS · Supabase Auth (Google OAuth) · Supabase Storage · Next.js server layer (`RestroomDirectory`)

---

## Summary

| Area | Decision |
| :---- | :---- |
| **Auth Provider** | Supabase Auth — Google OAuth only; JWT via session; `auth.users` is identity source |
| **Row Level Security** | Anonymous read of public listings; authenticated writes scoped to own rows; admin bypass via `profiles.is_admin` or service role on server |
| **User Roles** | `guest` (anon browse) · `user` (signed-in contributor) · `admin` (full moderation + seed) |
| **File Storage** | Supabase Storage — `restroom-photos/{restroom_id}/`, `review-photos/{review_id}/` |
| **Sensitive Fields** | No payment data in v1. Google OAuth tokens stay in Supabase Auth. PII limited to minimal profile (display name, avatar URL). |

---

## Entity relationship overview

```
auth.users (Supabase)
    └── profiles (1:1)
            ├── restrooms.created_by
            ├── verifies.user_id
            ├── reviews.user_id
            ├── reports.reporter_id / reports.reviewed_by
            └── restroom_photos.uploaded_by

establishments (1) ──< restrooms (many)
    place_id (Google, unique)

restrooms (1) ──< verifies
restrooms (1) ──< reviews ──< review_photos
restrooms (1) ──< reports
restrooms (1) ──< restroom_photos
restrooms (1) ──> restrooms.merged_into_id  (admin merge survivor)
```

---

## Tables

### `profiles`

Minimal display identity from Google; no public profile pages.

| Column | Type | Constraints | Notes |
| :---- | :---- | :---- | :---- |
| `id` | `uuid` | **PK**, FK → `auth.users.id` ON DELETE CASCADE | Same ID as Supabase Auth user |
| `display_name` | `text` | NOT NULL | Attribution format: given name + last initial (e.g. "Maria S.") |
| `avatar_url` | `text` | NULL | From Google; optional |
| `is_admin` | `boolean` | NOT NULL, DEFAULT `false` | Admin gate for `/admin` |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Indexes:** PK on `id`. Partial index on `is_admin` WHERE `is_admin = true` (admin lookups).

---

### `establishments`

Grouping metadata from Google Places; pin coordinates come from here.

| Column | Type | Constraints | Notes |
| :---- | :---- | :---- | :---- |
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` | Internal ID |
| `place_id` | `text` | NOT NULL, **UNIQUE** | Google Place ID — anchor for add flow |
| `name` | `text` | NOT NULL | Establishment name |
| `formatted_address` | `text` | NULL | Display / directions context |
| `lat` | `double precision` | NOT NULL | WGS84 |
| `lng` | `double precision` | NOT NULL | WGS84 |
| `location` | `geography(POINT, 4326)` | GENERATED or maintained | PostGIS point for radius queries |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Indexes:**
- UNIQUE on `place_id`
- GIST on `location` — **fast nearby lookup** (primary geo index)

---

### `restrooms`

Map pin and unit of verify / rate / report. Coordinates inherited from parent establishment in v1 (no per-restroom drag).

| Column | Type | Constraints | Notes |
| :---- | :---- | :---- | :---- |
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` | Public URL: `/restrooms/[id]` |
| `establishment_id` | `uuid` | NOT NULL, FK → `establishments.id` | Sibling restrooms share establishment |
| `created_by` | `uuid` | NULL, FK → `profiles.id` | NULL allowed for legacy admin seed rows |
| `floor_area` | `text` | NULL | e.g. "3F, North wing" |
| `restroom_label` | `text` | NULL | e.g. "Female", "Customer CR" |
| `bidet_type` | `bidet_type` enum | NOT NULL, DEFAULT `'none'` | See enums below |
| `has_tissue` | `boolean` | NOT NULL, DEFAULT `false` | Basics checklist |
| `has_soap` | `boolean` | NOT NULL, DEFAULT `false` | |
| `has_hand_drying` | `boolean` | NOT NULL, DEFAULT `false` | Hand dryer or paper towels |
| `access_cost` | `access_cost` enum | NOT NULL | `free` \| `paid` |
| `access_scope` | `access_scope` enum | NOT NULL | `public` \| `needs_patronage` |
| `status` | `restroom_status` enum | NOT NULL, DEFAULT `'active'` | See enums below |
| `verify_count` | `integer` | NOT NULL, DEFAULT `0` | Denormalized; distinct verifiers |
| `rating_avg` | `numeric(2,1)` | NULL | Denormalized; NULL if no reviews |
| `rating_count` | `integer` | NOT NULL, DEFAULT `0` | Denormalized |
| `merged_into_id` | `uuid` | NULL, FK → `restrooms.id` | Set when admin merges duplicate into survivor |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Computed (application layer, not stored):**
- `community_verified` = `verify_count >= 3`
- `has_bidet` = `bidet_type != 'none'`
- `pin_variant` = bidet / standard + unverified overlay when `verify_count < 3` and `status = 'active'`

**Indexes:**
- `restrooms_establishment_id_idx` on `establishment_id` — sibling listing, duplicate check on add
- `restrooms_status_idx` on `status` — filter Active vs Archived
- Partial `restrooms_active_idx` on `(establishment_id)` WHERE `status = 'active'` — default map queries
- `restrooms_created_by_idx` on `created_by` — "My contributions" on Profile tab

---

### `restroom_photos`

Seed gallery on listing (max **3** at publish; enforced in `RestroomDirectory`).

| Column | Type | Constraints | Notes |
| :---- | :---- | :---- | :---- |
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` | |
| `restroom_id` | `uuid` | NOT NULL, FK → `restrooms.id` ON DELETE CASCADE | |
| `uploaded_by` | `uuid` | NOT NULL, FK → `profiles.id` | |
| `storage_path` | `text` | NOT NULL | Path in Supabase Storage bucket |
| `sort_order` | `smallint` | NOT NULL, DEFAULT `0` | Gallery order |
| `removed_at` | `timestamptz` | NULL | Soft delete (admin abusive-photo removal) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Indexes:**
- `restroom_photos_restroom_id_idx` on `restroom_id` WHERE `removed_at IS NULL`

---

### `verifies`

One verify per user per listing.

| Column | Type | Constraints | Notes |
| :---- | :---- | :---- | :---- |
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` | |
| `restroom_id` | `uuid` | NOT NULL, FK → `restrooms.id` ON DELETE CASCADE | |
| `user_id` | `uuid` | NOT NULL, FK → `profiles.id` | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Constraints:**
- **UNIQUE** `(restroom_id, user_id)` — one verify per user per listing

**Indexes:**
- `verifies_restroom_id_idx` on `restroom_id`
- `verifies_user_id_idx` on `user_id` — "My contributions"

---

### `reviews`

One review per user per listing; author may edit in place.

| Column | Type | Constraints | Notes |
| :---- | :---- | :---- | :---- |
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` | |
| `restroom_id` | `uuid` | NOT NULL, FK → `restrooms.id` ON DELETE CASCADE | |
| `user_id` | `uuid` | NOT NULL, FK → `profiles.id` | |
| `stars` | `smallint` | NOT NULL, CHECK `stars BETWEEN 1 AND 5` | |
| `comment` | `text` | NULL | UGC; any language |
| `cleanliness_ok` | `boolean` | NULL | Structured checkbox; NULL = not answered |
| `amenities_ok` | `boolean` | NULL | |
| `access_ok` | `boolean` | NULL | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Constraints:**
- **UNIQUE** `(restroom_id, user_id)` — one review per user per listing

**Indexes:**
- `reviews_restroom_id_created_at_idx` on `(restroom_id, created_at DESC)` — **newest-first feedback feed**
- `reviews_user_id_idx` on `user_id` — Reviews tab (`/reviews`)

---

### `review_photos`

Optional photos attached to a review (max **3** per review; enforced in `RestroomDirectory`).

| Column | Type | Constraints | Notes |
| :---- | :---- | :---- | :---- |
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` | |
| `review_id` | `uuid` | NOT NULL, FK → `reviews.id` ON DELETE CASCADE | |
| `storage_path` | `text` | NOT NULL | |
| `sort_order` | `smallint` | NOT NULL, DEFAULT `0` | |
| `removed_at` | `timestamptz` | NULL | Admin removal |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Indexes:**
- `review_photos_review_id_idx` on `review_id` WHERE `removed_at IS NULL`

---

### `reports`

User-submitted disputes; drives admin queue and `disputed` status.

| Column | Type | Constraints | Notes |
| :---- | :---- | :---- | :---- |
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` | |
| `restroom_id` | `uuid` | NOT NULL, FK → `restrooms.id` ON DELETE CASCADE | |
| `reporter_id` | `uuid` | NOT NULL, FK → `profiles.id` | |
| `reason` | `report_reason` enum | NOT NULL | See enums below |
| `details` | `text` | NULL | Optional free text |
| `status` | `report_status` enum | NOT NULL, DEFAULT `'open'` | `open` \| `reviewed` \| `dismissed` |
| `reviewed_by` | `uuid` | NULL, FK → `profiles.id` | Admin who closed report |
| `reviewed_at` | `timestamptz` | NULL | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Indexes:**
- `reports_open_queue_idx` on `created_at` WHERE `status = 'open'` — **admin report queue**
- `reports_restroom_id_idx` on `restroom_id`

---

## Enums

```sql
CREATE TYPE bidet_type AS ENUM (
  'none',
  'manual_spray',
  'high_pressure',
  'built_in'
);

CREATE TYPE access_cost AS ENUM ('free', 'paid');

CREATE TYPE access_scope AS ENUM ('public', 'needs_patronage');

CREATE TYPE restroom_status AS ENUM (
  'active',
  'disputed',
  'closed',
  'archived'
);

CREATE TYPE report_reason AS ENUM (
  'doesnt_exist',
  'wrong_location',
  'permanently_closed',
  'inappropriate_photos'
);

CREATE TYPE report_status AS ENUM ('open', 'reviewed', 'dismissed');
```

---

## Relationships

| From | To | Cardinality | Notes |
| :---- | :---- | :---- | :---- |
| `profiles.id` | `auth.users.id` | 1:1 | Created on first Google sign-in |
| `restrooms.establishment_id` | `establishments.id` | many:1 | Sibling CRs at same mall |
| `restrooms.created_by` | `profiles.id` | many:1 | Creator ownership rules |
| `restrooms.merged_into_id` | `restrooms.id` | many:1 | Survivor pin after admin merge |
| `restroom_photos.restroom_id` | `restrooms.id` | many:1 | Max 3 seed photos |
| `verifies.restroom_id` | `restrooms.id` | many:1 | |
| `verifies.user_id` | `profiles.id` | many:1 | |
| `reviews.restroom_id` | `restrooms.id` | many:1 | |
| `reviews.user_id` | `profiles.id` | many:1 | |
| `review_photos.review_id` | `reviews.id` | many:1 | Max 3 per review |
| `reports.restroom_id` | `restrooms.id` | many:1 | Multiple reports allowed |
| `reports.reporter_id` | `profiles.id` | many:1 | |

---

## Auth model

### Auth Provider

**Supabase Auth** — Google OAuth only (no email/password in v1).

| Concern | Implementation |
| :---- | :---- |
| Identity | `auth.users` (managed by Supabase) |
| App profile | `profiles` row created via DB trigger or server hook on first login |
| Session | Supabase JWT in HTTP-only cookie (Next.js SSR) |
| Admin check | `profiles.is_admin = true` (set manually in DB for soft launch ops) |
| Service role | `SUPABASE_SERVICE_ROLE_KEY` — server-only for admin seed/merge; **never** exposed to client |

### User roles

| Role | Identity | Capabilities |
| :---- | :---- | :---- |
| **guest** | No session (`anon` key + RLS) | Browse map (`/`), listing detail, sibling discovery; no mutations |
| **user** | Authenticated Google user | Add CR, verify, rate/review, report, upload photos; edit/delete **own** listing only when no other-user community activity |
| **admin** | `profiles.is_admin = true` | All user capabilities + `/admin`: seed/edit any listing, report queue, set status, merge duplicates, archive, remove photos |

### Row Level Security (RLS)

All tables have RLS enabled. Primary enforcement is in Postgres; `RestroomDirectory` on the server uses the user session (anon or authenticated JWT). Admin mutations may use service role after verifying `is_admin` in application code.

| Table | SELECT | INSERT | UPDATE | DELETE |
| :---- | :---- | :---- | :---- | :---- |
| `profiles` | Own row; public read of `display_name`, `avatar_url` for attribution on reviews/verifies | Via trigger on signup | Own row (`display_name`, `avatar_url` sync) | — |
| `establishments` | Public | Authenticated (on add flow) or service role (seed) | Service role / admin | — |
| `restrooms` | Public: `status IN ('active', 'disputed')` — **disputed hidden from default nearby** (filtered in `listNearby`, not RLS); `closed`/`archived` only via direct ID or admin | Authenticated | Creator: amenities/labels/seed photos **only if** no other-user verify/review exists; admin: all fields | Creator hard-delete **only if** no other-user verify/review; else denied |
| `restroom_photos` | Public where `removed_at IS NULL` | Authenticated uploader = `auth.uid()` | Admin soft-remove (`removed_at`) | — |
| `verifies` | Public (attribution) | Authenticated; `user_id = auth.uid()` | — | — |
| `reviews` | Public (attribution + content) | Authenticated; `user_id = auth.uid()` | Own row only | — |
| `review_photos` | Public where `removed_at IS NULL` | Own review only | Admin soft-remove | — |
| `reports` | Own rows; admin reads all | Authenticated; `reporter_id = auth.uid()` | Admin updates status | — |

### Disputed listing policy (v1)

| Surface | Behavior |
| :---- | :---- |
| Default map / `listNearby` | **Exclude** `status = 'disputed'` |
| Direct link `/restrooms/[id]` | **Allow** with warning banner |
| Filters | "Community verified only" never includes disputed |
| Admin | Report queue surfaces open reports; admin sets `active`, `closed`, or `archived` |

### Community activity gate (creator edit/delete)

"Community activity" = exists another user's verify **or** review on the restroom.

```sql
-- Example check used by RestroomDirectory
EXISTS (
  SELECT 1 FROM verifies v
  WHERE v.restroom_id = $1 AND v.user_id <> $creator_id
) OR EXISTS (
  SELECT 1 FROM reviews r
  WHERE r.restroom_id = $1 AND r.user_id <> $creator_id
)
```

---

## Indexes summary (fast lookup)

| Purpose | Index |
| :---- | :---- |
| Nearby restrooms in radius | GIST on `establishments.location` + join to `restrooms` WHERE `status = 'active'` |
| Google Place duplicate check | UNIQUE `establishments.place_id` |
| Sibling restrooms at place | `restrooms(establishment_id)` |
| Add-flow existing CRs | `restrooms(establishment_id)` partial active |
| Verify uniqueness | UNIQUE `(restroom_id, user_id)` on `verifies` |
| Review uniqueness | UNIQUE `(restroom_id, user_id)` on `reviews` |
| Newest reviews first | `(restroom_id, created_at DESC)` on `reviews` |
| User's reviews tab | `reviews(user_id)` |
| User's contributions | `verifies(user_id)`, `restrooms(created_by)` |
| Admin report queue | `reports(created_at)` WHERE `status = 'open'` |
| Photo galleries | `restroom_photos(restroom_id)`, `review_photos(review_id)` filtered `removed_at IS NULL` |

### Nearby query pattern (PostGIS)

```sql
SELECT r.*, e.name, e.lat, e.lng,
       ST_Distance(e.location, ST_MakePoint($lng, $lat)::geography) AS distance_m
FROM restrooms r
JOIN establishments e ON e.id = r.establishment_id
WHERE r.status = 'active'
  AND ST_DWithin(
        e.location,
        ST_MakePoint($lng, $lat)::geography,
        $radius_m
      )
ORDER BY distance_m;
```

Filters (`has_bidet`, `access_cost`, `access_scope`, `community_verified`) applied as additional `WHERE` clauses in `RestroomDirectory.listNearby`.

---

## Sensitive fields

| Field / data | Handling |
| :---- | :---- |
| Google OAuth tokens | Stored by Supabase Auth only — **not** in app tables |
| Email (from Google) | May exist in `auth.users`; **not** exposed in UI or public API in v1 |
| `profiles.display_name` | Public attribution only (first name + last initial) |
| `profiles.avatar_url` | Public; from Google CDN URL |
| UGC comments | Public on listing detail; moderate via report + admin |
| Photos | Public once published; admin can soft-remove abusive media |
| Payment / billing | **None in v1** — product is 100% free |
| `SUPABASE_SERVICE_ROLE_KEY` | Server env only; bypasses RLS for admin seed |

No column-level encryption required for v1. Storage bucket policies restrict upload paths to authenticated users; reads are public for published photos.

---

## File / media storage

### Supabase Storage buckets

| Bucket | Path pattern | Access | Limits |
| :---- | :---- | :---- | :---- |
| `restroom-photos` | `{restroom_id}/{photo_id}.webp` | Public read; auth write on own upload | Max 3 per listing (seed) |
| `review-photos` | `{review_id}/{photo_id}.webp` | Public read; auth write on own review | Max 3 per review |

### Upload pipeline

1. Client compresses/resizes (`browser-image-compression`) before upload.
2. Convert to WebP where practical (smaller, faster).
3. Store `storage_path` in `restroom_photos` / `review_photos`.
4. Serve via Supabase public URL or signed URL (public bucket preferred for v1).

### Bucket policies (summary)

| Operation | Rule |
| :---- | :---- |
| Read | Public for objects referenced by non-removed photo rows |
| Insert | Authenticated; path must match user's upload context |
| Delete | Admin / service role only (prefer soft-delete via `removed_at`) |

---

## Database triggers & events

| Event | Trigger / handler | Effect |
| :---- | :---- | :---- |
| New `auth.users` row | `on_auth_user_created` → insert `profiles` | Bootstrap display name from Google metadata |
| Insert `verifies` | `after_insert_verify` | Increment `restrooms.verify_count` |
| Delete `verifies` | `after_delete_verify` | Decrement `restrooms.verify_count` (admin edge case) |
| Insert/update `reviews` | `after_review_change` | Recompute `restrooms.rating_avg`, `rating_count` |
| Insert `reports` | App logic in `reportRestroom` | Set `restrooms.status = 'disputed'` when first open report (or always on new open report) |
| Admin merge | `adminMerge` (app) | Archive loser (`status = 'archived'`, `merged_into_id = survivor`), reassign or drop duplicate verifiers/reviews per merge rules |

No Supabase Edge Functions in v1 — triggers are Postgres functions; business rules live in `RestroomDirectory`.

---

## Webhooks (external)

| Source | Event | Handler |
| :---- | :---- | :---- |
| Supabase Auth | (optional) `user.created` webhook | Backup profile creation if not using DB trigger |
| — | No Stripe/payment webhooks | N/A in v1 |

Google Maps / Places: called from Next.js server or client adapters; **no inbound webhooks**.

---

## API surface (`RestroomDirectory`)

v1 exposes behavior through **Next.js Server Actions** (and thin Route Handlers where needed). All operations below are implemented once in `RestroomDirectory`; UI and `/admin` are callers.

| Operation | Auth | Description |
| :---- | :---- | :---- |
| `listNearby` | guest+ | Radius (default 1 km, max 5 km), filters, pin-variant classification; excludes disputed from default |
| `getRestroom` | guest+ | Detail + aggregates + photos + reviews (newest first) |
| `listSiblings` | guest+ | Other active restrooms at same `establishment_id` |
| `searchPlaces` | user+ (add flow) | Google Places autocomplete/details → not persisted |
| `findExistingForPlace` | user+ | Restrooms for `place_id` during add flow |
| `addRestroom` | user | Create establishment if needed + restroom + seed photos; immediate `active` |
| `verifyRestroom` | user | Insert verify or duplicate-add path shortcut |
| `upsertReview` | user | Insert or update own review + optional photos |
| `reportRestroom` | user | Insert report; may set `disputed` |
| `deleteRestroom` | user (creator) | Hard delete only if no community activity |
| `updateRestroom` | user (creator) / admin | Creator edit gated; admin always |
| `adminUpsertRestroom` | admin | Seed/edit for soft launch |
| `adminSetStatus` | admin | `active` / `disputed` / `closed` / `archived` |
| `adminMerge` | admin | Merge duplicate pins into survivor |
| `adminRemovePhoto` | admin | Soft-delete `restroom_photos` or `review_photos` |
| `listMyReviews` | user | Reviews tab data |
| `listMyContributions` | user | Listings created + verified (Profile tab) |
| `listOpenReports` | admin | Report queue |

### HTTP Route Handlers (optional thin wrappers)

| Method | Route | Maps to |
| :---- | :---- | :---- |
| `GET` | `/api/restrooms/nearby` | `listNearby` (if client-side map cache needed) |
| `GET` | `/api/restrooms/[id]` | `getRestroom` |
| `POST` | `/api/restrooms` | `addRestroom` |
| `POST` | `/api/restrooms/[id]/verify` | `verifyRestroom` |
| `PUT` | `/api/restrooms/[id]/review` | `upsertReview` |
| `POST` | `/api/restrooms/[id]/report` | `reportRestroom` |

Prefer Server Actions as primary per TRD; Route Handlers only where TanStack Query or non-Next clients need them.

---

## Admin merge semantics

When admin merges duplicate A → survivor B:

1. Set A.`status = 'archived'`, A.`merged_into_id = B.id`.
2. Reassign verifiers/reviews that would violate UNIQUE on B (skip duplicates).
3. Recalculate B.`verify_count`, B.`rating_avg`, B.`rating_count`.
4. Archive or reassign A's seed photos (policy: do not copy; survivor keeps its gallery).

---

## Migration & seed notes

- Enable PostGIS extension: `CREATE EXTENSION IF NOT EXISTS postgis;`
- Soft launch: ~50–100 seeded `restrooms` in Metro Manila via admin + service role; all `verify_count = 0` (unverified overlay).
- `is_admin` granted manually to ops Google accounts in `profiles`.
- Launch geography gate (`NEXT_PUBLIC_LAUNCH_GEO`) is **application-level** (empty state), not a DB boundary in v1.

---

## References

- Product spec: [spec.md](./spec.md)
- App flow: [APPFLOW.md](./APPFLOW.md)
- Technical requirements: [TRD.md](./TRD.md)
- PRD: [PRD.md](./PRD.md)
