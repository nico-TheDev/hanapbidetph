import type { Result } from "./result";
import type {
  AddRestroomInput,
  AdminMergeInput,
  AdminRemovePhotoInput,
  AdminSetStatusInput,
  AdminUpsertRestroomInput,
  DeleteRestroomInput,
  FindExistingForPlaceInput,
  GetRestroomInput,
  ListNearbyInput,
  ListSiblingsInput,
  MyContribution,
  NearbyRestroom,
  OpenReport,
  PlaceSuggestion,
  Report,
  ReportRestroomInput,
  RestroomDetail,
  Review,
  SearchPlacesInput,
  SiblingRestroom,
  UpdateRestroomInput,
  UpsertReviewInput,
  VerifyRestroomInput,
  VerifyRestroomResult,
} from "./schemas";

export type DirectoryError =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "conflict"
  | "not_implemented";

/**
 * Primary behavioral seam for HanapBidet PH v1.
 * UI, admin, and Server Actions call this; adapters are injected.
 */
export interface RestroomDirectory {
  listNearby(
    input: ListNearbyInput,
  ): Promise<Result<NearbyRestroom[], DirectoryError>>;

  getRestroom(
    input: GetRestroomInput,
  ): Promise<Result<RestroomDetail, DirectoryError>>;

  listSiblings(
    input: ListSiblingsInput,
  ): Promise<Result<SiblingRestroom[], DirectoryError>>;

  searchPlaces(
    input: SearchPlacesInput,
  ): Promise<Result<PlaceSuggestion[], DirectoryError>>;

  findExistingForPlace(
    input: FindExistingForPlaceInput,
  ): Promise<Result<SiblingRestroom[], DirectoryError>>;

  addRestroom(
    input: AddRestroomInput,
  ): Promise<Result<RestroomDetail, DirectoryError>>;

  verifyRestroom(
    input: VerifyRestroomInput,
  ): Promise<Result<VerifyRestroomResult, DirectoryError>>;

  upsertReview(
    input: UpsertReviewInput,
  ): Promise<Result<Review, DirectoryError>>;

  reportRestroom(
    input: ReportRestroomInput,
  ): Promise<Result<Report, DirectoryError>>;

  deleteRestroom(
    input: DeleteRestroomInput,
  ): Promise<Result<void, DirectoryError>>;

  updateRestroom(
    input: UpdateRestroomInput,
  ): Promise<Result<RestroomDetail, DirectoryError>>;

  adminUpsertRestroom(
    input: AdminUpsertRestroomInput,
  ): Promise<Result<RestroomDetail, DirectoryError>>;

  adminSetStatus(
    input: AdminSetStatusInput,
  ): Promise<Result<void, DirectoryError>>;

  adminMerge(input: AdminMergeInput): Promise<Result<void, DirectoryError>>;

  adminRemovePhoto(
    input: AdminRemovePhotoInput,
  ): Promise<Result<void, DirectoryError>>;

  listMyReviews(): Promise<Result<Review[], DirectoryError>>;

  listMyContributions(): Promise<Result<MyContribution[], DirectoryError>>;

  listOpenReports(): Promise<Result<OpenReport[], DirectoryError>>;
}
