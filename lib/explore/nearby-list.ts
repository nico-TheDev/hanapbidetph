import { formatListingDistance } from "@/lib/explore/radius";
import { selectMapPinId, syncSelectedPinId } from "@/lib/explore/map-pins";
import type { NearbyRestroom } from "@/lib/restroom-directory/schemas";

export type NearbyListRow = {
  id: string;
  name: string;
  distanceLabel: string | null;
  hasBidet: boolean;
  communityVerified: boolean;
  selected: boolean;
};

/**
 * Sidebar listing rows from distance-ordered `listNearby` results.
 * Distance labels only when user location is known; selection highlights the map pin.
 */
export function toNearbyListRows(
  listings: NearbyRestroom[],
  options: { distancesAvailable: boolean; selectedId?: string | null },
): NearbyListRow[] {
  const selectedId = options.selectedId ?? null;
  return listings.map((listing) => ({
    id: listing.id,
    name: listing.name,
    distanceLabel: formatListingDistance(
      listing.distanceMeters,
      options.distancesAvailable,
    ),
    hasBidet: listing.hasBidet,
    communityVerified: listing.communityVerified,
    selected: listing.id === selectedId,
  }));
}

/** Clicking a sidebar row selects that listing (same id used by map pins). */
export function selectNearbyListRow(listingId: string): string {
  return selectMapPinId(listingId);
}

/** Drop selection when the listing leaves nearby results (radius / filters). */
export function syncSelectedNearbyListId(
  selectedId: string | null,
  listings: NearbyRestroom[],
): string | null {
  return syncSelectedPinId(selectedId, listings);
}
