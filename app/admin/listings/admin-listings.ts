import {
  adminUpsertRestroomInputSchema,
  type AdminUpsertRestroomInput,
  type RestroomDetail,
} from "@/lib/restroom-directory";
import type { DirectoryError } from "@/lib/restroom-directory/restroom-directory";
import type { RestroomDirectory } from "@/lib/restroom-directory/restroom-directory";
import type { Result } from "@/lib/restroom-directory/result";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string): string | null {
  const value = readString(formData, key);
  return value.length > 0 ? value : null;
}

function readCheckbox(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (value == null || value === "") return false;
  if (typeof value !== "string") return false;
  const normalized = value.toLowerCase();
  return normalized === "on" || normalized === "true" || normalized === "1";
}

function readNumber(formData: FormData, key: string): number | undefined {
  const raw = readString(formData, key);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : Number.NaN;
}

/**
 * Parses the admin listings seed/edit form into `adminUpsertRestroom` input.
 */
export function parseAdminUpsertForm(
  formData: FormData,
): Result<AdminUpsertRestroomInput, DirectoryError> {
  const restroomId = readOptionalString(formData, "restroomId") ?? undefined;
  const status = readOptionalString(formData, "status") ?? undefined;

  const candidate = {
    restroomId,
    placeId: readString(formData, "placeId"),
    name: readString(formData, "name"),
    formattedAddress: readOptionalString(formData, "formattedAddress"),
    lat: readNumber(formData, "lat"),
    lng: readNumber(formData, "lng"),
    floorArea: readOptionalString(formData, "floorArea"),
    restroomLabel: readOptionalString(formData, "restroomLabel"),
    bidetType: readString(formData, "bidetType"),
    hasTissue: readCheckbox(formData, "hasTissue"),
    hasSoap: readCheckbox(formData, "hasSoap"),
    hasHandDrying: readCheckbox(formData, "hasHandDrying"),
    accessCost: readString(formData, "accessCost"),
    accessScope: readString(formData, "accessScope"),
    status,
    photos: [],
  };

  const parsed = adminUpsertRestroomInputSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, error: "validation_error" };
  }

  return { ok: true, value: parsed.data };
}

/** Persists create/edit through the domain seam. */
export async function saveAdminListing(
  directory: RestroomDirectory,
  input: AdminUpsertRestroomInput,
): Promise<Result<RestroomDetail, DirectoryError>> {
  return directory.adminUpsertRestroom(input);
}
