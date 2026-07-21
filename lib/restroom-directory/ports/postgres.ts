import type { NearbyRestroom } from "../schemas";

export type FindActiveNearParams = {
  lat: number;
  lng: number;
  radiusMeters: number;
  filters?: {
    hasBidet?: boolean;
    accessCost?: "free" | "paid";
    accessScope?: "public" | "needs_patronage";
    communityVerified?: boolean;
  };
};

/**
 * Postgres / PostGIS persistence adapter port.
 * Ticket 02 keeps this thin; later tickets grow query/mutation methods.
 */
export interface PostgresPort {
  findActiveRestroomsNear(
    params: FindActiveNearParams,
  ): Promise<NearbyRestroom[]>;
}
