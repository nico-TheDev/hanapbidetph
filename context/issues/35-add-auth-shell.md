# 35 — `/add` auth gate and multi-step page shell

**What to build:** `/add` route auth-gated via auth-gate utility (anonymous → `/login` → return). Multi-step shell for the add flow: Search → Duplicate check (conditional) → Details → Publish. Progress indicator or step labels so user knows where they are.

**Blocked by:** 09 — Return-to-interrupted-flow and auth-gate utility; 21 — App shell: routes, mobile bottom tabs, desktop layout frame

**Status:** ready-for-agent

- [ ] Anonymous user on Add CR tab is redirected to login and returns to `/add`
- [ ] Add page shows clear step progression (search → details → publish)
- [ ] Shell renders on mobile (within bottom-tab layout) and desktop
