import type { GeolocationPort, GeolocationResult } from "../ports/geolocation";
import type { LatLng } from "../schemas";

export class InMemoryGeolocation implements GeolocationPort {
  private result: GeolocationResult = { status: "unavailable" };

  setGranted(position: LatLng): void {
    this.result = { status: "granted", position };
  }

  setDenied(): void {
    this.result = { status: "denied" };
  }

  setUnavailable(): void {
    this.result = { status: "unavailable" };
  }

  async getCurrentPosition(): Promise<GeolocationResult> {
    return this.result;
  }
}
