import { describe, expect, it } from "vitest";

import { formatRatingSummary } from "@/lib/explore/detail-content";
import {
  toReviewFeedItem,
  toReviewsFeedView,
} from "@/lib/explore/detail-reviews";
import {
  RATE_CTA_LABEL,
  RATE_EDIT_CTA_LABEL,
  RATE_ERROR_COPY,
  RATE_FORM_TITLE_CREATE,
  RATE_FORM_TITLE_EDIT,
  RATE_SUBMIT_LABEL,
  applyReviewUpsertToDetail,
  findViewerReview,
  formValuesFromReview,
  rateReturnPath,
  shouldOpenRateForm,
  toRateFormView,
} from "./detail-rate";
import type { Review } from "@/lib/restroom-directory/schemas";

const LISTING_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const REVIEW_A = "r1111111-1111-4111-8111-111111111111";
const REVIEW_B = "r2222222-2222-4222-8222-222222222222";
const USER_A = "a1111111-1111-4111-8111-111111111111";
const USER_B = "b2222222-2222-4222-8222-222222222222";

function baseReview(overrides: Partial<Review> = {}): Review {
  return {
    id: REVIEW_A,
    restroomId: LISTING_ID,
    stars: 4,
    comment: "Decent spray",
    cleanlinessOk: true,
    amenitiesOk: true,
    accessOk: null,
    createdAt: "2026-01-08T08:00:00.000Z",
    updatedAt: "2026-01-08T08:00:00.000Z",
    author: {
      userId: USER_A,
      displayName: "Alice A.",
      avatarUrl: null,
    },
    photos: [],
    ...overrides,
  };
}

