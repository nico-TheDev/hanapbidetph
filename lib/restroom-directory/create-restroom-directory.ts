import type { AuthPort } from "./ports/auth";
import type { GeolocationPort } from "./ports/geolocation";
import type { PlacesPort } from "./ports/places";
import type {
  PostgresPort,
  RestroomDetailRow,
  StoredPhotoRow,
} from "./ports/postgres";
import type { StoragePort } from "./ports/storage";
import {
  hasBidetFromType,
  isCommunityVerified,
} from "./pin-variant";
import { err, ok, type Result } from "./result";
import type {
  DirectoryError,
  RestroomDirectory,
} from "./restroom-directory";
import {
  getRestroomInputSchema,
  listNearbyInputSchema,
  listSiblingsInputSchema,
  type AddRestroomInput,
  type AdminMergeInput,
  type AdminRemovePhotoInput,
  type AdminSetStatusInput,
  type AdminUpsertRestroomInput,
  type DeleteRestroomInput,
  type FindExistingForPlaceInput,
  type GetRestroomInput,
  type ListNearbyInput,
  type ListSiblingsInput,
  type MyContribution,
  type NearbyRestroom,
  type OpenReport,
  type PlaceSuggestion,
  type Report,
  type ReportRestroomInput,
  type RestroomDetail,
  type Review,
  type SearchPlacesInput,
  type SiblingRestroom,
  type UpdateRestroomInput,
  type UpsertReviewInput,
  type VerifyRestroomInput,
  type VerifyRestroomResult,
} from "./schemas";

function withPublicUrl(
  storage: StoragePort,
  bucket: "restroom-photos" | "review-photos",
  photo: StoredPhotoRow,
) {
  return {
    id: photo.id,
    storagePath: photo.storagePath,
    publicUrl: storage.getPublicUrl(bucket, photo.storagePath),
    sortOrder: photo.sortOrder,
  };
}

