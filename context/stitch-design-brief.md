# HanapBidet PH — Design brief for Google Stitch

Paste this into Stitch. Design a **responsive PWA**: **mobile-first** and a full **desktop (web) view**, in **both light mode and dark mode**. Same product, same visual language — not two different apps. Ignore backend and APIs; admin can stay simple.

---

## Brand

- **Name:** HanapBidet PH  
- **Tagline:** Locate the nearest bidet in your area  
- **Job:** Help someone in Metro Manila find a nearby comfort room (CR), especially one with a bidet, fast.  
- **Tone:** Calm, practical, trustworthy, a bit warm — not jokey about toilets, not clinical hospital UI, not “startup purple.”  
- **Audience:** Locals who frequently need a public CR; travelers who don’t know the area.

---

## Visual direction (important)

- **Devices (design both):**
  - **Mobile:** phone portrait (~390×844)
  - **Desktop:** laptop/desktop (~1440×900 or 1280×800) — required deliverable, not an afterthought
- **Primary surface (both):** Full-bleed **map** is the home experience — edge to edge. The map is the stage, not a widget inside a dashboard.
- **Composition:** One clear job per screen. Map home is **not** an analytics dashboard, stat grid, or multi-panel admin console.
- **Brand:** Wordmark / app name visible but never overpowering the map. On splash / empty states, brand is hero-level.
- **Typography:** Distinctive, modern; avoid Inter / Roboto / Arial / system-default look.
- **Color system — blue is the main brand color:**
  - **Primary:** a clear, trustworthy **blue** (think clean water / reliability — e.g. mid-to-deep blue for CTAs, key chips, bidet pin accent, focus rings). Not purple, not indigo-lavender.
  - **Supporting:** charcoal/slate neutrals, soft blue-tinted surfaces, white/off-white in light mode.
  - Use blue for: primary buttons, selected filters, bidet pin, key links, verified accents.
  - Keep neutrals for map chrome so the map stays readable; blue should brand the UI, not flood every pixel.
  - **Avoid:** purple-on-white, purple-to-indigo gradients, cream+terracotta “AI default,” neon glow, emoji clutter.
- **Themes — design BOTH light and dark mode (required):**
  - **Light mode:** bright map-friendly chrome; blue primary on light surfaces; strong contrast for chips/text.
  - **Dark mode:** deep charcoal/navy UI chrome (not pure black void); blue primary remains the accent (slightly brighter blue OK for contrast); sheets/panels elevated but calm — **no neon edges, no glow spam**.
  - Same layout and components in both themes; only tokens/colors change.
  - Map tiles may stay standard light or use a subtle dark map style in dark mode if it stays readable — do not make pins hard to see.
  - Include a simple **theme toggle** (sun/moon or Light/Dark) in the top bar on mobile and desktop mockups so both modes are intentional product UI.
- **Background:** Map provides atmosphere on home. Detail surfaces can use soft blue-tinted gradients or subtle texture — not flat pure white / pure black only.
- **Cards:** Avoid card-heavy layouts. Use sheets/panels only where interaction needs a container.
- **Motion:** gentle pin appear, sheet/panel open, filter chip press — no noisy animations.
- **No ads, no promo badges floating on the map.**

### Desktop layout rules

- Keep the **map full-bleed** behind chrome (top bar + controls).
- On pin select / “View details,” open a **right-hand detail panel** (~380–420px) over the map — not a separate page that kills the map context. Mobile keeps using a **bottom sheet** for the same content.
- Filters, radius, and brand live in a **compact top bar** or floating control cluster — do not turn the left side into a dense sidebar of widgets.
- **Add CR / Rate / Auth** on desktop: centered modal or side panel, same fields as mobile.
- Wider screens should feel calm and spacious — more map, not more clutter.
- Do **not** design a desktop “mission control” with charts, tables of every CR, or multi-column dashboards for the consumer app.

---

## Map pins (exactly 3 variants)

1. **Bidet pin** — primary **blue**-branded icon (clearly different)  
2. **Standard pin** — neutral (charcoal/slate); no bidet  
3. **Unverified overlay** — dashed border or small badge on either pin (readable in both light and dark)

Do not invent more pin types (no separate paid/free icons on the map).

---

## Screen 1 — Map home (core)

**Goal:** See nearby CRs immediately.

**Shared layout:**
- Full-bleed Google-Maps-style map centered on user  
- Top bar: **HanapBidet PH** + optional location status  
- **Radius control:** default **1 km**, max **5 km**  
- **Filter chips** (multi-select): Has bidet · Free / Paid · Verified only · Public / Needs patronage  
- **+ Add CR** control  
- User location dot  

**Mobile:**
- Filter chips horizontal scroll  
- FAB for Add CR  
- Tap pin → **bottom sheet** preview → “View details”

**Desktop:**
- Filters + radius in top bar (wrap or compact chip row; no left nav jungle)  
- Add CR as top-bar button or floating control (not only a tiny FAB)  
- Tap pin → **right detail preview panel** (compact) → expand to full listing panel / “View details”  
- Optional: thin floating pin legend (bidet / standard / unverified) — small, not a widget stack  

