import type { LatLng, PlaceSuggestion } from "../schemas";

export type PlaceDetails = {
  placeId: string;
  name: string;
  formattedAddress: string | null;
  lat: number;
  lng: number;
};

/** Google Places adapter port (autocomplete + details; not persisted). */
export interface PlacesPort {
  autocomplete(query: string, near?: LatLng): Promise<PlaceSuggestion[]>;
  getDetails(placeId: string): Promise<PlaceDetails | null>;
}