describe("33 — Rate/review form on listing detail", () => {
  it("gates anonymous users through auth-gate before showing submit", () => {
    const view = toRateFormView({
      listingId: LISTING_ID,
      isSignedIn: false,
      viewerUserId: null,
      reviews: [],
      open: false,
    });

    expect(view.mode).toBe("gated");
    expect(view.ctaLabel).toBe(RATE_CTA_LABEL);
    expect(view.formVisible).toBe(false);
    expect(view.canSubmit).toBe(false);
    expect(view.loginHref).toBe(
      `/login?next=${encodeURIComponent(rateReturnPath(LISTING_ID))}`,
    );
    expect(rateReturnPath(LISTING_ID)).toBe(
      `/restrooms/${LISTING_ID}?action=rate`,
    );
    expect(shouldOpenRateForm("rate")).toBe(true);
    expect(shouldOpenRateForm("verify")).toBe(false);
  });

  it("opens create form for signed-in users who have not reviewed", () => {
    const view = toRateFormView({
      listingId: LISTING_ID,
      isSignedIn: true,
      viewerUserId: USER_A,
      reviews: [baseReview({ author: { userId: USER_B, displayName: "Bob B.", avatarUrl: null } })],
      open: true,
    });

    expect(view.mode).toBe("create");
    expect(view.formVisible).toBe(true);
    expect(view.formTitle).toBe(RATE_FORM_TITLE_CREATE);
    expect(view.submitLabel).toBe(RATE_SUBMIT_LABEL);
    expect(view.canSubmit).toBe(true);
    expect(view.values).toEqual({
      stars: null,
      comment: "",
      cleanlinessOk: null,
      amenitiesOk: null,
      accessOk: null,
    });
    expect(view.existingPhotos).toEqual([]);
    expect(view.attributionPreview).toBeNull();
  });

  it("opens edit form prefilled when the viewer already reviewed", () => {
    const existing = baseReview({
      stars: 3,
      comment: "Needs soap",
      cleanlinessOk: false,
      amenitiesOk: true,
      accessOk: null,
      photos: [
        {
          id: "p1111111-1111-4111-8111-111111111111",
          storagePath: `${REVIEW_A}/p.webp`,
          publicUrl: "https://cdn.example/p.webp",
          sortOrder: 0,
        },
      ],
    });

    expect(findViewerReview([existing], USER_A)?.id).toBe(REVIEW_A);
    expect(formValuesFromReview(existing)).toEqual({
      stars: 3,
      comment: "Needs soap",
      cleanlinessOk: false,
      amenitiesOk: true,
      accessOk: null,
    });

    const view = toRateFormView({
      listingId: LISTING_ID,
      isSignedIn: true,
      viewerUserId: USER_A,
      reviews: [existing],
      open: true,
      attributionDisplayName: "Alice A.",
    });

    expect(view.mode).toBe("edit");
    expect(view.ctaLabel).toBe(RATE_EDIT_CTA_LABEL);
    expect(view.formTitle).toBe(RATE_FORM_TITLE_EDIT);
    expect(view.values.stars).toBe(3);
    expect(view.values.comment).toBe("Needs soap");
    expect(view.values.cleanlinessOk).toBe(false);
    expect(view.existingPhotos).toEqual([
      { id: "p1111111-1111-4111-8111-111111111111", publicUrl: "https://cdn.example/p.webp" },
    ]);
    expect(view.attributionPreview).toBe("Posting as Alice A.");
  });

  it("keeps detail with retry when rate submit fails", () => {
    const view = toRateFormView({
      listingId: LISTING_ID,
      isSignedIn: true,
      viewerUserId: USER_A,
      reviews: [],
      open: true,
      errorMessage: RATE_ERROR_COPY,
    });

    expect(view.mode).toBe("create");
    expect(view.formVisible).toBe(true);
    expect(view.errorMessage).toBe(RATE_ERROR_COPY);
    expect(view.showRetry).toBe(true);
    expect(view.canSubmit).toBe(true);
  });

  it("after upsert, review appears newest-first and rating summary updates", () => {
    const older = baseReview({
      id: REVIEW_B,
      stars: 2,
      comment: "Older",
      createdAt: "2026-01-08T08:00:00.000Z",
      author: {
        userId: USER_B,
        displayName: "Bob B.",
        avatarUrl: null,
      },
    });
    const upserted = baseReview({
      id: REVIEW_A,
      stars: 5,
      comment: "Fresh",
      createdAt: "2026-01-10T12:00:00.000Z",
      updatedAt: "2026-01-10T12:00:00.000Z",
    });

    const next = applyReviewUpsertToDetail({
      reviews: [older],
      ratingAvg: 2,
      ratingCount: 1,
      review: upserted,
      ratingAvgAfter: 3.5,
      ratingCountAfter: 2,
    });

    expect(next.ratingAvg).toBe(3.5);
    expect(next.ratingCount).toBe(2);
    expect(formatRatingSummary(next.ratingAvg, next.ratingCount)).toBe(
      "3.5 · 2 ratings",
    );

    const feed = toReviewsFeedView({
      reviews: next.reviews,
      listingId: LISTING_ID,
      isSignedIn: true,
    });
    expect(feed.items.map((item) => item.id)).toEqual([REVIEW_A, REVIEW_B]);
    expect(toReviewFeedItem(upserted).comment).toBe("Fresh");
  });

  it("replaces an existing viewer review in-place on edit upsert", () => {
    const prior = baseReview({
      stars: 3,
      comment: "Old",
      createdAt: "2026-01-08T08:00:00.000Z",
      updatedAt: "2026-01-08T08:00:00.000Z",
    });
    const updated = baseReview({
      stars: 5,
      comment: "Updated",
      createdAt: "2026-01-08T08:00:00.000Z",
      updatedAt: "2026-01-11T09:00:00.000Z",
    });

    const next = applyReviewUpsertToDetail({
      reviews: [prior],
      ratingAvg: 3,
      ratingCount: 1,
      review: updated,
      ratingAvgAfter: 5,
      ratingCountAfter: 1,
    });

    expect(next.reviews).toHaveLength(1);
    expect(next.reviews[0]).toMatchObject({
      id: REVIEW_A,
      stars: 5,
      comment: "Updated",
    });
    expect(next.ratingAvg).toBe(5);
    expect(next.ratingCount).toBe(1);
  });
});
