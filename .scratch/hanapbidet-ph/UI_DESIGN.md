# HanapBidet PH — UI Design (v1)

**Status:** agreed via grilling  
**Source:** [design/DESIGN.md](./design/DESIGN.md), [APPFLOW.md](./APPFLOW.md)

---

| Token | Value |
| :---- | :---- |
| **Aesthetic** | Modern minimal, map-first, glassmorphic overlays. Calm assurance — clean, trustworthy, approachable. Not clinical, not SaaS-dashboard, not playful/emoji. Depth via soft blur and subtle gradients over a full-bleed map. |
| **Primary Color** | `#006767` (Fresh Teal). Emphasis / gradients: `#008282`. Surface tint: `#006a6a`. |
| **Background Color** | Light: `#f7fafb` (cool off-white shell). Cards/sheets: `#ffffff`, `#f1f4f5`. Dark chrome: `#2d3132` (charcoal, not pure black). Map stays full-bleed behind UI. |
| **Text Color** | Primary (light): `#181c1d`. Secondary: `#3d4949`. Tertiary / placeholders: `#6d7979`. Dark mode primary: `#eef1f2`. Avoid pure `#000` / `#fff`. |
| **Accent / CTA Color** | Primary CTA: `#006767` → `#008282` gradient. On-CTA text: `#ffffff`. Secondary accent (chips): `#d0e7e9` (Soft Aqua) with teal text. Selected chips: teal bg + white text. Error/report: `#ba1a1a`. No purple or neon accents. |
| **Font** | **Montserrat** (600–700) for headlines, brand, location names. **Public Sans** (400–600) for body, labels, buttons, distances, ratings. No Inter/Roboto/system defaults. |
| **Border Radius** | Buttons: `8px` (`0.5rem`). Inputs: `12px` (`0.75rem`). Cards/sheets: `16px` (`1rem`; sheets rounded top only). Filter chips & pins: pill (`9999px`). Small elements: `4px`. |
| **Shadows** | Subtle ambient only — no heavy drop shadows or neon glow. Level 1 (chips): light 5% charcoal tint. Level 2 (sheets/cards): 16px blur, 10% opacity + 12px backdrop blur. Level 3 (modals): 24px blur for focus. |
| **Dark/Light Mode** | **Light mode default** (outdoor-readable). **Dark mode supported** with theme toggle (sun/moon) in top bar. Same layout; tokens swap. Teal accent persists (slightly brighter OK in dark). No neon edges or pure black void. |
| **Reference Apps** | **Google Maps** (map-first, pin interaction, desktop sidebar). **Citymapper / Waze** (urgency-friendly findability, clear CTAs, minimal chrome). Not Linear/Vercel/Raycast (wrong mental model). |
| **Mobile** | Mobile-first PWA, fully responsive. **Bottom tab nav (mobile only):** Explore · Add CR · Profile · Reviews. Map full-bleed; compact top bar (radius, filters, theme toggle). Floating controls respect safe areas. Desktop: no bottom tabs — Google Maps–style left sidebar + map. |

---

## Bottom tabs (mobile)

| Tab | Route / behavior |
| :---- | :---- |
| **Explore** | `/` — map home, nearby pins, filters, radius |
| **Add CR** | `/add` — auth-gated; anonymous → `/login` then return |
| **Profile** | Minimal: signed out → Continue with Google; signed in → name/avatar, Sign out, optional **My contributions** (listings you added/verified). No public profile URL, no bio/stats. |
| **Reviews** | **Your reviews only** — signed out → sign-in prompt; signed in → list of listings you rated (stars + snippet + link to edit on listing detail). Not a public social feed. |

Account avatar may also appear in the top bar for quick access; Profile tab is the dedicated signed-in home.

---

## Component notes (from DESIGN.md)

- **Map pins:** Bidet = Fresh Teal `#006767`; Standard = charcoal `#4f5e67`; Unverified = dashed overlay on either pin.
- **Filter chips:** Horizontal scroll on mobile; unselected Soft Aqua, selected teal + white.
- **Bottom sheets (mobile):** Pin preview, detail, rate, auth — peek 240px → half → expanded 95%; 40×4px drag handle.
- **Desktop detail:** Left sidebar list → detail panel; map remains visible on the right.
- **Primary actions:** “Open in Google Maps” uses teal gradient CTA.
- **Verified badge:** Teal checkmark for Community verified (≥3 verifies).

---

## Explicitly avoid

- Purple/indigo gradients, neon glow, emoji clutter
- Card-heavy dashboards or analytics widgets on the map home
- Bottom tabs on desktop
- Public profile pages, social feeds, follower UI
- Heavy borders instead of glass + soft shadow
- Pure white/black backgrounds that glare outdoors or feel void-like in dark mode

---

## References

- Design tokens & components: [design/DESIGN.md](./design/DESIGN.md)
- App flow & navigation: [APPFLOW.md](./APPFLOW.md)
- Stitch brief (historical; teal tokens in DESIGN.md take precedence): [stitch-design-brief.md](./stitch-design-brief.md)
