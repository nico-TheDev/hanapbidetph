"use server";

import { loginHref } from "@/lib/auth/return-path";
import { getExploreDirectory } from "@/lib/explore/directory";
import {
  REPORT_ERROR_COPY,
  reportReturnPath,
} from "@/lib/explore/detail-report";
import type { DirectoryError } from "@/lib/restroom-directory/restroom-directory";
import type {
  Report,
  ReportReason,
} from "@/lib/restroom-directory/schemas";

export type ReportRestroomActionInput = {
  restroomId: string;
  reason: ReportReason;
  details: string | null;
};

export type ReportRestroomActionResult =
  | {
      ok: true;
      report: Report;
      isDisputed: true;
    }
  | {
      ok: false;
      error: DirectoryError | "failed";
      message: string;
      loginHref?: string;
    };

/**
 * Auth-gated report for listing detail (ticket 34).
 * Successful report opens an admin queue item and marks the listing disputed.
 */
export async function reportRestroomAction(
  input: ReportRestroomActionInput,
): Promise<ReportRestroomActionResult> {
  const directory = await getExploreDirectory();
  const result = await directory.reportRestroom({
    restroomId: input.restroomId,
    reason: input.reason,
    details: input.details,
  });

  if (result.ok) {
    return {
      ok: true,
      report: result.value,
      isDisputed: true,
    };
  }

  if (result.error === "unauthenticated") {
    return {
      ok: false,
      error: "unauthenticated",
      message: "Sign in to report this restroom.",
      loginHref: loginHref(reportReturnPath(input.restroomId)),
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
      message: REPORT_ERROR_COPY,
    };
  }

  return {
    ok: false,
    error: "failed",
    message: REPORT_ERROR_COPY,
  };
}
