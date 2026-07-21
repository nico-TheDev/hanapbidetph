# 38 — Add flow: amenity form, photo upload, and publish

**What to build:** Final `/add` step: floor/area, restroom label, bidet type, basics checklist (tissue/soap/drying), access cost/scope. Optional seed photos (max 3, client compress, remove/retry on failure). Publish calls `addRestroom` → immediate Active + unverified → navigate to new listing detail.

**Blocked by:** 37 — Add flow: duplicate check step; 11 — `addRestroom` with establishment creation and seed photos

**Status:** ready-for-agent

- [ ] All amenity fields validate before publish
- [ ] Up to 3 photos upload with compress; failed upload allows remove/retry without losing form
- [ ] Publish creates listing and navigates to its detail page
- [ ] New listing appears on Explore map with unverified overlay
