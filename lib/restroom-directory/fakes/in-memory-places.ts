import type { PlaceDetails, PlacesPort } from "../ports/places";
import type { LatLng, PlaceSuggestion } from "../schemas";

export class InMemoryPlaces implements PlacesPort {
  private suggestions: PlaceSuggestion[] = [];
  private detailsByPlaceId = new Map<string, PlaceDetails>();

  seedSuggestions(suggestions: PlaceSuggestion[]): void {
    this.suggestions = suggestions;
  }

  seedDetails(details: PlaceDetails): void {
    this.detailsByPlaceId.set(details.placeId, details);
  }

  async autocomplete(
    query: string,
    _near?: LatLng,
  ): Promise<PlaceSuggestion[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this.suggestions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.formattedAddress?.toLowerCase().includes(q) ?? false),
    );
  }

  async getDetails(placeId: string): Promise<PlaceDetails | null> {
    return this.detailsByPlaceId.get(placeId) ?? null;
  }
}
