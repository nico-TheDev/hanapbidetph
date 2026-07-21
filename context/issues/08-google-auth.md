# 08 — Supabase Auth setup, `/login`, `/auth/callback`, session middleware

**What to build:** Google OAuth via Supabase Auth. `/login` page shows "Continue with Google." `/auth/callback` completes the OAuth flow. JWT stored in HTTP-only cookie. `getSession()` / `getUser()` helpers work in Server Actions. Auth cancel or failure stays on `/login` with retry option.

**Blocked by:** 01 — Next.js scaffold, Tailwind, shadcn/ui, env vars

**Status:** done

- [x] User can sign in with Google and land back in the app with a valid session
- [x] Session is available to Server Actions via cookie-based JWT
- [x] Auth cancel or Google failure shows retry on `/login`
- [x] `/auth/callback` handles OAuth return without exposing tokens to the client
