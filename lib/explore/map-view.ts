import type { GeolocationResult } from "@/lib/restroom-directory/ports/geolocation";
import type { LatLng } from "@/lib/restroom-directory/schemas";

/** Approximate NCR bounding box for `NEXT_PUBLIC_LAUNCH_GEO=metro-manila`. */
export const METRO_MANILA_BOUNDS = {
  north: 14.78,
  south: 14.35,
  west: 120.9,
  east: 121.15,
} as const;

export const LAUNCH_GEO_METRO_MANILA = "metro-manila";

export type MapBanner = "none" | "enable_location" | "coming_soon_outside";

export type MapCenterSource =
  | "user"
  | "metro_manila_fallback"
  | "metro_manila_browse";

export type MapViewState = {
  center: LatLng;
  distancesAvailable: boolean;
  banner: MapBanner;
  centerSource: MapCenterSource;
};

export type ResolveMapViewStateInput = {
  geolocation: GeolocationResult;
  defaultCenter: LatLng;
  launchGeo: string;
  browseMetroManila?: boolean;
};

export function isWithinLaunchGeo(position: LatLng, launchGeo: string): boolean {
  if (launchGeo !== LAUNCH_GEO_METRO_MANILA) {
    return false;
  }

  return (
    position.lat >= METRO_MANILA_BOUNDS.south &&
    position.lat <= METRO_MANILA_BOUNDS.north &&
    position.lng >= METRO_MANILA_BOUNDS.west &&
    position.lng <= METRO_MANILA_BOUNDS.east
  );
}

/**
 * Pure Explore map camera + banner decision from geolocation + launch geo.
 * Distances stay omitted until location is granted inside coverage.
 */
export function resolveMapViewState(
  input: ResolveMapViewStateInput,
): MapViewState {
  const { geolocation, defaultCenter, launchGeo, browseMetroManila = false } =
    input;

  if (browseMetroManila) {
    return {
      center: defaultCenter,
      distancesAvailable: false,
      banner: "none",
      centerSource: "metro_manila_browse",
    };
  }

  if (geolocation.status !== "granted") {
    return {
      center: defaultCenter,
      distancesAvailable: false,
      banner: "enable_location",
      centerSource: "metro_manila_fallback",
    };
  }

  const { position } = geolocation;
  if (!isWithinLaunchGeo(position, launchGeo)) {
    return {
      center: position,
      distancesAvailable: false,
      banner: "coming_soon_outside",
      centerSource: "user",
    };
  }

  return {
    center: position,
    distancesAvailable: true,
    banner: "none",
    centerSource: "user",
  };
}
