import type {
  NearbyRestroom,
  PinVariant,
} from "@/lib/restroom-directory/schemas";

export { DEFAULT_NEARBY_RADIUS_METERS } from "@/lib/explore/radius";

/** Fresh Teal — bidet pin fill (UI_DESIGN / DESIGN.md). */
export const PIN_BIDET_FILL = "#006767";

/** Charcoal — standard (non-bidet) pin fill. */
export const PIN_STANDARD_FILL = "#4f5e67";

/** Soft Aqua — unverified dashed overlay stroke. */
export const PIN_UNVERIFIED_STROKE = "#d0e7e9";

/** Cloud map style id required by Advanced Markers (Google demo id). */
export const EXPLORE_MAP_ID = "DEMO_MAP_ID";

export type PinAppearance = {
  fill: string;
  unverified: boolean;
  hasBidet: boolean;
};

/** Visual tokens from `listNearby` `pinVariant` classification. */
export function pinAppearanceFromVariant(variant: PinVariant): PinAppearance {
  switch (variant) {
    case "bidet":
      return { fill: PIN_BIDET_FILL, unverified: false, hasBidet: true };
    case "bidet_unverified":
      return { fill: PIN_BIDET_FILL, unverified: true, hasBidet: true };
    case "standard":
      return { fill: PIN_STANDARD_FILL, unverified: false, hasBidet: false };
    case "standard_unverified":
      return { fill: PIN_STANDARD_FILL, unverified: true, hasBidet: false };
  }
}

export type MapPinModel = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  pinVariant: PinVariant;
  appearance: PinAppearance;
  selected: boolean;
};

/**
 * Maps `listNearby` rows to pin models at establishment coordinates.
 * Selection is driven by `selectedId` (opens detail shell on Explore).
 */
export function toMapPinModels(
  listings: NearbyRestroom[],
  selectedId: string | null,
): MapPinModel[] {
  return listings.map((listing) => ({
    id: listing.id,
    name: listing.name,
    lat: listing.lat,
    lng: listing.lng,
    pinVariant: listing.pinVariant,
    appearance: pinAppearanceFromVariant(listing.pinVariant),
    selected: listing.id === selectedId,
  }));
}

/** Keep selection only while the listing remains in nearby results. */
export function syncSelectedPinId(
  selectedId: string | null,
  listings: NearbyRestroom[],
): string | null {
  if (!selectedId) {
    return null;
  }
  return listings.some((listing) => listing.id === selectedId)
    ? selectedId
    : null;
}

/** Tap selects the listing and opens the detail shell. */
export function selectMapPinId(listingId: string): string {
  return listingId;
}

/**
 * Outside launch geo (coming-soon) should not show national pins.
 * Metro Manila fallback / browse / in-coverage all load nearby.
 */
export function shouldLoadNearbyPins(banner: string): boolean {
  return banner !== "coming_soon_outside";
}