**States (both breakpoints):**
- Location on  
- Location denied → Metro Manila center + banner “Enable location for distance”  
- Empty area → empty state + CTA to add / coming soon outside Manila

---

## Screen 2 — Listing detail

**Goal:** Decide “is this the right CR?” then leave for directions.

**Content hierarchy (same on mobile + desktop):**
1. Photo gallery (seed photos, or latest review photos)  
2. Restroom title + establishment (“Part of SM Megamall”)  
3. Distance + **Community verified** / Unverified  
4. Amenity chips: bidet type, tissue/soap, free/paid, public/patronage  
5. Floor / area label (e.g. “GF · Food Court · Female”)  
6. Primary CTA: **Open in Google Maps**  
7. Secondary: **Verify this CR exists** · **Rate** · **Report**  
8. Sibling restrooms at same establishment  
9. **Recent feedback** (newest first): stars, category checkboxes, comment, photos, “Maria S.”

**Mobile:** full-screen or tall scroll sheet.  
**Desktop:** scrollable **right panel** over the still-visible map; map stays for context. Do not force a separate full-page detail that abandons the map unless necessary for very long content.

Keep it scannable under urgency — not a long blog page.

---

## Screen 3 — Add CR flow

**Step A — Search establishment**  
- Google Places-style search (“Dunkin Donuts Megamall”)  
- Results list with address  

**Step B — Existing CR check**  
- If listings exist for that place: “Is this the same CR?” cards  
- Actions: **Yes, verify this** · **No, add a different restroom**

**Step C — Restroom form**  
- Floor / area  
- Restroom label (Male / Female / All-gender / Customer, etc.)  
- Amenity checklist (bidet type, basics, access)  
- Optional photos (max 3), with upload slots  
- Submit → success: pin appears with unverified overlay  

Anonymous user tapping Add → lightweight **Continue with Google** (browse stays free).

**Mobile:** full-screen steps or stacked sheets.  
**Desktop:** centered modal (~560–640px) or right panel wizard; same steps A→B→C. Wider form layout OK (two-column amenities) but keep one clear path.

---

## Screen 4 — Rate & review

- 1–5 stars  
- Checkbox groups: **Cleanliness**, **Amenities**, **Access**  
- Optional comment  
- Optional photo attach  
- Attribution preview “Posting as Maria S.”  
- No profile page, no follow button  

**Mobile:** bottom sheet. **Desktop:** modal or panel over map.

---

## Screen 5 — Auth (minimal)

- Only when contributing  
- Single button: **Continue with Google**  
- Short copy: browsing is free; sign in to add, verify, and rate  

**Mobile:** sheet. **Desktop:** compact centered modal.

---

## Screen 6 — Admin (optional, simple)

- Sparse internal tool, not consumer-branded marketing  
- List of reports / disputed listings  
- Actions: edit, set Closed/Archived, merge duplicate  
- Seed new listing form (same fields as Add CR)  
- **Desktop-first is fine for admin** (table + detail); still keep it sparse — not a BI dashboard.

---

## Copy snippets (English)

- Tagline: Locate the nearest bidet in your area  
- Verify CTA: Yes, this CR is here  
- Unverified: Not community verified yet  
- Verified: Community verified  
- Handoff: Open in Google Maps  
- Duplicate: Is this the same comfort room?  
- Location off: Enable location to see distance  

---

## Explicitly do not design

- Social feed, profiles, followers, chat, leaderboards  
- In-app turn-by-turn navigation  
- Consumer **analytics / BI dashboards**, KPI tiles, or multi-widget “mission control” (desktop or mobile)  
- Dark neon “crypto” look, purple AI gradients, newspaper layouts  
- Dark mode that relies on glow, glassmorphism overload, or unreadable low-contrast blue-on-blue  
- Cluttered first viewport with stats, promos, or schedule widgets  
- Desktop layout where the map is a small inset or boxed “card” in a page chrome  

---

## Deliverables to ask Stitch for

Provide frames for **mobile + desktop**, each in **light mode and dark mode** (same design system; blue primary).

Minimum matrix for core screens:
| Screen | Mobile light | Mobile dark | Desktop light | Desktop dark |
|--------|--------------|-------------|---------------|--------------|
| Map home + pin legend | ✓ | ✓ | ✓ | ✓ |
| Pin preview (sheet / right panel) | ✓ | ✓ | ✓ | ✓ |
| Listing detail | ✓ | ✓ | ✓ | ✓ |
| Add CR (search + duplicate + form) | ✓ | ✓ | ✓ | ✓ |
| Rate | ✓ | ✓ | ✓ | ✓ |
| Google sign-in | ✓ | ✓ | ✓ | ✓ |

Also:
7. Optional: empty / location-denied — light + dark, mobile + desktop  
8. Optional: simple admin list — desktop light + dark OK  

Also deliver a **shared UI kit**:
- Color tokens for **light and dark** (primary blue scale, neutrals, success/warning for verified/disputed)
- Type, pins, chips, buttons, sheets/panels
- Theme toggle component
- Reusable across breakpoints
