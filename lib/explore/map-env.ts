import type { LatLng } from "@/lib/restroom-directory/schemas";

import { LAUNCH_GEO_METRO_MANILA } from "./map-view";

/** Documented Metro Manila fallback when env center is unset (Manila city proper). */
export const FALLBACK_METRO_MANILA_CENTER: LatLng = {
  lat: 14.5995,
  lng: 120.9842,
};

export type MapEnvConfig = {
  googleMapsApiKey: string;
  defaultCenter: LatLng;
  launchGeo: string;
};

function parseCoord(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

/** Reads TRD public Maps / launch-geo env vars (no invented names). */
export function readMapEnvConfig(
  env: NodeJS.ProcessEnv = process.env,
): MapEnvConfig {
  return {
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "",
    defaultCenter: {
      lat: parseCoord(
        env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT,
        FALLBACK_METRO_MANILA_CENTER.lat,
      ),
      lng: parseCoord(
        env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG,
        FALLBACK_METRO_MANILA_CENTER.lng,
      ),
    },
    launchGeo:
      env.NEXT_PUBLIC_LAUNCH_GEO?.trim() || LAUNCH_GEO_METRO_MANILA,
  };
}
