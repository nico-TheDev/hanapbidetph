"use server";

import { getExploreDirectory } from "@/lib/explore/directory";
import { DEFAULT_NEARBY_RADIUS_METERS } from "@/lib/explore/map-pins";
import type {
  ListNearbyInput,
  NearbyRestroom,
} from "@/lib/restroom-directory/schemas";

/**
 * Loads nearby restroom listings for Explore map pins via `listNearby`.
 * Guests allowed. Returns [] on validation / adapter failure.
 */
export async function loadNearbyRestroomsAction(
  input: ListNearbyInput,
): Promise<NearbyRestroom[]> {
  const directory = await getExploreDirectory();
  const result = await directory.listNearby({
    lat: input.lat,
    lng: input.lng,
    radiusMeters: input.radiusMeters ?? DEFAULT_NEARBY_RADIUS_METERS,
    filters: input.filters,
  });

  if (!result.ok) {
    return [];
  }

  return result.value;
}
