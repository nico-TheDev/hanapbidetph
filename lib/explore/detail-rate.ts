import { loginHref } from "@/lib/auth/return-path";
import type { Review } from "@/lib/restroom-directory/schemas";

/** Ticket 33 — Rate / review form on listing detail. */
export const RATE_CTA_LABEL = "Rate this CR" as const;
export const RATE_EDIT_CTA_LABEL = "Edit your rating" as const;
export const RATE_FORM_TITLE_CREATE = "Rate this restroom" as const;
export const RATE_FORM_TITLE_EDIT = "Edit your rating" as const;
export const RATE_SUBMIT_LABEL = "Submit rating" as const;
export const RATE_ERROR_COPY =
  "Couldn’t save your rating. Try again." as const;

export type RateFormMode = "gated" | "create" | "edit";

export type RateFormValues = {
  stars: number | null;
  comment: string;
  cleanlinessOk: boolean | null;
  amenitiesOk: boolean | null;
  accessOk: boolean | null;
};

export type RateFormExistingPhoto = {
  id: string;
  publicUrl: string;
};

export type RateFormView = {
  listingId: string;
  mode: RateFormMode;
  ctaLabel: typeof RATE_CTA_LABEL | typeof RATE_EDIT_CTA_LABEL;
  formTitle: typeof RATE_FORM_TITLE_CREATE | typeof RATE_FORM_TITLE_EDIT;
  submitLabel: typeof RATE_SUBMIT_LABEL;
  formVisible: boolean;
  canSubmit: boolean;
  loginHref: string | null;
  values: RateFormValues;
  existingPhotos: RateFormExistingPhoto[];
  attributionPreview: string | null;
  errorMessage: string | null;
  showRetry: boolean;
  pending: boolean;
};

const EMPTY_VALUES: RateFormValues = {
  stars: null,
  comment: "",
  cleanlinessOk: null,
  amenitiesOk: null,
  accessOk: null,
};

/** Interrupted-flow return path for auth-gate (ticket 09). */
export function rateReturnPath(listingId: string): string {
  return `/restrooms/${listingId}?action=rate`;
}

/** True when deep-link / OAuth return should open the rate form. */
export function shouldOpenRateForm(action: string | null | undefined): boolean {
  return action === "rate";
}

export function findViewerReview(
  reviews: Review[],
  viewerUserId: string | null | undefined,
): Review | null {
  if (!viewerUserId) {
    return null;
  }
  return reviews.find((review) => review.author.userId === viewerUserId) ?? null;
}

export function formValuesFromReview(review: Review): RateFormValues {
  return {
    stars: review.stars,
    comment: review.comment ?? "",
    cleanlinessOk: review.cleanlinessOk,
    amenitiesOk: review.amenitiesOk,
    accessOk: review.accessOk,
  };
}

/**
 * View model for the Rate CTA + form (ticket 33).
 * Guests are auth-gated; signed-in users create or edit one review per listing.
 */
export function toRateFormView(input: {
  listingId: string;
  isSignedIn: boolean;
  viewerUserId: string | null;
  reviews: Review[];
  open: boolean;
  attributionDisplayName?: string | null;
  errorMessage?: string | null;
  pending?: boolean;
}): RateFormView {
  const errorMessage = input.errorMessage ?? null;
  const pending = Boolean(input.pending);
  const existing = findViewerReview(input.reviews, input.viewerUserId);
  const isEdit = Boolean(existing);
  const values = existing ? formValuesFromReview(existing) : EMPTY_VALUES;
  const existingPhotos =
    existing?.photos
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({ id: photo.id, publicUrl: photo.publicUrl })) ?? [];

  if (!input.isSignedIn) {
    return {
      listingId: input.listingId,
      mode: "gated",
      ctaLabel: RATE_CTA_LABEL,
      formTitle: RATE_FORM_TITLE_CREATE,
      submitLabel: RATE_SUBMIT_LABEL,
      formVisible: false,
      canSubmit: false,
      loginHref: loginHref(rateReturnPath(input.listingId)),
      values: EMPTY_VALUES,
      existingPhotos: [],
      attributionPreview: null,
      errorMessage,
      showRetry: Boolean(errorMessage),
      pending: false,
    };
  }

  const attributionPreview = input.attributionDisplayName
    ? `Posting as ${input.attributionDisplayName}`
    : null;

  return {
    listingId: input.listingId,
    mode: isEdit ? "edit" : "create",
    ctaLabel: isEdit ? RATE_EDIT_CTA_LABEL : RATE_CTA_LABEL,
    formTitle: isEdit ? RATE_FORM_TITLE_EDIT : RATE_FORM_TITLE_CREATE,
    submitLabel: RATE_SUBMIT_LABEL,
    formVisible: input.open,
    canSubmit: !pending,
    loginHref: null,
    values,
    existingPhotos,
    attributionPreview,
    errorMessage,
    showRetry: Boolean(errorMessage),
    pending,
  };
}

/** Merge an upserted review into local detail state (newest-first friendly). */
export function applyReviewUpsertToDetail(input: {
  reviews: Review[];
  ratingAvg: number | null;
  ratingCount: number;
  review: Review;
  ratingAvgAfter: number | null;
  ratingCountAfter: number;
}): {
  reviews: Review[];
  ratingAvg: number | null;
  ratingCount: number;
} {
  const withoutSelf = input.reviews.filter(
    (review) => review.id !== input.review.id,
  );
  return {
    reviews: [input.review, ...withoutSelf],
    ratingAvg: input.ratingAvgAfter,
    ratingCount: input.ratingCountAfter,
  };
}
