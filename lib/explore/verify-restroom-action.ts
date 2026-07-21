"use server";

import { loginHref } from "@/lib/auth/return-path";
import { getExploreDirectory } from "@/lib/explore/directory";
import {
  VERIFY_ERROR_COPY,
  verifyReturnPath,
} from "@/lib/explore/detail-verify";
import type { DirectoryError } from "@/lib/restroom-directory/restroom-directory";

export type VerifyRestroomActionResult =
  | {
      ok: true;
      restroomId: string;
      verifyCount: number;
      communityVerified: boolean;
      alreadyVerified: boolean;
    }
  | {
      ok: false;
      error: DirectoryError | "failed";
      message: string;
      loginHref?: string;
    };

/**
 * Auth-gated verify for listing detail (ticket 32).
 * Conflict → already-verified with current trust aggregates.
 */
export async function verifyRestroomAction(
  restroomId: string,
): Promise<VerifyRestroomActionResult> {
  const directory = await getExploreDirectory();
  const result = await directory.verifyRestroom({ restroomId });

  if (result.ok) {
    return {
      ok: true,
      restroomId: result.value.restroomId,
      verifyCount: result.value.verifyCount,
      communityVerified: result.value.communityVerified,
      alreadyVerified: false,
    };
  }

  if (result.error === "unauthenticated") {
    return {
      ok: false,
      error: "unauthenticated",
      message: "Sign in to verify this restroom.",
      loginHref: loginHref(verifyReturnPath(restroomId)),
    };
  }

  if (result.error === "conflict") {
    const detail = await directory.getRestroom({ id: restroomId });
    if (!detail.ok) {
      return {
        ok: false,
        error: detail.error === "not_found" ? "not_found" : "failed",
        message: VERIFY_ERROR_COPY,
      };
    }
    return {
      ok: true,
      restroomId,
      verifyCount: detail.value.verifyCount,
      communityVerified: detail.value.communityVerified,
      alreadyVerified: true,
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
      message: VERIFY_ERROR_COPY,
    };
  }

  return {
    ok: false,
    error: "failed",
    message: VERIFY_ERROR_COPY,
  };
}
