import type {
  AccessCost,
  AccessScope,
  AdminRestroomSummary,
  BidetType,
  Establishment,
  NearbyRestroom,
  ReportReason,
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
  /** Defaults to active when omitted (user add flow). */
  status?: RestroomStatus;
};

export type CreateRestroomPhotoInput = {
  id: string;
  restroomId: string;
  uploadedBy: string;
  storagePath: string;
  sortOrder: number;
};

export type InsertVerifyInput = {
  restroomId: string;
  userId: string;
};

/**
 * Insert verify result. Mirrors UNIQUE (restroom_id, user_id) +
 * after_insert_verify increment of verify_count.
 */
export type InsertVerifyOutcome =
  | { status: "inserted"; verifyCount: number }
  | { status: "conflict" }
  | { status: "not_found" };

export type UpsertReviewPortInput = {
  restroomId: string;
  userId: string;
  stars: number;
  comment: string | null;
  cleanlinessOk: boolean | null;
  amenitiesOk: boolean | null;
  accessOk: boolean | null;
};

/**
 * Upsert review result. Mirrors UNIQUE (restroom_id, user_id) update-in-place
 * + after_review_change recompute of rating_avg / rating_count.
 */
export type UpsertReviewOutcome =
  | { status: "upserted"; reviewId: string }
  | { status: "not_found" };

export type CreateReviewPhotoInput = {
  id: string;
  reviewId: string;
  storagePath: string;
  sortOrder: number;
};

export type InsertReportInput = {
  restroomId: string;
  reporterId: string;
  reason: ReportReason;
  details: string | null;
};

/**
 * Insert report result. App logic sets restroom status to disputed
 * on every new open report (DATA_ARCHITECTURE).
 */
export type InsertReportOutcome =
  | {
      status: "inserted";
      report: {
        id: string;
        restroomId: string;
        reason: ReportReason;
        details: string | null;
        createdAt: string;
      };
    }
  | { status: "not_found" };

export type UpdateRestroomFieldsInput = {
  restroomId: string;
  floorArea?: string | null;
  restroomLabel?: string | null;
  bidetType?: BidetType;
  hasTissue?: boolean;
  hasSoap?: boolean;
  hasHandDrying?: boolean;
  accessCost?: AccessCost;
  accessScope?: AccessScope;
  /** When set, reassigns the listing to this establishment. */
  establishmentId?: string;
  /**
   * When true, allow patching archived rows (admin upsert).
   * Creator update path leaves this false / omitted.
   */
  allowArchived?: boolean;
};

export type UpdateRestroomFieldsOutcome =
  | { status: "updated" }
  | { status: "not_found" };

export type SetRestroomStatusInput = {
  restroomId: string;
  status: RestroomStatus;
};

export type SetRestroomStatusOutcome =
  | { status: "updated" }
  | { status: "not_found" };

export type SoftRemovePhotoInput = {
  photoId: string;
  kind: "restroom" | "review";
};

export type SoftRemovePhotoOutcome =
  | { status: "removed" }
  | { status: "not_found" };

export type UpdateEstablishmentInput = {
  establishmentId: string;
  name?: string;
  formattedAddress?: string | null;
  lat?: number;
  lng?: number;
  placeId?: string;
};

export type DeleteRestroomOutcome =
  | { status: "deleted" }
  | { status: "not_found" };

export type MergeRestroomsInput = {
  loserId: string;
  survivorId: string;
};

/**
 * Admin merge: archive loser → survivor, reassign unique verifies/reviews,
 * recalculate survivor aggregates. Missing either id → not_found.
 */
export type MergeRestroomsOutcome =
  | { status: "merged" }
  | { status: "not_found" };

export type OpenReportRow = {
  id: string;
  restroomId: string;
  reason: ReportReason;
  details: string | null;
  status: "open";
  createdAt: string;
  restroomName: string;
  reporterDisplayName: string;
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

  /**
   * Inserts one verify per user per listing and increments verify_count.
   * Archived / missing → not_found; duplicate (restroom_id, user_id) → conflict.
   */
  insertVerify(input: InsertVerifyInput): Promise<InsertVerifyOutcome>;

  /**
   * Inserts or updates the caller's review (UNIQUE restroom_id + user_id)
   * and recomputes rating aggregates. Archived / missing → not_found.
   */
  upsertReview(input: UpsertReviewPortInput): Promise<UpsertReviewOutcome>;

  createReviewPhoto(input: CreateReviewPhotoInput): Promise<StoredPhotoRow>;

  /** Soft-removes published review photos (sets removed_at). */
  softRemoveReviewPhotos(reviewId: string): Promise<void>;

  /**
   * Inserts an open report and sets restroom status to disputed.
   * Archived / missing → not_found. Multiple reports per listing allowed.
   */
  insertReport(input: InsertReportInput): Promise<InsertReportOutcome>;

  /**
   * True when another user (not creatorId) has verified or reviewed the listing.
   * Missing / archived → false (caller handles not_found separately).
   */
  hasOtherUserCommunityActivity(
    restroomId: string,
    creatorId: string,
  ): Promise<boolean>;

  /**
   * Patches amenities / labels on an existing restroom.
   * Missing → not_found. Archived → not_found unless allowArchived.
   */
  updateRestroomFields(
    input: UpdateRestroomFieldsInput,
  ): Promise<UpdateRestroomFieldsOutcome>;

  /** Soft-removes published restroom seed photos (sets removed_at). */
  softRemoveRestroomPhotos(restroomId: string): Promise<void>;

  /**
   * Sets lifecycle status (active / disputed / closed / archived).
   * Missing → not_found. Works on archived rows (admin reopen / seed).
   */
  setRestroomStatus(
    input: SetRestroomStatusInput,
  ): Promise<SetRestroomStatusOutcome>;

  /**
   * Soft-deletes one restroom or review photo via removed_at.
   * Missing / already removed → not_found.
   */
  softRemovePhoto(
    input: SoftRemovePhotoInput,
  ): Promise<SoftRemovePhotoOutcome>;

  /** Patches establishment display fields (admin seed/edit). */
  updateEstablishment(input: UpdateEstablishmentInput): Promise<void>;

  /**
   * Hard-deletes a restroom and its seed photos / verifies / reviews / reports.
   * Missing → not_found.
   */
  deleteRestroom(restroomId: string): Promise<DeleteRestroomOutcome>;

  /**
   * Archives loser (`merged_into_id` → survivor), reassigns non-conflicting
   * verifies/reviews, recalculates survivor verify/rating aggregates.
   * Seed photos stay on each listing (no copy). Missing either → not_found.
   */
  mergeRestrooms(input: MergeRestroomsInput): Promise<MergeRestroomsOutcome>;

  /**
   * Open reports for the admin queue, oldest `created_at` first
   * (matches `reports_open_queue_idx`).
   */
  findOpenReports(): Promise<OpenReportRow[]>;

  /**
   * All restroom listings for the admin seed/edit table
   * (any status), newest `updated_at` first.
   */
  findAdminRestroomSummaries(): Promise<AdminRestroomSummary[]>;
}
