# 19 — Admin listings seed/edit page

**What to build:** Admin Listings page under `/admin` with a table of existing restrooms and a form to seed or edit listings (establishment, floor/label, amenities, status). Calls `adminUpsertRestroom`. Functional shadcn table + form — no analytics or bulk tools.

**Blocked by:** 18 — `/admin` layout, role gate, and left nav; 16 — `adminUpsertRestroom` + `adminSetStatus` + `adminRemovePhoto`

**Status:** ready-for-agent

- [ ] Admin sees a list of restrooms with key fields (name, status, verify count)
- [ ] Admin can create a new seeded listing via the form
- [ ] Admin can edit an existing listing's fields and save
- [ ] Changes persist via `adminUpsertRestroom`
