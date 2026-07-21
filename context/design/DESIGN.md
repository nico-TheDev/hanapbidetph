---
name: HanapBidet PH
colors:
  surface: '#f7fafb'
  surface-dim: '#d7dadb'
  surface-bright: '#f7fafb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f5'
  surface-container: '#ebeeef'
  surface-container-high: '#e5e9ea'
  surface-container-highest: '#e0e3e4'
  on-surface: '#181c1d'
  on-surface-variant: '#3d4949'
  inverse-surface: '#2d3132'
  inverse-on-surface: '#eef1f2'
  outline: '#6d7979'
  outline-variant: '#bcc9c8'
  surface-tint: '#006a6a'
  primary: '#006767'
  on-primary: '#ffffff'
  primary-container: '#008282'
  on-primary-container: '#f3fffe'
  inverse-primary: '#6fd7d6'
  secondary: '#4d6264'
  on-secondary: '#ffffff'
  secondary-container: '#d0e7e9'
  on-secondary-container: '#53686a'
  tertiary: '#4f5e67'
  on-tertiary: '#ffffff'
  tertiary-container: '#677780'
  on-tertiary-container: '#fbfdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#8cf3f3'
  primary-fixed-dim: '#6fd7d6'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f4f'
  secondary-fixed: '#d0e7e9'
  secondary-fixed-dim: '#b4cbcd'
  on-secondary-fixed: '#091f20'
  on-secondary-fixed-variant: '#364a4c'
  tertiary-fixed: '#d5e5ef'
  tertiary-fixed-dim: '#b9c9d3'
  on-tertiary-fixed: '#0e1d25'
  on-tertiary-fixed-variant: '#3a4951'
  background: '#f7fafb'
  on-background: '#181c1d'
  surface-variant: '#e0e3e4'
typography:
  headline-lg:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Montserrat
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Public Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Public Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 20px
  gutter: 16px
  bottom-sheet-peak: 240px
  chip-gap: 8px
---

## Brand & Style
The brand personality is rooted in utility and relief, positioned as a reliable urban companion for Metro Manila commuters and travelers. The design system follows a **Modern / Minimalist** style with **Glassmorphism** influences to maintain transparency over map-centric views.

The emotional response should be one of "calm assurance." By using a palette that evokes cleanliness and water without feeling clinical, the UI feels approachable and high-quality. Surfaces utilize soft blurs and subtle gradients to create a sense of depth and cleanliness, avoiding the sterile "default" look of many utility apps.

## Colors
The palette is centered on a "Fresh Water" concept.
- **Primary (Fresh Teal):** Used for actionable items, active states, and the "Bidet" map pin. It represents the core utility.
- **Secondary (Soft Aqua):** Used for subtle backgrounds, secondary buttons, and active filter chips. It provides a cooling, calm effect.
- **Tertiary (Charcoal):** Used for high-contrast typography and standard restroom icons. It provides a grounded, professional weight to the UI.
- **Neutral (Off-White/Cool Grey):** Used for surfaces and backgrounds to avoid pure white glare, especially when used outdoors.

Avoid any use of high-saturation purples or neon accents. Gradients should be subtle, moving from Soft Aqua to a slightly darker tinted mist.

## Typography
The system uses a pairing of **Montserrat** for headlines to provide a bold, geometric, and modern character, and **Public Sans** for body and labels to ensure maximum legibility and an institutional sense of trust.

- Use **Montserrat** for all brand-facing elements, titles in bottom sheets, and location names.
- Use **Public Sans** for descriptions, distance indicators (e.g., "200m away"), and metadata.
- Numerical data (ratings, distances) should use a medium weight of Public Sans for clarity.

## Layout & Spacing
This is a **Mobile-First PWA** designed for one-handed use. The layout is map-centric, with UI elements floating as layers over the base map.

- **Grid:** Use a 4-column fluid grid for mobile with 20px outside margins.
- **Safe Areas:** Ensure interactive elements are clear of the bottom "Home" bar on iOS/Android.
- **Bottom Sheets:** The primary method for data entry and location details. Sheets should have three states: Peeking (240px), Half-height (50%), and Expanded (95%).
- **Map Overlays:** Search bars and filter chips should float with a 16px margin from the top and sides, utilizing a backdrop-filter (blur) to maintain legibility.

## Elevation & Depth
Depth is conveyed through **Glassmorphism** and **Soft Ambient Shadows** rather than harsh borders.

- **Level 1 (Floating Elements):** Filter chips and minor buttons use a subtle 4px blur shadow with a 5% Charcoal tint.
- **Level 2 (Bottom Sheets/Cards):** Use a 16px blur shadow with 10% opacity. The surface itself should have a 12px backdrop blur and 90% opacity of the Neutral color.
- **Level 3 (Modal/Critical):** High-contrast shadows (24px blur) to focus user attention on reporting or verification flows.
- **Textures:** Detail screens use a very fine, low-opacity grain texture to provide a tactile, premium feel to the "Soft Aqua" backgrounds.

## Shapes
The shape language is "Rounded" to evoke friendliness and safety.

- **Cards & Bottom Sheets:** 1rem (16px) corner radius. Bottom sheets only have rounding on top corners.
- **Buttons & Chips:** Use 0.5rem (8px) for standard buttons, but use a pill-shape (full rounding) for Filter Chips and Map Pins.
- **Input Fields:** 0.75rem (12px) to match the soft aesthetic of the containers.

## Components
- **Map Pins:** Custom iconography. "Bidet" pins are Fresh Teal with a white bidet glyph; "Standard" pins are Charcoal; "Unverified" pins use a dashed outline and Soft Aqua core.
- **Bottom Sheets:** Include a 40x4px drag handle at the top. Use a vertical layout for location details (Name, Rating, Distance, Facilities).
- **Filter Chips:** Horizontal scrolling container. Unselected: Soft Aqua background with Teal text. Selected: Teal background with White text.
- **Action Buttons:** Primary "Go" or "Navigate" buttons use a gradient from Fresh Teal to a slightly darker shade.
- **Status Indicators:** Use a "Verified" badge with a small teal checkmark for crowdsourced locations that have been confirmed by multiple users.
- **Minimalist Cards:** Used within the bottom sheet for "Nearby" suggestions, featuring a small thumbnail of the establishment and key icons for amenities (e.g., PWD access, Paper available).