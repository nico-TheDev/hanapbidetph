"use server";

import { revalidatePath } from "next/cache";

import type { OpenReport } from "@/lib/restroom-directory";
import type { DirectoryError } from "@/lib/restroom-directory/restroom-directory";

import {
  parseResolveReportForm,
  resolveOpenReport,
} from "./admin-reports";
import { getRestroomDirectory } from "./directory";

export type AdminReportsActionState = {
  ok: boolean;
  error?: DirectoryError | "unknown";
  message?: string;
};

export async function loadOpenReportsAction(): Promise<OpenReport[]> {
  const directory = await getRestroomDirectory();
  const result = await directory.listOpenReports();
  if (!result.ok) {
    return [];
  }
  return result.value;
}

export async function resolveReportAction(
  _prev: AdminReportsActionState,
  formData: FormData,
): Promise<AdminReportsActionState> {
  const parsed = parseResolveReportForm(formData);
  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error,
      message: "Check the report action and try again.",
    };
  }

  const directory = await getRestroomDirectory();
  const resolved = await resolveOpenReport(directory, parsed.value);
  if (!resolved.ok) {
    return {
      ok: false,
      error: resolved.error,
      message: actionErrorMessage(resolved.error),
    };
  }

  revalidatePath("/admin/reports");
  return {
    ok: true,
    message:
      parsed.value.action === "dismiss"
        ? "Report dismissed."
        : "Report reviewed and listing status updated.",
  };
}

function actionErrorMessage(error: DirectoryError): string {
  switch (error) {
    case "unauthenticated":
      return "Sign in as an admin to continue.";
    case "forbidden":
      return "Admin access required.";
    case "not_found":
      return "That report or listing was not found.";
    case "validation_error":
      return "Check the report action and try again.";
    default:
      return "Could not update the report.";
  }
}