function toRestroomDetail(
  row: RestroomDetailRow,
  storage: StoragePort,
): RestroomDetail {
  return {
    id: row.id,
    establishment: row.establishment,
    floorArea: row.floorArea,
    restroomLabel: row.restroomLabel,
    bidetType: row.bidetType,
    hasBidet: hasBidetFromType(row.bidetType),
    hasTissue: row.hasTissue,
    hasSoap: row.hasSoap,
    hasHandDrying: row.hasHandDrying,
    accessCost: row.accessCost,
    accessScope: row.accessScope,
    status: row.status,
    verifyCount: row.verifyCount,
    communityVerified: isCommunityVerified(row.verifyCount),
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    isDisputed: row.status === "disputed",
    createdBy: row.createdBy,
    photos: row.photos.map((p) =>
      withPublicUrl(storage, "restroom-photos", p),
    ),
    reviews: row.reviews.map((rev) => ({
      id: rev.id,
      restroomId: rev.restroomId,
      stars: rev.stars,
      comment: rev.comment,
      cleanlinessOk: rev.cleanlinessOk,
      amenitiesOk: rev.amenitiesOk,
      accessOk: rev.accessOk,
      createdAt: rev.createdAt,
      updatedAt: rev.updatedAt,
      author: rev.author,
      photos: rev.photos.map((p) =>
        withPublicUrl(storage, "review-photos", p),
      ),
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type RestroomDirectoryDeps = {
  auth: AuthPort;
  places: PlacesPort;
  postgres: PostgresPort;
  storage: StoragePort;
  geolocation: GeolocationPort;
};

/**
 * RestroomDirectory — wires adapter ports.
 * listNearby / getRestroom / listSiblings are implemented; remaining ops later.
 */
class StubRestroomDirectory implements RestroomDirectory {
  constructor(private readonly deps: RestroomDirectoryDeps) {}

  async listNearby(
    input: ListNearbyInput,
  ): Promise<Result<NearbyRestroom[], DirectoryError>> {
    const parsed = listNearbyInputSchema.safeParse(input);
    if (!parsed.success) {
      return err("validation_error");
    }

    const value = await this.deps.postgres.findActiveRestroomsNear({
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      radiusMeters: parsed.data.radiusMeters,
      filters: parsed.data.filters
        ? {
            hasBidet: parsed.data.filters.hasBidet,
            accessCost: parsed.data.filters.accessCost,
            accessScope: parsed.data.filters.accessScope,
            communityVerified: parsed.data.filters.communityVerified,
          }
        : undefined,
    });

    return ok(value);
  }

  async getRestroom(
    input: GetRestroomInput,
  ): Promise<Result<RestroomDetail, DirectoryError>> {
    const parsed = getRestroomInputSchema.safeParse(input);
    if (!parsed.success) {
      return err("validation_error");
    }

    const row = await this.deps.postgres.findRestroomDetail(parsed.data.id);
    if (!row || row.status === "archived") {
      return err("not_found");
    }

    return ok(toRestroomDetail(row, this.deps.storage));
  }

  async listSiblings(
    input: ListSiblingsInput,
  ): Promise<Result<SiblingRestroom[], DirectoryError>> {
    const parsed = listSiblingsInputSchema.safeParse(input);
    if (!parsed.success) {
      return err("validation_error");
    }

    const siblings = await this.deps.postgres.findActiveSiblings(
      parsed.data.restroomId,
    );
    if (siblings === null) {
      return err("not_found");
    }

    return ok(siblings);
  }

  async searchPlaces(
    _input: SearchPlacesInput,
  ): Promise<Result<PlaceSuggestion[], DirectoryError>> {
    return err("not_implemented");
  }

  async findExistingForPlace(
    _input: FindExistingForPlaceInput,
  ): Promise<Result<SiblingRestroom[], DirectoryError>> {
    return err("not_implemented");
  }

  async addRestroom(
    _input: AddRestroomInput,
  ): Promise<Result<RestroomDetail, DirectoryError>> {
    return err("not_implemented");
  }

  async verifyRestroom(
    _input: VerifyRestroomInput,
  ): Promise<Result<VerifyRestroomResult, DirectoryError>> {
    return err("not_implemented");
  }

  async upsertReview(
    _input: UpsertReviewInput,
  ): Promise<Result<Review, DirectoryError>> {
    return err("not_implemented");
  }

  async reportRestroom(
    _input: ReportRestroomInput,
  ): Promise<Result<Report, DirectoryError>> {
    return err("not_implemented");
  }

  async deleteRestroom(
    _input: DeleteRestroomInput,
  ): Promise<Result<void, DirectoryError>> {
    return err("not_implemented");
  }

  async updateRestroom(
    _input: UpdateRestroomInput,
  ): Promise<Result<RestroomDetail, DirectoryError>> {
    return err("not_implemented");
  }

  async adminUpsertRestroom(
    _input: AdminUpsertRestroomInput,
  ): Promise<Result<RestroomDetail, DirectoryError>> {
    return err("not_implemented");
  }

  async adminSetStatus(
    _input: AdminSetStatusInput,
  ): Promise<Result<void, DirectoryError>> {
    return err("not_implemented");
  }

  async adminMerge(
    _input: AdminMergeInput,
  ): Promise<Result<void, DirectoryError>> {
    return err("not_implemented");
  }

  async adminRemovePhoto(
    _input: AdminRemovePhotoInput,
  ): Promise<Result<void, DirectoryError>> {
    return err("not_implemented");
  }

  async listMyReviews(): Promise<Result<Review[], DirectoryError>> {
    return err("not_implemented");
  }

  async listMyContributions(): Promise<
    Result<MyContribution[], DirectoryError>
  > {
    return err("not_implemented");
  }

  async listOpenReports(): Promise<Result<OpenReport[], DirectoryError>> {
    return err("not_implemented");
  }
}

export function createRestroomDirectory(
  deps: RestroomDirectoryDeps,
): RestroomDirectory {
  return new StubRestroomDirectory(deps);
}
