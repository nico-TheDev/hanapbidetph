import type { AdminRestroomSummary, RestroomStatus } from "@/lib/restroom-directory";

export type AdminListingFormValues = {
  restroomId: string;
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: string;
  lng: string;
  floorArea: string;
  restroomLabel: string;
  bidetType: string;
  hasTissue: boolean;
  hasSoap: boolean;
  hasHandDrying: boolean;
  accessCost: string;
  accessScope: string;
  status: RestroomStatus;
};

export const EMPTY_LISTING_FORM: AdminListingFormValues = {
  restroomId: "",
  placeId: "",
  name: "",
  formattedAddress: "",
  lat: "",
  lng: "",
  floorArea: "",
  restroomLabel: "",
  bidetType: "manual_spray",
  hasTissue: true,
  hasSoap: true,
  hasHandDrying: false,
  accessCost: "free",
  accessScope: "public",
  status: "active",
};

export function listingToFormValues(
  listing: AdminRestroomSummary,
): AdminListingFormValues {
  return {
    restroomId: listing.id,
    placeId: listing.placeId,
    name: listing.name,
    formattedAddress: listing.formattedAddress ?? "",
    lat: String(listing.lat),
    lng: String(listing.lng),
    floorArea: listing.floorArea ?? "",
    restroomLabel: listing.restroomLabel ?? "",
    bidetType: listing.bidetType,
    hasTissue: listing.hasTissue,
    hasSoap: listing.hasSoap,
    hasHandDrying: listing.hasHandDrying,
    accessCost: listing.accessCost,
    accessScope: listing.accessScope,
    status: listing.status,
  };
}

export function statusLabel(status: RestroomStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "disputed":
      return "Disputed";
    case "closed":
      return "Closed";
    case "archived":
      return "Archived";
  }
}
