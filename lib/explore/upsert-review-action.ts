"use server";

import { loginHref } from "@/lib/auth/return-path";
import { getExploreDirectory } from "@/lib/explore/directory";
import {
  RATE_ERROR_COPY,
  rateReturnPath,
} from "@/lib/explore/detail-rate";
import type { DirectoryError } from "@/lib/restroom-directory/restroom-directory";
import type { Review } from "@/lib/restroom-directory/schemas";

export type UpsertReviewActionPhoto = {
  base64: string;
  contentType: string;
};

export type UpsertReviewActionInput = {
  restroomId: string;
  stars: number;
  comment: string | null;
  cleanlinessOk: boolean | null;
  amenitiesOk: boolean | null;
  accessOk: boolean | null;
  photos: UpsertReviewActionPhoto[];
};

export type UpsertReviewActionResult =
  | {
      ok: true;
      review: Review;
      ratingAvg: number | null;
      ratingCount: number;
    }
  | {
      ok: false;
      error: DirectoryError | "failed";
      message: string;
      loginHref?: string;
    };

function decodePhotos(
  photos: UpsertReviewActionPhoto[],
): Array<{ data: Uint8Array; contentType: string }> {
  // Do not truncate — schema max(3) must reject oversize payloads.
  return photos.map((photo) => ({
    data: Uint8Array.from(Buffer.from(photo.base64, "base64")),
    contentType: photo.contentType,
  }));
}

/**
 * Auth-gated review upsert for listing detail (ticket 33).
 * Returns the saved review plus refreshed rating aggregates.
 */
export async function upsertReviewAction(
  input: UpsertReviewActionInput,
): Promise<UpsertReviewActionResult> {
  const directory = await getExploreDirectory();
  const result = await directory.upsertReview({
    restroomId: input.restroomId,
    stars: input.stars,
    comment: input.comment,
    cleanlinessOk: input.cleanlinessOk,
    amenitiesOk: input.amenitiesOk,
    accessOk: input.accessOk,
    photos: decodePhotos(input.photos),
  });

  if (result.ok) {
    const detail = await directory.getRestroom({ id: input.restroomId });
    if (!detail.ok) {
      return {
        ok: true,
        review: result.value,
        ratingAvg: null,
        ratingCount: 0,
      };
    }
    return {
      ok: true,
      review: result.value,
      ratingAvg: detail.value.ratingAvg,
      ratingCount: detail.value.ratingCount,
    };
  }

  if (result.error === "unauthenticated") {
    return {
      ok: false,
      error: "unauthenticated",
      message: "Sign in to rate this restroom.",
      loginHref: loginHref(rateReturnPath(input.restroomId)),
    };
  }

  if (result.error === "not_found") {
    return {
      ok: false,
      error: "not_found",
      message: "This listing is no longer available.",
    };
  }

  if (result.error === "validation_error") {
    return {
      ok: false,
      error: "validation_error",
      message: RATE_ERROR_COPY,
    };
  }

  return {
    ok: false,
    error: "failed",
    message: RATE_ERROR_COPY,
  };
}
