import type { FindActiveNearParams, PostgresPort } from "../ports/postgres";
import {
  classifyPinVariant,
  hasBidetFromType,
  isCommunityVerified,
} from "../pin-variant";
import type {
  AccessCost,
  AccessScope,
  BidetType,
  NearbyRestroom,
  RestroomStatus,
} from "../schemas";

/** Domain row seeded into the in-memory PostGIS stand-in (pre-DTO). */
export type SeedNearbyListing = {
  id: string;
  establishmentId: string;
  name: string;
  lat: number;
  lng: number;
  bidetType: BidetType;
  accessCost: AccessCost;
  accessScope: AccessScope;
  status: RestroomStatus;
  verifyCount: number;
  ratingAvg?: number | null;
  ratingCount?: number;
  floorArea?: string | null;
  restroomLabel?: string | null;
};

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

function toNearbyRestroom(
  row: SeedNearbyListing,
  distanceMeters: number,
): NearbyRestroom {
  const hasBidet = hasBidetFromType(row.bidetType);
  const communityVerified = isCommunityVerified(row.verifyCount);

  return {
    id: row.id,
    establishmentId: row.establishmentId,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    distanceMeters,
    bidetType: row.bidetType,
    hasBidet,
    accessCost: row.accessCost,
    accessScope: row.accessScope,
    verifyCount: row.verifyCount,
    communityVerified,
    ratingAvg: row.ratingAvg ?? null,
    ratingCount: row.ratingCount ?? 0,
    pinVariant: classifyPinVariant(row.bidetType, row.verifyCount),
    floorArea: row.floorArea ?? null,
    restroomLabel: row.restroomLabel ?? null,
  };
}

/**
 * In-memory PostGIS stand-in for RestroomDirectory tests.
 * Mirrors `ST_DWithin` + `status = 'active'` nearby query pattern.
 */
export class InMemoryPostgres implements PostgresPort {
  private listings: SeedNearbyListing[] = [];

  seedListings(listings: SeedNearbyListing[]): void {
    this.listings = listings;
  }

  async findActiveRestroomsNear(
    params: FindActiveNearParams,
  ): Promise<NearbyRestroom[]> {
    const { lat, lng, radiusMeters, filters } = params;

    return this.listings
      .filter((row) => row.status === "active")
      .map((row) =>
        toNearbyRestroom(
          row,
          haversineMeters({ lat, lng }, { lat: row.lat, lng: row.lng }),
        ),
      )
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
