"use server";

import { revalidatePath } from "next/cache";

import type { AdminRestroomSummary } from "@/lib/restroom-directory";
import type { DirectoryError } from "@/lib/restroom-directory/restroom-directory";

import { parseAdminUpsertForm, saveAdminListing } from "./admin-listings";
import { getRestroomDirectory } from "./directory";

export type AdminListingsActionState = {
  ok: boolean;
  error?: DirectoryError | "unknown";
  message?: string;
  savedId?: string;
};

export async function loadAdminListingsAction(): Promise<
  AdminRestroomSummary[]
> {
  const directory = await getRestroomDirectory();
  const result = await directory.listAdminRestrooms();
  if (!result.ok) {
    return [];
  }
  return result.value;
}

export async function upsertAdminListingAction(
  _prev: AdminListingsActionState,
  formData: FormData,
): Promise<AdminListingsActionState> {
  const parsed = parseAdminUpsertForm(formData);
  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error,
      message: "Check the form fields and try again.",
    };
  }

  const directory = await getRestroomDirectory();
  const saved = await saveAdminListing(directory, parsed.value);
  if (!saved.ok) {
    return {
      ok: false,
      error: saved.error,
      message: actionErrorMessage(saved.error),
    };
  }

  revalidatePath("/admin/listings");
  return {
    ok: true,
    savedId: saved.value.id,
    message: parsed.value.restroomId
      ? "Listing updated."
      : "Listing seeded.",
  };
}

function actionErrorMessage(error: DirectoryError): string {
  switch (error) {
    case "unauthenticated":
      return "Sign in as an admin to continue.";
    case "forbidden":
      return "Admin access required.";
    case "not_found":
      return "That listing was not found.";
    case "validation_error":
      return "Check the form fields and try again.";
    default:
      return "Could not save the listing.";
  }
}
