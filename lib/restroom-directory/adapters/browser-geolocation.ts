import type { GeolocationPort, GeolocationResult } from "../ports/geolocation";

type GeolocationLike = Pick<Geolocation, "getCurrentPosition"> | null;

type BrowserGeolocationOptions = {
  /** Injected for tests; defaults to `navigator.geolocation` when present. */
  geolocation?: GeolocationLike;
};

/**
 * Browser GeolocationPort adapter. Maps Permission Denied → denied;
 * missing API / unavailable / timeout → unavailable.
 */
export class BrowserGeolocation implements GeolocationPort {
  private readonly geolocation: GeolocationLike;

  constructor(options: BrowserGeolocationOptions = {}) {
    if ("geolocation" in options) {
      this.geolocation = options.geolocation ?? null;
      return;
    }

    this.geolocation =
      typeof navigator !== "undefined" && navigator.geolocation
        ? navigator.geolocation
        : null;
  }

  async getCurrentPosition(): Promise<GeolocationResult> {
    const api = this.geolocation;
    if (!api) {
      return { status: "unavailable" };
    }

    return new Promise((resolve) => {
      api.getCurrentPosition(
        (position) => {
          resolve({
            status: "granted",
            position: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve({ status: "denied" });
            return;
          }
          resolve({ status: "unavailable" });
        },
        {
          enableHighAccuracy: false,
          maximumAge: 60_000,
          timeout: 10_000,
        },
      );
    });
  }
}
