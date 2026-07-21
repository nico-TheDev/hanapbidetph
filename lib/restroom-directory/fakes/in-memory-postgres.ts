import type {
  CreateEstablishmentInput,
  CreateRestroomInput,
  CreateRestroomPhotoInput,
  FindActiveNearParams,
  InsertVerifyInput,
  InsertVerifyOutcome,
  PostgresPort,
  RestroomDetailRow,
  ReviewRow,
  StoredPhotoRow,
} from "../ports/postgres";
import {
  classifyPinVariant,
  hasBidetFromType,
  isCommunityVerified,
} from "../pin-variant";
import type {
  AccessCost,
  AccessScope,
  BidetType,
  Establishment,
  NearbyRestroom,
  RestroomStatus,
  SiblingRestroom,
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

export type SeedProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export type SeedEstablishment = {
  id: string;
  placeId: string;
  name: string;
  formattedAddress: string | null;
  lat: number;
  lng: number;
};

export type SeedRestroom = {
  id: string;
  establishmentId: string;
  createdBy: string | null;
  floorArea: string | null;
  restroomLabel: string | null;
  bidetType: BidetType;
  hasTissue: boolean;
  hasSoap: boolean;
  hasHandDrying: boolean;
  accessCost: AccessCost;
  accessScope: AccessScope;
  status: RestroomStatus;
  verifyCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SeedRestroomPhoto = {
  id: string;
  restroomId: string;
  uploadedBy?: string;
  storagePath: string;
  sortOrder: number;
  removedAt: string | null;
};

export type SeedReview = {
  id: string;
  restroomId: string;
  userId: string;
  stars: number;
  comment: string | null;
  cleanlinessOk: boolean | null;
  amenitiesOk: boolean | null;
  accessOk: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type SeedReviewPhoto = {
  id: string;
  reviewId: string;
  storagePath: string;
  sortOrder: number;
  removedAt: string | null;
};

export type SeedVerify = {
  id: string;
  restroomId: string;
  userId: string;
  createdAt: string;
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

function toSibling(row: SeedRestroom): SiblingRestroom {
  return {
    id: row.id,
    floorArea: row.floorArea,
    restroomLabel: row.restroomLabel,
    bidetType: row.bidetType,
    hasBidet: hasBidetFromType(row.bidetType),
    verifyCount: row.verifyCount,
    communityVerified: isCommunityVerified(row.verifyCount),
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
  };
}

function publishedPhotos(
  photos: SeedRestroomPhoto[],
  restroomId: string,
): StoredPhotoRow[] {
  return photos
    .filter((p) => p.restroomId === restroomId && p.removedAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => ({
      id: p.id,
      storagePath: p.storagePath,
      sortOrder: p.sortOrder,
    }));
}

/**
 * In-memory PostGIS stand-in for RestroomDirectory tests.
 * Mirrors `ST_DWithin` + `status = 'active'` nearby query pattern,
 * plus detail/sibling reads for getRestroom / listSiblings.
 */
export class InMemoryPostgres implements PostgresPort {
  private listings: SeedNearbyListing[] = [];
  private profiles: SeedProfile[] = [];
  private establishments: SeedEstablishment[] = [];
  private restrooms: SeedRestroom[] = [];
  private restroomPhotos: SeedRestroomPhoto[] = [];
  private reviews: SeedReview[] = [];
  private reviewPhotos: SeedReviewPhoto[] = [];
  private verifies: SeedVerify[] = [];

  seedListings(listings: SeedNearbyListing[]): void {
    this.listings = listings;
  }

  seedProfiles(profiles: SeedProfile[]): void {
    this.profiles = profiles;
  }

  seedEstablishments(establishments: SeedEstablishment[]): void {
    this.establishments = establishments;
  }

  seedRestrooms(restrooms: SeedRestroom[]): void {
    this.restrooms = restrooms;
  }

  seedRestroomPhotos(photos: SeedRestroomPhoto[]): void {
    this.restroomPhotos = photos;
  }

  seedReviews(reviews: SeedReview[]): void {
    this.reviews = reviews;
  }

  seedReviewPhotos(photos: SeedReviewPhoto[]): void {
    this.reviewPhotos = photos;
  }

  seedVerifies(verifies: SeedVerify[]): void {
    this.verifies = verifies;
  }

  /** Test helper: how many restroom rows exist (detect accidental creates). */
  restroomCount(): number {
    return this.restrooms.length;
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

  async findRestroomDetail(id: string): Promise<RestroomDetailRow | null> {
    const restroom = this.restrooms.find((r) => r.id === id);
    if (!restroom) return null;

    const establishment = this.establishments.find(
      (e) => e.id === restroom.establishmentId,
    );
    if (!establishment) return null;

    const reviews: ReviewRow[] = this.reviews
      .filter((rev) => rev.restroomId === id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .map((rev) => {
        const profile = this.profiles.find((p) => p.id === rev.userId);
        const photos = this.reviewPhotos
          .filter((p) => p.reviewId === rev.id && p.removedAt === null)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((p) => ({
            id: p.id,
            storagePath: p.storagePath,
            sortOrder: p.sortOrder,
          }));

        return {
          id: rev.id,
          restroomId: rev.restroomId,
          stars: rev.stars,
          comment: rev.comment,
          cleanlinessOk: rev.cleanlinessOk,
          amenitiesOk: rev.amenitiesOk,
          accessOk: rev.accessOk,
          createdAt: rev.createdAt,
          updatedAt: rev.updatedAt,
          author: {
            userId: rev.userId,
            displayName: profile?.displayName ?? "Unknown",
            avatarUrl: profile?.avatarUrl ?? null,
          },
          photos,
        };
      });

    return {
      id: restroom.id,
      establishment: {
        id: establishment.id,
        placeId: establishment.placeId,
        name: establishment.name,
        formattedAddress: establishment.formattedAddress,
        lat: establishment.lat,
        lng: establishment.lng,
      },
      floorArea: restroom.floorArea,
      restroomLabel: restroom.restroomLabel,
      bidetType: restroom.bidetType,
      hasTissue: restroom.hasTissue,
      hasSoap: restroom.hasSoap,
      hasHandDrying: restroom.hasHandDrying,
      accessCost: restroom.accessCost,
      accessScope: restroom.accessScope,
      status: restroom.status,
      verifyCount: restroom.verifyCount,
      ratingAvg: restroom.ratingAvg,
      ratingCount: restroom.ratingCount,
      createdBy: restroom.createdBy,
      photos: publishedPhotos(this.restroomPhotos, id),
      reviews,
      createdAt: restroom.createdAt,
      updatedAt: restroom.updatedAt,
    };
  }

  async findActiveSiblings(
    restroomId: string,
  ): Promise<SiblingRestroom[] | null> {
    const restroom = this.restrooms.find((r) => r.id === restroomId);
    if (!restroom || restroom.status === "archived") return null;

    return this.restrooms
      .filter(
        (r) =>
          r.establishmentId === restroom.establishmentId &&
          r.id !== restroomId &&
          r.status === "active",
      )
      .map(toSibling);
  }

  async findActiveRestroomsByPlaceId(
    placeId: string,
  ): Promise<SiblingRestroom[]> {
    const establishment = this.establishments.find(
      (e) => e.placeId === placeId,
    );
    if (!establishment) return [];

    return this.restrooms
      .filter(
        (r) =>
          r.establishmentId === establishment.id && r.status === "active",
      )
      .map(toSibling);
  }

  async findEstablishmentByPlaceId(
    placeId: string,
  ): Promise<Establishment | null> {
    const establishment = this.establishments.find(
      (e) => e.placeId === placeId,
    );
    if (!establishment) return null;
    return {
      id: establishment.id,
      placeId: establishment.placeId,
      name: establishment.name,
      formattedAddress: establishment.formattedAddress,
      lat: establishment.lat,
      lng: establishment.lng,
    };
  }

  async createEstablishment(
    input: CreateEstablishmentInput,
  ): Promise<Establishment> {
    const existing = this.establishments.find(
      (e) => e.placeId === input.placeId,
    );
    if (existing) {
      return {
        id: existing.id,
        placeId: existing.placeId,
        name: existing.name,
        formattedAddress: existing.formattedAddress,
        lat: existing.lat,
        lng: existing.lng,
      };
    }

    const establishment: SeedEstablishment = {
      id: crypto.randomUUID(),
      placeId: input.placeId,
      name: input.name,
      formattedAddress: input.formattedAddress,
      lat: input.lat,
      lng: input.lng,
    };
    this.establishments.push(establishment);
    return {
      id: establishment.id,
      placeId: establishment.placeId,
      name: establishment.name,
      formattedAddress: establishment.formattedAddress,
      lat: establishment.lat,
      lng: establishment.lng,
    };
  }

  async createRestroom(
    input: CreateRestroomInput,
  ): Promise<{ id: string }> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    this.restrooms.push({
      id,
      establishmentId: input.establishmentId,
      createdBy: input.createdBy,
      floorArea: input.floorArea,
      restroomLabel: input.restroomLabel,
      bidetType: input.bidetType,
      hasTissue: input.hasTissue,
      hasSoap: input.hasSoap,
      hasHandDrying: input.hasHandDrying,
      accessCost: input.accessCost,
      accessScope: input.accessScope,
      status: "active",
      verifyCount: 0,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  }

  async createRestroomPhoto(
    input: CreateRestroomPhotoInput,
  ): Promise<StoredPhotoRow> {
    this.restroomPhotos.push({
      id: input.id,
      restroomId: input.restroomId,
      uploadedBy: input.uploadedBy,
      storagePath: input.storagePath,
      sortOrder: input.sortOrder,
      removedAt: null,
    });
    return {
      id: input.id,
      storagePath: input.storagePath,
      sortOrder: input.sortOrder,
    };
  }

  async insertVerify(input: InsertVerifyInput): Promise<InsertVerifyOutcome> {
    const restroom = this.restrooms.find((r) => r.id === input.restroomId);
    if (!restroom || restroom.status === "archived") {
      return { status: "not_found" };
    }

    const duplicate = this.verifies.some(
      (v) =>
        v.restroomId === input.restroomId && v.userId === input.userId,
    );
    if (duplicate) {
      return { status: "conflict" };
    }

    this.verifies.push({
      id: crypto.randomUUID(),
      restroomId: input.restroomId,
      userId: input.userId,
      createdAt: new Date().toISOString(),
    });

    // Mirrors after_insert_verify trigger.
    restroom.verifyCount += 1;
    restroom.updatedAt = new Date().toISOString();

    const listing = this.listings.find((l) => l.id === input.restroomId);
    if (listing) {
      listing.verifyCount = restroom.verifyCount;
    }

    return { status: "inserted", verifyCount: restroom.verifyCount };
  }
}
