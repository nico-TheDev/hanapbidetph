import {
  restroomStatusSchema,
  updateReportStatusInputSchema,
  type ReportReason,
  type RestroomStatus,
} from "@/lib/restroom-directory";
import type { DirectoryError } from "@/lib/restroom-directory/restroom-directory";
import type { RestroomDirectory } from "@/lib/restroom-directory/restroom-directory";
import type { Result } from "@/lib/restroom-directory/result";

export type ResolveReportAction = "dismiss" | "review";

export type ResolveReportInput = {
  reportId: string;
  restroomId: string;
  action: ResolveReportAction;
  /** Required when action is review. */
  listingStatus?: RestroomStatus;
};

const REASON_LABELS: Record<ReportReason, string> = {
  doesnt_exist: "Doesn't exist",
  wrong_location: "Wrong location",
  permanently_closed: "Permanently closed",
  inappropriate_photos: "Inappropriate photos",
};

export function reasonLabel(reason: ReportReason): string {
  return REASON_LABELS[reason] ?? reason;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Parses dismiss / review form posts from the admin report queue.
 */
export function parseResolveReportForm(
  formData: FormData,
): Result<ResolveReportInput, DirectoryError> {
  const reportId = readString(formData, "reportId");
  const restroomId = readString(formData, "restroomId");
  const actionRaw = readString(formData, "action");

  if (actionRaw !== "dismiss" && actionRaw !== "review") {
    return { ok: false, error: "validation_error" };
  }

  const statusParsed = updateReportStatusInputSchema.safeParse({
    reportId,
    status: actionRaw === "dismiss" ? "dismissed" : "reviewed",
  });
  if (!statusParsed.success) {
    return { ok: false, error: "validation_error" };
  }

  const restroomIdOk =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      restroomId,
    );
  if (!restroomIdOk) {
    return { ok: false, error: "validation_error" };
  }

  if (actionRaw === "dismiss") {
    return {
      ok: true,
      value: {
        reportId,
        restroomId,
        action: "dismiss",
      },
    };
  }

  const listingStatusRaw = readString(formData, "listingStatus");
  const listingStatus = restroomStatusSchema.safeParse(listingStatusRaw);
  if (!listingStatus.success) {
    return { ok: false, error: "validation_error" };
  }

  return {
    ok: true,
    value: {
      reportId,
      restroomId,
      action: "review",
      listingStatus: listingStatus.data,
    },
  };
}

/**
 * Dismisses a report, or marks it reviewed and updates listing status.
 */
export async function resolveOpenReport(
  directory: RestroomDirectory,
  input: ResolveReportInput,
): Promise<Result<void, DirectoryError>> {
  if (input.action === "dismiss") {
    return directory.updateReportStatus({
      reportId: input.reportId,
      status: "dismissed",
    });
  }

  if (!input.listingStatus) {
    return { ok: false, error: "validation_error" };
  }

  const reviewed = await directory.updateReportStatus({
    reportId: input.reportId,
    status: "reviewed",
  });
  if (!reviewed.ok) return reviewed;

  return directory.adminSetStatus({
    restroomId: input.restroomId,
    status: input.listingStatus,
  });
}
