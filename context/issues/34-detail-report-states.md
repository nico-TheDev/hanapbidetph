# 34 — Report flow and disputed/unavailable states on detail

**What to build:** Report button on listing detail opens reason picker (doesn't exist / wrong location / permanently closed / inappropriate photos) with optional details. Submits via `reportRestroom`. Disputed listings show warning banner on direct link. Archived/missing listing shows "This restroom isn't available" with CTA to `/`.

**Blocked by:** 30 — Detail content, siblings, and Maps handoff CTA; 14 — `reportRestroom` + disputed status transition; 09 — Return-to-interrupted-flow and auth-gate utility

**Status:** ready-for-agent

- [ ] Report flow is auth-gated and captures reason + optional details
- [ ] Successful report shows confirmation; listing may become disputed
- [ ] Disputed listing accessed via direct link shows warning banner
- [ ] Archived/missing listing shows unavailable message with home CTA
