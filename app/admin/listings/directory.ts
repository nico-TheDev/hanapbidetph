import { createRestroomDirectory } from "@/lib/restroom-directory";
import { createSessionAuthPort } from "@/lib/restroom-directory/adapters/session-auth";
import { createSupabasePostgres } from "@/lib/restroom-directory/adapters/supabase-postgres";
import { InMemoryGeolocation } from "@/lib/restroom-directory/fakes/in-memory-geolocation";
import { InMemoryPlaces } from "@/lib/restroom-directory/fakes/in-memory-places";
import { InMemoryStorage } from "@/lib/restroom-directory/fakes/in-memory-storage";
import type { RestroomDirectory } from "@/lib/restroom-directory/restroom-directory";

let override: RestroomDirectory | null = null;

/** Test-only seam so server actions can inject in-memory adapters. */
export function setRestroomDirectoryOverride(
  directory: RestroomDirectory | null,
): void {
  override = directory;
}

/**
 * Production directory for admin listings: session AuthPort + Supabase
 * Postgres. Storage/Places/geolocation unused by the seed form (no photos).
 */
export async function getRestroomDirectory(): Promise<RestroomDirectory> {
  if (override) {
    return override;
  }

  return createRestroomDirectory({
    auth: createSessionAuthPort(),
    places: new InMemoryPlaces(),
    postgres: createSupabasePostgres(),
    storage: new InMemoryStorage(),
    geolocation: new InMemoryGeolocation(),
  });
}
