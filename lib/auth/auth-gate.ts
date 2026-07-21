import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getUser, type SessionAuthClient } from "./session";

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

export type AuthGateResult =
  | { status: "ok"; user: User }
  | { status: "redirect"; href: string };

/**
 * Reusable auth gate for Add CR, Profile, Reviews, and detail contribution CTAs.
 * Anonymous callers get a `/login?next=…` redirect preserving the interrupted route.
 */
export async function resolveAuthGate(
  returnTo: string,
  client?: SessionAuthClient,
): Promise<AuthGateResult> {
  const user = await getUser(client);
  if (!user) {
    return { status: "redirect", href: loginHref(returnTo) };
  }
  return { status: "ok", user };
}

/**
 * Server-route / Server Action gate: redirects anonymous users to `/login`
 * with return URL preserved, otherwise returns the authenticated user.
 */
export async function requireAuth(
  returnTo: string,
  client?: SessionAuthClient,
): Promise<User> {
  const result = await resolveAuthGate(returnTo, client);
  if (result.status === "redirect") {
    redirect(result.href);
  }
  return result.user;
}
