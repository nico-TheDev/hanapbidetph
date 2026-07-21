# 26 — Filter chips wired to `listNearby`

**What to build:** Horizontal-scroll filter chips on Explore: Has bidet, Free/Paid, Community verified only, Public/Needs patronage. Unselected chips use Soft Aqua; selected use teal + white. Toggling a chip refetches `listNearby` with the active filter set.

**Blocked by:** 24 — Map pins from `listNearby` (bidet / standard / unverified)

**Status:** ready-for-agent

- [ ] Four filter chips render with correct selected/unselected styling
- [ ] Chips scroll horizontally on mobile without breaking layout
- [ ] Active filters passed to `listNearby` and update pins
- [ ] Multiple filters can be active simultaneously
