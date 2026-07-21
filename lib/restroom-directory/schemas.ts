import { z } from "zod";

export const bidetTypeSchema = z.enum([
  "none",
  "manual_spray",
  "high_pressure",
  "built_in",
]);

export const accessCostSchema = z.enum(["free", "paid"]);

export const accessScopeSchema = z.enum(["public", "needs_patronage"]);

export const restroomStatusSchema = z.enum([
  "active",
  "disputed",
  "closed",
  "archived",
]);

export const reportReasonSchema = z.enum([
  "doesnt_exist",
  "wrong_location",
  "permanently_closed",
  "inappropriate_photos",
]);

export const reportStatusSchema = z.enum(["open", "reviewed", "dismissed"]);

export const pinVariantSchema = z.enum([
  "bidet",
  "standard",
  "bidet_unverified",
  "standard_unverified",
]);

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const nearbyFiltersSchema = z.object({
  hasBidet: z.boolean().optional(),
  accessCost: accessCostSchema.optional(),
  accessScope: accessScopeSchema.optional(),
  communityVerified: z.boolean().optional(),
});

/** Default radius 1 km; max 5 km (spec / DATA_ARCHITECTURE). */
export const listNearbyInputSchema = latLngSchema.extend({
  radiusMeters: z.number().positive().max(5000).default(1000),
  filters: nearbyFiltersSchema.optional(),
});

export const nearbyRestroomSchema = z.object({
  id: z.string().uuid(),
  establishmentId: z.string().uuid(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  distanceMeters: z.number().nonnegative(),
  bidetType: bidetTypeSchema,
  hasBidet: z.boolean(),
  accessCost: accessCostSchema,
  accessScope: accessScopeSchema,
  verifyCount: z.number().int().nonnegative(),
  communityVerified: z.boolean(),
  ratingAvg: z.number().nullable(),
  ratingCount: z.number().int().nonnegative(),
  pinVariant: pinVariantSchema,
  floorArea: z.string().nullable(),
  restroomLabel: z.string().nullable(),
});

export const getRestroomInputSchema = z.object({
  id: z.string().uuid(),
});

export const restroomPhotoSchema = z.object({
  id: z.string().uuid(),
  storagePath: z.string(),
  publicUrl: z.string(),
  sortOrder: z.number().int().nonnegative(),
});

export const reviewPhotoSchema = restroomPhotoSchema;

export const reviewAuthorSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
});

export const reviewSchema = z.object({
  id: z.string().uuid(),
  restroomId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  cleanlinessOk: z.boolean().nullable(),
  amenitiesOk: z.boolean().nullable(),
  accessOk: z.boolean().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  author: reviewAuthorSchema,
  photos: z.array(reviewPhotoSchema),
});

export const establishmentSchema = z.object({
  id: z.string().uuid(),
  placeId: z.string(),
  name: z.string(),
  formattedAddress: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
});

export const restroomDetailSchema = z.object({
  id: z.string().uuid(),
  establishment: establishmentSchema,
  floorArea: z.string().nullable(),
  restroomLabel: z.string().nullable(),
  bidetType: bidetTypeSchema,
  hasBidet: z.boolean(),
  hasTissue: z.boolean(),
  hasSoap: z.boolean(),
  hasHandDrying: z.boolean(),
  accessCost: accessCostSchema,
  accessScope: accessScopeSchema,
  status: restroomStatusSchema,
  verifyCount: z.number().int().nonnegative(),
  communityVerified: z.boolean(),
  ratingAvg: z.number().nullable(),
  ratingCount: z.number().int().nonnegative(),
  isDisputed: z.boolean(),
  createdBy: z.string().uuid().nullable(),
  photos: z.array(restroomPhotoSchema),
  reviews: z.array(reviewSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const listSiblingsInputSchema = z.object({
  restroomId: z.string().uuid(),
});

export const siblingRestroomSchema = z.object({
  id: z.string().uuid(),
  floorArea: z.string().nullable(),
  restroomLabel: z.string().nullable(),
  bidetType: bidetTypeSchema,
  hasBidet: z.boolean(),
  verifyCount: z.number().int().nonnegative(),
  communityVerified: z.boolean(),
  ratingAvg: z.number().nullable(),
  ratingCount: z.number().int().nonnegative(),
});

export const searchPlacesInputSchema = z.object({
  query: z.string().min(1),
  near: latLngSchema.optional(),
});

export const placeSuggestionSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  formattedAddress: z.string().nullable(),
});

export const findExistingForPlaceInputSchema = z.object({
  placeId: z.string().min(1),
});

export const photoUploadSchema = z.object({
  data: z.instanceof(Uint8Array),
  contentType: z.string().min(1),
});

export const addRestroomInputSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().min(1),
  formattedAddress: z.string().nullable().optional(),
  lat: z.number(),
  lng: z.number(),
  floorArea: z.string().nullable().optional(),
  restroomLabel: z.string().nullable().optional(),
  bidetType: bidetTypeSchema,
  hasTissue: z.boolean(),
  hasSoap: z.boolean(),
  hasHandDrying: z.boolean(),
  accessCost: accessCostSchema,
  accessScope: accessScopeSchema,
  photos: z.array(photoUploadSchema).max(3).default([]),
});

