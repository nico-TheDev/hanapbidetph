import { loginHref } from "@/lib/auth/return-path";
import type { Review } from "@/lib/restroom-directory/schemas";

/** APPFLOW empty state for listings with no reviews. */
export const REVIEWS_EMPTY_COPY =
  "No feedback yet — be the first to rate" as const;

export const REVIEWS_EMPTY_SIGN_IN_HINT =
  "Sign in to rate this restroom." as const;

export const REVIEWS_EMPTY_SIGN_IN_CTA = "Sign in" as const;

export const REVIEWS_SECTION_TITLE = "Recent feedback" as const;

export type ReviewCheckboxChip = {
  id: "cleanliness" | "amenities" | "access";
  label: string;
  ok: boolean;
};

export type ReviewFeedPhoto = {
  id: string;
  publicUrl: string;
};

export type ReviewFeedItem = {
  id: string;
  authorDisplayName: string;
  stars: number;
  /** Filled star count for aria / display (1–5). */
  starLabels: string;
  checkboxChips: ReviewCheckboxChip[];
  comment: string | null;
  photos: ReviewFeedPhoto[];
  createdAt: string;
};

export type ReviewsFeedView = {
  title: typeof REVIEWS_SECTION_TITLE;
  items: ReviewFeedItem[];
  isEmpty: boolean;
  emptyCopy: typeof REVIEWS_EMPTY_COPY;
  /** Anonymous empty state: link to login preserving listing return path. */
  showSignInHint: boolean;
  signInHint: typeof REVIEWS_EMPTY_SIGN_IN_HINT | null;
  signInCta: typeof REVIEWS_EMPTY_SIGN_IN_CTA | null;
  signInHref: string | null;
};

const CHECKBOX_DEFS: Array<{
  id: ReviewCheckboxChip["id"];
  label: string;
  key: "cleanlinessOk" | "amenitiesOk" | "accessOk";
}> = [
  { id: "cleanliness", label: "Cleanliness", key: "cleanlinessOk" },
  { id: "amenities", label: "Amenities", key: "amenitiesOk" },
  { id: "access", label: "Access", key: "accessOk" },
];

/** Star glyph string for scannable read-only display (e.g. "★★★★☆"). */
export function formatStarLabels(stars: number): string {
  const filled = Math.min(5, Math.max(0, Math.round(stars)));
  return `${"★".repeat(filled)}${"☆".repeat(5 - filled)}`;
}

/** Checkbox summary chips — omit unanswered (null) categories. */
export function checkboxChipsFromReview(
  review: Pick<Review, "cleanlinessOk" | "amenitiesOk" | "accessOk">,
): ReviewCheckboxChip[] {
  const chips: ReviewCheckboxChip[] = [];
  for (const def of CHECKBOX_DEFS) {
    const value = review[def.key];
    if (value === null) {
      continue;
    }
    chips.push({
      id: def.id,
      label: value ? def.label : `${def.label} needs work`,
      ok: value,
    });
  }
  return chips;
}

export function toReviewFeedItem(review: Review): ReviewFeedItem {
  const photos = review.photos
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((photo) => ({ id: photo.id, publicUrl: photo.publicUrl }));

  return {
    id: review.id,
    authorDisplayName: review.author.displayName,
    stars: review.stars,
    starLabels: formatStarLabels(review.stars),
    checkboxChips: checkboxChipsFromReview(review),
    comment: review.comment,
    photos,
    createdAt: review.createdAt,
  };
}

/**
 * Read-only reviews feed for listing detail (ticket 31).
 * Newest-first; empty state is auth-gated for anonymous users.
 * Submit/refresh after upsert is ticket 33.
 */
export function toReviewsFeedView(input: {
  reviews: Review[];
  listingId: string;
  isSignedIn: boolean;
}): ReviewsFeedView {
  const items = input.reviews
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map(toReviewFeedItem);

  const isEmpty = items.length === 0;
  const showSignInHint = isEmpty && !input.isSignedIn;

  return {
    title: REVIEWS_SECTION_TITLE,
    items,
    isEmpty,
    emptyCopy: REVIEWS_EMPTY_COPY,
    showSignInHint,
    signInHint: showSignInHint ? REVIEWS_EMPTY_SIGN_IN_HINT : null,
    signInCta: showSignInHint ? REVIEWS_EMPTY_SIGN_IN_CTA : null,
    signInHref: showSignInHint
      ? loginHref(`/restrooms/${input.listingId}`)
      : null,
  };
}
