import type { FindActiveNearParams, PostgresPort } from "../ports/postgres";
import type { NearbyRestroom } from "../schemas";

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** In-memory PostGIS stand-in for RestroomDirectory tests. */
export class InMemoryPostgres implements PostgresPort {
  private nearby: NearbyRestroom[] = [];

  seedNearby(restrooms: NearbyRestroom[]): void {
    this.nearby = restrooms;
  }

  async findActiveRestroomsNear(
    params: FindActiveNearParams,
  ): Promise<NearbyRestroom[]> {
    const { lat, lng, radiusMeters, filters } = params;

    return this.nearby
      .map((r) => ({
        ...r,
        distanceMeters: haversineMeters(
          { lat, lng },
          { lat: r.lat, lng: r.lng },
        ),
      }))
      .filter((r) => r.distanceMeters <= radiusMeters)
      .filter((r) => {
        if (!filters) return true;
        if (
          filters.hasBidet !== undefined &&
          r.hasBidet !== filters.hasBidet
        ) {
          return false;
        }
        if (
          filters.accessCost !== undefined &&
          r.accessCost !== filters.accessCost
        ) {
          return false;
        }
        if (
          filters.accessScope !== undefined &&
          r.accessScope !== filters.accessScope
        ) {
          return false;
        }
        if (
          filters.communityVerified !== undefined &&
          r.communityVerified !== filters.communityVerified
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}
