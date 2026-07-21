import { createRestroomDirectory } from "@/lib/restroom-directory";
import { createSessionAuthPort } from "@/lib/restroom-directory/adapters/session-auth";
import { createSupabasePostgres } from "@/lib/restroom-directory/adapters/supabase-postgres";
import { createSupabaseStorage } from "@/lib/restroom-directory/adapters/supabase-storage";
import { InMemoryGeolocation } from "@/lib/restroom-directory/fakes/in-memory-geolocation";
import { InMemoryPlaces } from "@/lib/restroom-directory/fakes/in-memory-places";
import type { RestroomDirectory } from "@/lib/restroom-directory/restroom-directory";

let override: RestroomDirectory | null = null;

/** Test-only seam so Explore nearby / detail loading can inject in-memory adapters. */
export function setExploreDirectoryOverride(
  directory: RestroomDirectory | null,
): void {
  override = directory;
}

/**
 * Explore directory: session AuthPort + Supabase Postgres for `listNearby` /
 * `getRestroom` / `listSiblings`. Storage builds public seed-photo URLs.
 */
export async function getExploreDirectory(): Promise<RestroomDirectory> {
  if (override) {
    return override;
  }

  return createRestroomDirectory({
    auth: createSessionAuthPort(),
    places: new InMemoryPlaces(),
    postgres: createSupabasePostgres(),
    storage: createSupabaseStorage(),
    geolocation: new InMemoryGeolocation(),
  });
}