export const verifyRestroomInputSchema = z.object({
  restroomId: z.string().uuid(),
});

export const verifyRestroomResultSchema = z.object({
  restroomId: z.string().uuid(),
  verifyCount: z.number().int().nonnegative(),
  communityVerified: z.boolean(),
});

export const upsertReviewInputSchema = z.object({
  restroomId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
  cleanlinessOk: z.boolean().nullable().optional(),
  amenitiesOk: z.boolean().nullable().optional(),
  accessOk: z.boolean().nullable().optional(),
  photos: z.array(photoUploadSchema).max(3).default([]),
});

export const reportRestroomInputSchema = z.object({
  restroomId: z.string().uuid(),
  reason: reportReasonSchema,
  details: z.string().nullable().optional(),
});

export const reportSchema = z.object({
  id: z.string().uuid(),
  restroomId: z.string().uuid(),
  reason: reportReasonSchema,
  details: z.string().nullable(),
  status: reportStatusSchema,
  createdAt: z.string().datetime(),
});

export const deleteRestroomInputSchema = z.object({
  restroomId: z.string().uuid(),
});

export const updateRestroomInputSchema = z.object({
  restroomId: z.string().uuid(),
  floorArea: z.string().nullable().optional(),
  restroomLabel: z.string().nullable().optional(),
  bidetType: bidetTypeSchema.optional(),
  hasTissue: z.boolean().optional(),
  hasSoap: z.boolean().optional(),
  hasHandDrying: z.boolean().optional(),
  accessCost: accessCostSchema.optional(),
  accessScope: accessScopeSchema.optional(),
});

export const adminUpsertRestroomInputSchema = addRestroomInputSchema.extend({
  restroomId: z.string().uuid().optional(),
  status: restroomStatusSchema.optional(),
});

export const adminSetStatusInputSchema = z.object({
  restroomId: z.string().uuid(),
  status: restroomStatusSchema,
});

export const adminMergeInputSchema = z.object({
  loserId: z.string().uuid(),
  survivorId: z.string().uuid(),
});

export const adminRemovePhotoInputSchema = z.object({
  photoId: z.string().uuid(),
  kind: z.enum(["restroom", "review"]),
});

export const myContributionSchema = z.object({
  restroomId: z.string().uuid(),
  name: z.string(),
  kind: z.enum(["created", "verified"]),
  createdAt: z.string().datetime(),
});

export const openReportSchema = reportSchema.extend({
  restroomName: z.string(),
  reporterDisplayName: z.string(),
});

export type BidetType = z.infer<typeof bidetTypeSchema>;
export type AccessCost = z.infer<typeof accessCostSchema>;
export type AccessScope = z.infer<typeof accessScopeSchema>;
export type RestroomStatus = z.infer<typeof restroomStatusSchema>;
export type ReportReason = z.infer<typeof reportReasonSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type PinVariant = z.infer<typeof pinVariantSchema>;

export type ListNearbyInput = z.input<typeof listNearbyInputSchema>;
export type ListNearbyParsed = z.output<typeof listNearbyInputSchema>;
export type NearbyRestroom = z.infer<typeof nearbyRestroomSchema>;
export type GetRestroomInput = z.infer<typeof getRestroomInputSchema>;
export type Establishment = z.infer<typeof establishmentSchema>;
export type RestroomDetail = z.infer<typeof restroomDetailSchema>;
export type ListSiblingsInput = z.infer<typeof listSiblingsInputSchema>;
export type SiblingRestroom = z.infer<typeof siblingRestroomSchema>;
export type SearchPlacesInput = z.infer<typeof searchPlacesInputSchema>;
export type PlaceSuggestion = z.infer<typeof placeSuggestionSchema>;
export type FindExistingForPlaceInput = z.infer<
  typeof findExistingForPlaceInputSchema
>;
export type AddRestroomInput = z.input<typeof addRestroomInputSchema>;
export type VerifyRestroomInput = z.infer<typeof verifyRestroomInputSchema>;
export type VerifyRestroomResult = z.infer<typeof verifyRestroomResultSchema>;
export type UpsertReviewInput = z.input<typeof upsertReviewInputSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type ReportRestroomInput = z.infer<typeof reportRestroomInputSchema>;
export type Report = z.infer<typeof reportSchema>;
export type DeleteRestroomInput = z.infer<typeof deleteRestroomInputSchema>;
export type UpdateRestroomInput = z.infer<typeof updateRestroomInputSchema>;
export type AdminUpsertRestroomInput = z.input<
  typeof adminUpsertRestroomInputSchema
>;
export type AdminSetStatusInput = z.infer<typeof adminSetStatusInputSchema>;
export type AdminMergeInput = z.infer<typeof adminMergeInputSchema>;
export type AdminRemovePhotoInput = z.infer<typeof adminRemovePhotoInputSchema>;
export type MyContribution = z.infer<typeof myContributionSchema>;
export type OpenReport = z.infer<typeof openReportSchema>;
export type LatLng = z.infer<typeof latLngSchema>;
export type PhotoUpload = z.infer<typeof photoUploadSchema>;
