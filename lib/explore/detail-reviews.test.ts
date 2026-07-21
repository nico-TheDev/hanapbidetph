import { describe, expect, it } from "vitest";

import {
  REVIEWS_EMPTY_COPY,
  REVIEWS_EMPTY_SIGN_IN_CTA,
  REVIEWS_EMPTY_SIGN_IN_HINT,
  REVIEWS_SECTION_TITLE,
  checkboxChipsFromReview,
  formatStarLabels,
  toReviewFeedItem,
  toReviewsFeedView,
} from "./detail-reviews";
import type { Review } from "@/lib/restroom-directory/schemas";

const LISTING_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const REVIEW_OLDER = "r1111111-1111-4111-8111-111111111111";
const REVIEW_NEWER = "r2222222-2222-4222-8222-222222222222";
const PHOTO_ID = "p1111111-1111-4111-8111-111111111111";
const USER_A = "a1111111-1111-4111-8111-111111111111";
const USER_B = "b2222222-2222-4222-8222-222222222222";

function baseReview(overrides: Partial<Review> = {}): Review {
  return {
    id: REVIEW_OLDER,
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
      displayName: "Maria S.",
      avatarUrl: null,
    },
    photos: [],
    ...overrides,
  };
}

describe("31 — Reviews feed on detail (read-only)", () => {
  it("renders reviews newest-first with attribution, stars, and comment", () => {
    const older = baseReview({
      id: REVIEW_OLDER,
      stars: 4,
      comment: "Decent",
      createdAt: "2026-01-08T08:00:00.000Z",
      author: {
        userId: USER_A,
        displayName: "Maria S.",
        avatarUrl: null,
      },
    });
    const newer = baseReview({
      id: REVIEW_NEWER,
      stars: 5,
      comment: "Great spray",
      cleanlinessOk: true,
      amenitiesOk: true,
      accessOk: true,
      createdAt: "2026-01-09T12:00:00.000Z",
      author: {
        userId: USER_B,
        displayName: "Bob B.",
        avatarUrl: null,
      },
    });

    // Intentionally unsorted input — feed must sort newest-first.
    const view = toReviewsFeedView({
      reviews: [older, newer],
      listingId: LISTING_ID,
      isSignedIn: true,
    });

    expect(view.title).toBe(REVIEWS_SECTION_TITLE);
    expect(view.isEmpty).toBe(false);
    expect(view.items.map((item) => item.id)).toEqual([
      REVIEW_NEWER,
      REVIEW_OLDER,
    ]);
    expect(view.items[0]).toMatchObject({
      authorDisplayName: "Bob B.",
      stars: 5,
      starLabels: "★★★★★",
      comment: "Great spray",
    });
    expect(view.items[1]).toMatchObject({
      authorDisplayName: "Maria S.",
      stars: 4,
      starLabels: "★★★★☆",
      comment: "Decent",
    });
    expect(formatStarLabels(3)).toBe("★★★☆☆");
  });

  it("includes checkbox summary and review photos when present", () => {
    const review = baseReview({
      cleanlinessOk: true,
      amenitiesOk: false,
      accessOk: null,
      photos: [
        {
          id: PHOTO_ID,
          storagePath: `${REVIEW_OLDER}/${PHOTO_ID}.webp`,
          publicUrl: `https://cdn.example/${REVIEW_OLDER}/${PHOTO_ID}.webp`,
          sortOrder: 0,
        },
      ],
    });

    expect(checkboxChipsFromReview(review)).toEqual([
      { id: "cleanliness", label: "Cleanliness", ok: true },
      { id: "amenities", label: "Amenities needs work", ok: false },
    ]);

    const item = toReviewFeedItem(review);
    expect(item.checkboxChips.map((c) => c.label)).toEqual([
      "Cleanliness",
      "Amenities needs work",
    ]);
    expect(item.photos).toEqual([
      {
        id: PHOTO_ID,
        publicUrl: `https://cdn.example/${REVIEW_OLDER}/${PHOTO_ID}.webp`,
      },
    ]);

    const view = toReviewsFeedView({
      reviews: [review],
      listingId: LISTING_ID,
      isSignedIn: false,
    });
    expect(view.items[0]!.photos).toHaveLength(1);
    expect(view.showSignInHint).toBe(false);
  });

  it("shows empty state that encourages first rating (auth-gated for guests)", () => {
    const guest = toReviewsFeedView({
      reviews: [],
      listingId: LISTING_ID,
      isSignedIn: false,
    });
    expect(guest.isEmpty).toBe(true);
    expect(guest.emptyCopy).toBe(REVIEWS_EMPTY_COPY);
    expect(guest.showSignInHint).toBe(true);
    expect(guest.signInHint).toBe(REVIEWS_EMPTY_SIGN_IN_HINT);
    expect(guest.signInCta).toBe(REVIEWS_EMPTY_SIGN_IN_CTA);
    expect(guest.signInHref).toBe(
      `/login?next=${encodeURIComponent(`/restrooms/${LISTING_ID}`)}`,
    );

    const signedIn = toReviewsFeedView({
      reviews: [],
      listingId: LISTING_ID,
      isSignedIn: true,
    });
    expect(signedIn.isEmpty).toBe(true);
    expect(signedIn.emptyCopy).toBe(REVIEWS_EMPTY_COPY);
    expect(signedIn.showSignInHint).toBe(false);
    expect(signedIn.signInHref).toBeNull();
  });
});
