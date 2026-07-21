import type {
  AccessCost,
  AccessScope,
  BidetType,
  Establishment,
  NearbyRestroom,
  RestroomStatus,
  SiblingRestroom,
} from "../schemas";

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

/** Photo row before public URL resolution (storage path only). */
export type StoredPhotoRow = {
  id: string;
  storagePath: string;
  sortOrder: number;
};

export type ReviewAuthorRow = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

export type ReviewRow = {
  id: string;
  restroomId: string;
  stars: number;
  comment: string | null;
  cleanlinessOk: boolean | null;
  amenitiesOk: boolean | null;
  accessOk: boolean | null;
  createdAt: string;
  updatedAt: string;
  author: ReviewAuthorRow;
  photos: StoredPhotoRow[];
};

/** Restroom detail row from Postgres before computed flags / public URLs. */
export type RestroomDetailRow = {
  id: string;
  establishment: Establishment;
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
  createdBy: string | null;
  photos: StoredPhotoRow[];
  reviews: ReviewRow[];
  createdAt: string;
  updatedAt: string;
};

export type CreateEstablishmentInput = {
  placeId: string;
  name: string;
  formattedAddress: string | null;
  lat: number;
  lng: number;
};

export type CreateRestroomInput = {
  establishmentId: string;
  createdBy: string;
  floorArea: string | null;
  restroomLabel: string | null;
  bidetType: BidetType;
  hasTissue: boolean;
  hasSoap: boolean;
  hasHandDrying: boolean;
  accessCost: AccessCost;
  accessScope: AccessScope;
};

export type CreateRestroomPhotoInput = {
  id: string;
  restroomId: string;
  uploadedBy: string;
  storagePath: string;
  sortOrder: number;
};

/**
 * Postgres / PostGIS persistence adapter port.
 * Ticket 02 keeps this thin; later tickets grow query/mutation methods.
 */
export interface PostgresPort {
  findActiveRestroomsNear(
    params: FindActiveNearParams,
  ): Promise<NearbyRestroom[]>;

  /** Returns the listing including archived; null if missing. */
  findRestroomDetail(id: string): Promise<RestroomDetailRow | null>;

  /**
   * Other active restrooms at the same establishment.
   * null if the source restroom is missing or archived.
   */
  findActiveSiblings(restroomId: string): Promise<SiblingRestroom[] | null>;

  /**
   * Active restrooms at an establishment identified by Google `place_id`.
   * Empty when the place is unknown or has no active listings.
   */
  findActiveRestroomsByPlaceId(placeId: string): Promise<SiblingRestroom[]>;

  findEstablishmentByPlaceId(placeId: string): Promise<Establishment | null>;

  createEstablishment(
    input: CreateEstablishmentInput,
  ): Promise<Establishment>;

  /** Inserts an active restroom with verify_count = 0. */
  createRestroom(input: CreateRestroomInput): Promise<{ id: string }>;

  createRestroomPhoto(
    input: CreateRestroomPhotoInput,
  ): Promise<StoredPhotoRow>;
}
