import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { getUser, type SessionAuthClient } from "./session";

/** Looks up `profiles.is_admin` for the signed-in user. */
export type LookupIsAdmin = (userId: string) => Promise<boolean>;

export type AdminGateOptions = {
  auth?: SessionAuthClient;
  lookupIsAdmin?: LookupIsAdmin;
};

export type AdminGateResult =
  | { status: "ok"; user: User }
  | { status: "redirect"; href: "/" };

async function lookupIsAdminFromSupabase(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return Boolean(
    (data as { is_admin?: boolean | null }).is_admin,
  );
}

/**
 * Admin role gate for `/admin`. Checks `profiles.is_admin`.
 * Anonymous and non-admin signed-in users redirect home (not login).
 */
export async function resolveAdminGate(
  options?: AdminGateOptions,
): Promise<AdminGateResult> {
  const user = await getUser(options?.auth);
  if (!user) {
    return { status: "redirect", href: "/" };
  }

  const lookup = options?.lookupIsAdmin ?? lookupIsAdminFromSupabase;
  const isAdmin = await lookup(user.id);
  if (!isAdmin) {
    return { status: "redirect", href: "/" };
  }

  return { status: "ok", user };
}

/**
 * Server layout / page gate: redirects non-admins to `/`, otherwise
 * returns the authenticated admin user.
 */
export async function requireAdmin(
  options?: AdminGateOptions,
): Promise<User> {
  const result = await resolveAdminGate(options);
  if (result.status === "redirect") {
    redirect(result.href);
  }
  return result.user;
}
