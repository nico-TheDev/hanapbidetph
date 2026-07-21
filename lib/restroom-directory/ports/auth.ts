export type Actor =
  | { role: "guest" }
  | {
      role: "user";
      userId: string;
      displayName: string;
      avatarUrl: string | null;
      isAdmin: false;
    }
  | {
      role: "admin";
      userId: string;
      displayName: string;
      avatarUrl: string | null;
      isAdmin: true;
    };

/** Supabase Auth adapter port (Google OAuth session → actor). */
export interface AuthPort {
  getActor(): Promise<Actor>;
}
