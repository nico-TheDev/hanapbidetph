# 37 — Add flow: duplicate check step

**What to build:** After place selection, show existing restrooms at that establishment via `findExistingForPlace`. If any exist, prompt "Is this the same CR?" — Yes records verify and navigates to that listing; No continues to add form as sibling. If none exist, skip directly to add form.

**Blocked by:** 36 — Add flow: Places search step; 12 — `verifyRestroom` + community-verified threshold

**Status:** ready-for-agent

- [ ] Existing restrooms at place are listed with floor/label and amenities
- [ ] "Yes, same CR" calls verify and navigates to existing listing detail
- [ ] "No, different CR" advances to add form for sibling restroom
- [ ] No existing restrooms skips prompt and goes straight to add form
