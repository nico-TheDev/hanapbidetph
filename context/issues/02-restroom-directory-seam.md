# 02 — RestroomDirectory interface, adapter ports, Vitest harness

**What to build:** The `RestroomDirectory` interface with typed operation signatures, adapter port interfaces (Places, Postgres, Storage, Auth, Geolocation), in-memory fakes for each adapter, and a Vitest test harness. Zod schemas define inputs/outputs. `pnpm test` passes with a trivial smoke test proving the seam is wired.

**Blocked by:** 01 — Next.js scaffold, Tailwind, shadcn/ui, env vars

**Status:** ready-for-agent

- [ ] `RestroomDirectory` interface declares all v1 operations with typed inputs/outputs
- [ ] Adapter port interfaces exist for Places, Postgres, Storage, Auth, and Geolocation
- [ ] In-memory fakes implement each adapter port for tests
- [ ] `pnpm test` passes with at least one smoke test through the seam
