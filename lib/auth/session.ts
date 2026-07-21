import type { Session, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/** Minimal Supabase auth surface used by Server Action session helpers. */
export type SessionAuthClient = {
  auth: {
    getSession: () => Promise<{
      data: { session: Session | null };
      error: { message: string } | null;
    }>;
    getUser: () => Promise<{
      data: { user: User | null };
      error: { message: string } | null;
    }>;
  };
};

/**
 * Reads the cookie-backed JWT session (HTTP-only). Prefer `getUser` when
 * authorizing mutations — `getSession` does not revalidate against Auth.
 */
export async function getSession(
  client?: SessionAuthClient,
): Promise<Session | null> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }
  return data.session;
}

/** Validates the session with Supabase Auth and returns the current user. */
export async function getUser(
  client?: SessionAuthClient,
): Promise<User | null> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data.user;
}
