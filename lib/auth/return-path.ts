/**
 * Client-safe return-path helpers for OAuth / auth-gate URLs.
 * Keep free of next/headers and other server-only imports so Explore
 * client components can build `/login?next=…` links.
 */

/**
 * Same-origin relative path only. Blocks protocol-relative and absolute URLs
 * so OAuth `next` cannot be used for open redirects.
 */
export function safeReturnPath(
  candidate: string | null | undefined,
  fallback = "/",
): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }
  return candidate;
}

/** Builds `/login` with the interrupted route preserved for post-sign-in return. */
export function loginHref(returnTo: string): string {
  return `/login?next=${encodeURIComponent(safeReturnPath(returnTo))}`;
}

/**
 * OAuth `redirectTo` for Google sign-in. Passes safe `next` through to
 * `/auth/callback` so post-login return can resume the interrupted route.
 */
export function oauthCallbackHref(
  origin: string,
  next?: string | null,
): string {
  const url = new URL("/auth/callback", origin);
  const returnTo = safeReturnPath(next);
  if (returnTo !== "/") {
    url.searchParams.set("next", returnTo);
  }
  return url.toString();
}
