# 21 — App shell: routes, mobile bottom tabs, desktop layout frame

**What to build:** End-user app shell with route structure for `/`, `/add`, `/profile`, `/reviews`, `/restrooms/[id]`, and `/login`. Mobile shows bottom tab bar (Explore · Add CR · Profile · Reviews) with placeholder content per tab. Desktop uses a map + sidebar frame with no bottom tabs.

**Blocked by:** 01 — Next.js scaffold, Tailwind, shadcn/ui, env vars

**Status:** done

- [x] All v1 routes exist and render without error
- [x] Mobile viewport shows bottom tab bar with four tabs; active tab highlighted
- [x] Desktop viewport hides bottom tabs and reserves left sidebar + map areas
- [x] Admin routes use a separate layout (not this shell)
