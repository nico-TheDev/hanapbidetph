import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { loginHref } from "./return-path";
import { getUser, type SessionAuthClient } from "./session";

export type AuthGateResult =
  | { status: "ok"; user: User }
  | { status: "redirect"; href: string };

/**
 * Reusable auth gate for Add CR, Profile, Reviews, and detail contribution CTAs.
 * Anonymous callers get a `/login?next=…` redirect preserving the interrupted route.
 *
 * Server-only — do not import this module from Client Components. Use
 * `@/lib/auth/return-path` for `loginHref` / `safeReturnPath` in the browser.
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
