import type { Actor, AuthPort } from "./ports/auth";
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
  findExistingForPlaceInputSchema,
  getRestroomInputSchema,
  listNearbyInputSchema,
  listSiblingsInputSchema,
  addRestroomInputSchema,
  deleteRestroomInputSchema,
  reportRestroomInputSchema,
  searchPlacesInputSchema,
  updateRestroomInputSchema,
  upsertReviewInputSchema,
  verifyRestroomInputSchema,
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

function requireSignedIn(
  actor: Actor,
): Result<Extract<Actor, { role: "user" | "admin" }>, DirectoryError> {
  if (actor.role === "guest") {
    return err("unauthenticated");
  }
  return ok(actor);
}

/**
 * RestroomDirectory — wires adapter ports.
 * Read ops + write path through creator edit/delete gates;
 * admin ops remain stubbed for later tickets.
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
    input: SearchPlacesInput,
  ): Promise<Result<PlaceSuggestion[], DirectoryError>> {
    const actor = await this.deps.auth.getActor();
    const gated = requireSignedIn(actor);
    if (!gated.ok) return gated;

    const parsed = searchPlacesInputSchema.safeParse(input);
    if (!parsed.success) {
      return err("validation_error");
    }

    const suggestions = await this.deps.places.autocomplete(
      parsed.data.query,
      parsed.data.near,
    );
    return ok(suggestions);
  }

  async findExistingForPlace(
    input: FindExistingForPlaceInput,
  ): Promise<Result<SiblingRestroom[], DirectoryError>> {
    const actor = await this.deps.auth.getActor();
    const gated = requireSignedIn(actor);
    if (!gated.ok) return gated;

    const parsed = findExistingForPlaceInputSchema.safeParse(input);
    if (!parsed.success) {
      return err("validation_error");
    }

    const existing = await this.deps.postgres.findActiveRestroomsByPlaceId(
      parsed.data.placeId,
    );
    return ok(existing);
  }

  async addRestroom(
    input: AddRestroomInput,
  ): Promise<Result<RestroomDetail, DirectoryError>> {
    const actor = await this.deps.auth.getActor();
    const gated = requireSignedIn(actor);
    if (!gated.ok) return gated;

    const parsed = addRestroomInputSchema.safeParse(input);
    if (!parsed.success) {
      return err("validation_error");
    }

    const data = parsed.data;
    let establishment =
      await this.deps.postgres.findEstablishmentByPlaceId(data.placeId);

    if (!establishment) {
      establishment = await this.deps.postgres.createEstablishment({
        placeId: data.placeId,
        name: data.name,
        formattedAddress: data.formattedAddress ?? null,
        lat: data.lat,
        lng: data.lng,
      });
    }

    const { id: restroomId } = await this.deps.postgres.createRestroom({
      establishmentId: establishment.id,
      createdBy: gated.value.userId,
      floorArea: data.floorArea ?? null,
      restroomLabel: data.restroomLabel ?? null,
      bidetType: data.bidetType,
      hasTissue: data.hasTissue,
      hasSoap: data.hasSoap,
      hasHandDrying: data.hasHandDrying,
      accessCost: data.accessCost,
      accessScope: data.accessScope,
    });

    for (const [sortOrder, photo] of data.photos.entries()) {
      const photoId = crypto.randomUUID();
      const storagePath = `${restroomId}/${photoId}.webp`;
      await this.deps.storage.upload({
        bucket: "restroom-photos",
        path: storagePath,
        data: photo.data,
        contentType: photo.contentType,
      });
      await this.deps.postgres.createRestroomPhoto({
        id: photoId,
        restroomId,
        uploadedBy: gated.value.userId,
        storagePath,
        sortOrder,
      });
    }

    const row = await this.deps.postgres.findRestroomDetail(restroomId);
    if (!row) {
      return err("not_found");
    }

    return ok(toRestroomDetail(row, this.deps.storage));
  }

  async verifyRestroom(
    input: VerifyRestroomInput,
  ): Promise<Result<VerifyRestroomResult, DirectoryError>> {
    const actor = await this.deps.auth.getActor();
    const gated = requireSignedIn(actor);
    if (!gated.ok) return gated;

    const parsed = verifyRestroomInputSchema.safeParse(input);
    if (!parsed.success) {
      return err("validation_error");
    }

    const outcome = await this.deps.postgres.insertVerify({
      restroomId: parsed.data.restroomId,
      userId: gated.value.userId,
    });

    if (outcome.status === "not_found") {
      return err("not_found");
    }
    if (outcome.status === "conflict") {
      return err("conflict");
    }

    return ok({
      restroomId: parsed.data.restroomId,
      verifyCount: outcome.verifyCount,
      communityVerified: isCommunityVerified(outcome.verifyCount),
    });
  }

  async upsertReview(
    input: UpsertReviewInput,
  ): Promise<Result<Review, DirectoryError>> {
    const actor = await this.deps.auth.getActor();
    const gated = requireSignedIn(actor);
    if (!gated.ok) return gated;

    const parsed = upsertReviewInputSchema.safeParse(input);
    if (!parsed.success) {
      return err("validation_error");
    }

    const data = parsed.data;
    const outcome = await this.deps.postgres.upsertReview({
      restroomId: data.restroomId,
      userId: gated.value.userId,
      stars: data.stars,
      comment: data.comment ?? null,
      cleanlinessOk: data.cleanlinessOk ?? null,
      amenitiesOk: data.amenitiesOk ?? null,
      accessOk: data.accessOk ?? null,
    });

    if (outcome.status === "not_found") {
      return err("not_found");
    }

    if (data.photos.length > 0) {
      await this.deps.postgres.softRemoveReviewPhotos(outcome.reviewId);
      for (const [sortOrder, photo] of data.photos.entries()) {
        const photoId = crypto.randomUUID();
        const storagePath = `${outcome.reviewId}/${photoId}.webp`;
        await this.deps.storage.upload({
          bucket: "review-photos",
          path: storagePath,
          data: photo.data,
          contentType: photo.contentType,
        });
        await this.deps.postgres.createReviewPhoto({
          id: photoId,
          reviewId: outcome.reviewId,
          storagePath,
          sortOrder,
        });
      }
    }

    const row = await this.deps.postgres.findRestroomDetail(data.restroomId);
    const review = row?.reviews.find((r) => r.id === outcome.reviewId);
    if (!review) {
      return err("not_found");
    }

    return ok({
      id: review.id,
      restroomId: review.restroomId,
      stars: review.stars,
      comment: review.comment,
      cleanlinessOk: review.cleanlinessOk,
      amenitiesOk: review.amenitiesOk,
      accessOk: review.accessOk,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      author: review.author,
      photos: review.photos.map((p) =>
        withPublicUrl(this.deps.storage, "review-photos", p),
      ),
    });
  }

  async reportRestroom(
    input: ReportRestroomInput,
  ): Promise<Result<Report, DirectoryError>> {
    const actor = await this.deps.auth.getActor();
    const gated = requireSignedIn(actor);
    if (!gated.ok) return gated;

    const parsed = reportRestroomInputSchema.safeParse(input);
    if (!parsed.success) {
      return err("validation_error");
    }

    const outcome = await this.deps.postgres.insertReport({
      restroomId: parsed.data.restroomId,
      reporterId: gated.value.userId,
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
    });

    if (outcome.status === "not_found") {
      return err("not_found");
    }

    return ok({
      id: outcome.report.id,
      restroomId: outcome.report.restroomId,
      reason: outcome.report.reason,
      details: outcome.report.details,
      status: "open",
      createdAt: outcome.report.createdAt,
    });
  }

  async deleteRestroom(
    input: DeleteRestroomInput,
  ): Promise<Result<void, DirectoryError>> {
    const actor = await this.deps.auth.getActor();
    const gated = requireSignedIn(actor);
    if (!gated.ok) return gated;

    const parsed = deleteRestroomInputSchema.safeParse(input);
    if (!parsed.success) {
      return err("validation_error");
    }

    const row = await this.deps.postgres.findRestroomDetail(
      parsed.data.restroomId,
    );
    if (!row || row.status === "archived") {
      return err("not_found");
    }

    const isAdmin = gated.value.role === "admin";
    const isCreator = row.createdBy === gated.value.userId;
    if (!isAdmin && !isCreator) {
      return err("forbidden");
    }

    if (!isAdmin) {
      const creatorId = row.createdBy ?? gated.value.userId;
      const blocked = await this.deps.postgres.hasOtherUserCommunityActivity(
        parsed.data.restroomId,
        creatorId,
      );
      if (blocked) {
        return err("forbidden");
      }
    }

    const outcome = await this.deps.postgres.deleteRestroom(
      parsed.data.restroomId,
    );
    if (outcome.status === "not_found") {
      return err("not_found");
    }

    return ok(undefined);
  }

  async updateRestroom(
    input: UpdateRestroomInput,
  ): Promise<Result<RestroomDetail, DirectoryError>> {
    const actor = await this.deps.auth.getActor();
    const gated = requireSignedIn(actor);
    if (!gated.ok) return gated;

    const parsed = updateRestroomInputSchema.safeParse(input);
    if (!parsed.success) {
      return err("validation_error");
    }

    const data = parsed.data;
    const row = await this.deps.postgres.findRestroomDetail(data.restroomId);
    if (!row || row.status === "archived") {
      return err("not_found");
    }

    const isAdmin = gated.value.role === "admin";
    const isCreator = row.createdBy === gated.value.userId;
    if (!isAdmin && !isCreator) {
      return err("forbidden");
    }

    if (!isAdmin) {
      const creatorId = row.createdBy ?? gated.value.userId;
      const blocked = await this.deps.postgres.hasOtherUserCommunityActivity(
        data.restroomId,
        creatorId,
      );
      if (blocked) {
        return err("forbidden");
      }
    }

    const outcome = await this.deps.postgres.updateRestroomFields({
      restroomId: data.restroomId,
      floorArea: data.floorArea,
      restroomLabel: data.restroomLabel,
      bidetType: data.bidetType,
      hasTissue: data.hasTissue,
      hasSoap: data.hasSoap,
      hasHandDrying: data.hasHandDrying,
      accessCost: data.accessCost,
      accessScope: data.accessScope,
    });

    if (outcome.status === "not_found") {
      return err("not_found");
    }

    if (data.photos !== undefined) {
      await this.deps.postgres.softRemoveRestroomPhotos(data.restroomId);
      for (const [sortOrder, photo] of data.photos.entries()) {
        const photoId = crypto.randomUUID();
        const storagePath = `${data.restroomId}/${photoId}.webp`;
        await this.deps.storage.upload({
          bucket: "restroom-photos",
          path: storagePath,
          data: photo.data,
          contentType: photo.contentType,
        });
        await this.deps.postgres.createRestroomPhoto({
          id: photoId,
          restroomId: data.restroomId,
          uploadedBy: gated.value.userId,
          storagePath,
          sortOrder,
        });
      }
    }

    const updated = await this.deps.postgres.findRestroomDetail(
      data.restroomId,
    );
    if (!updated) {
      return err("not_found");
    }

    return ok(toRestroomDetail(updated, this.deps.storage));
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
