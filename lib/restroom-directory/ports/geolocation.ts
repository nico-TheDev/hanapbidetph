import type { LatLng } from "../schemas";

export type GeolocationResult =
  | { status: "granted"; position: LatLng }
  | { status: "denied" }
  | { status: "unavailable" };

/** Browser geolocation adapter port. */
export interface GeolocationPort {
  getCurrentPosition(): Promise<GeolocationResult>;
}
