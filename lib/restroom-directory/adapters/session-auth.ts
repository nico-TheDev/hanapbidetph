import type { Actor, AuthPort } from "@/lib/restroom-directory/ports/auth";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/session";

/**
 * AuthPort backed by the cookie session + `profiles.is_admin`.
 */
export function createSessionAuthPort(): AuthPort {
  return {
    async getActor(): Promise<Actor> {
      const user = await getUser();
      if (!user) {
        return { role: "guest" };
      }

      const supabase = await createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data) {
        return { role: "guest" };
      }

      const row = data as {
        display_name: string;
        avatar_url: string | null;
        is_admin: boolean | null;
      };

      const displayName = row.display_name || "User";
      const avatarUrl = row.avatar_url ?? null;

      if (row.is_admin) {
        return {
          role: "admin",
          userId: user.id,
          displayName,
          avatarUrl,
          isAdmin: true,
        };
      }

      return {
        role: "user",
        userId: user.id,
        displayName,
        avatarUrl,
        isAdmin: false,
      };
    },
  };
}
