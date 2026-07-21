import { formatListingDistance } from "@/lib/explore/radius";
import type {
  BidetType,
  NearbyRestroom,
  RestroomDetail,
  SiblingRestroom,
} from "@/lib/restroom-directory/schemas";

export const MAPS_CTA_LABEL = "Open in Google Maps" as const;

export const COMMUNITY_VERIFIED_LABEL = "Community verified" as const;
export const UNVERIFIED_LABEL = "Not community verified yet" as const;

export const PHOTO_PLACEHOLDER_LABEL = "No photos yet" as const;

export type MapsPlatform = "ios" | "other";

export type DetailAmenityChip = {
  id: string;
  label: string;
};

export type DetailPhotoView = {
  id: string;
  publicUrl: string;
};

export type DetailSiblingRow = {
  id: string;
  title: string;
  hasBidet: boolean;
  communityVerified: boolean;
  ratingLabel: string | null;
};

export type DetailContentView = {
  listingId: string;
  establishmentName: string;
  formattedAddress: string | null;
  floorArea: string | null;
  restroomLabel: string | null;
  /** Combined floor · label for scannable hierarchy. */
  locationLine: string | null;
  distanceLabel: string | null;
  communityVerified: boolean;
  trustLabel: typeof COMMUNITY_VERIFIED_LABEL | typeof UNVERIFIED_LABEL;
  ratingAvg: number | null;
  ratingCount: number;
  ratingLabel: string | null;
  amenityChips: DetailAmenityChip[];
  photos: DetailPhotoView[];
  showPhotoPlaceholder: boolean;
  mapsUrl: string;
  mapsCtaLabel: typeof MAPS_CTA_LABEL;
  siblings: DetailSiblingRow[];
  lat: number;
  lng: number;
};

const BIDET_TYPE_LABEL: Record<BidetType, string> = {
  none: "No bidet",
  manual_spray: "Manual spray",
  high_pressure: "High pressure",
  built_in: "Built-in bidet",
};

/**
 * External navigation handoff. iOS → Apple Maps; otherwise Google Maps directions.
 * CTA copy stays "Open in Google Maps" per spec.
 */
export function mapsHandoffUrl(
  lat: number,
  lng: number,
  platform: MapsPlatform = "other",
): string {
  if (platform === "ios") {
    return `https://maps.apple.com/?daddr=${lat},${lng}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function detectMapsPlatform(userAgent: string): MapsPlatform {
  return /iPhone|iPad|iPod/i.test(userAgent) ? "ios" : "other";
}

/** Distance from the matching nearby row when user location is known. */
export function resolveDetailDistanceLabel(
  nearby: NearbyRestroom | undefined,
  distancesAvailable: boolean,
): string | null {
  if (!nearby) {
    return null;
  }
  return formatListingDistance(nearby.distanceMeters, distancesAvailable);
}

export function formatRatingSummary(
  ratingAvg: number | null,
  ratingCount: number,
): string | null {
  if (ratingCount <= 0 || ratingAvg === null) {
    return null;
  }
  const avg =
    Number.isInteger(ratingAvg) ? String(ratingAvg) : ratingAvg.toFixed(1);
  const noun = ratingCount === 1 ? "rating" : "ratings";
  return `${avg} · ${ratingCount} ${noun}`;
}

export function siblingTitle(sibling: SiblingRestroom): string {
  const parts = [sibling.floorArea, sibling.restroomLabel].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  if (parts.length > 0) {
    return parts.join(" · ");
  }
  return "Restroom";
}

export function amenityChipsFromDetail(
  detail: RestroomDetail,
): DetailAmenityChip[] {
  const chips: DetailAmenityChip[] = [
    { id: "bidetType", label: BIDET_TYPE_LABEL[detail.bidetType] },
  ];

  if (detail.hasTissue) {
    chips.push({ id: "hasTissue", label: "Tissue" });
  }
  if (detail.hasSoap) {
    chips.push({ id: "hasSoap", label: "Soap" });
  }
  if (detail.hasHandDrying) {
    chips.push({ id: "hasHandDrying", label: "Hand drying" });
  }

  chips.push({
    id: "accessCost",
    label: detail.accessCost === "free" ? "Free" : "Paid",
  });
  chips.push({
    id: "accessScope",
    label:
      detail.accessScope === "public" ? "Public" : "Needs patronage",
  });

  return chips;
}

export function locationLineFromDetail(
  floorArea: string | null,
  restroomLabel: string | null,
): string | null {
  const parts = [floorArea, restroomLabel].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function toDetailSiblingRows(
  siblings: SiblingRestroom[],
): DetailSiblingRow[] {
  return siblings.map((sibling) => ({
    id: sibling.id,
    title: siblingTitle(sibling),
    hasBidet: sibling.hasBidet,
    communityVerified: sibling.communityVerified,
    ratingLabel: formatRatingSummary(sibling.ratingAvg, sibling.ratingCount),
  }));
}

/**
 * View model for listing detail content (ticket 30).
 * Reviews feed is ticket 31; verify·rate·report CTAs are later.
 */
export function toDetailContentView(input: {
  detail: RestroomDetail;
  siblings: SiblingRestroom[];
  nearby?: NearbyRestroom;
  distancesAvailable: boolean;
  mapsPlatform?: MapsPlatform;
}): DetailContentView {
  const { detail, siblings, nearby, distancesAvailable } = input;
  const mapsPlatform = input.mapsPlatform ?? "other";
  const photos = detail.photos
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((photo) => ({ id: photo.id, publicUrl: photo.publicUrl }));

  return {
    listingId: detail.id,
    establishmentName: detail.establishment.name,
    formattedAddress: detail.establishment.formattedAddress,
    floorArea: detail.floorArea,
    restroomLabel: detail.restroomLabel,
    locationLine: locationLineFromDetail(
      detail.floorArea,
      detail.restroomLabel,
    ),
    distanceLabel: resolveDetailDistanceLabel(nearby, distancesAvailable),
    communityVerified: detail.communityVerified,
    trustLabel: detail.communityVerified
      ? COMMUNITY_VERIFIED_LABEL
      : UNVERIFIED_LABEL,
    ratingAvg: detail.ratingAvg,
    ratingCount: detail.ratingCount,
    ratingLabel: formatRatingSummary(detail.ratingAvg, detail.ratingCount),
    amenityChips: amenityChipsFromDetail(detail),
    photos,
    showPhotoPlaceholder: photos.length === 0,
    mapsUrl: mapsHandoffUrl(
      detail.establishment.lat,
      detail.establishment.lng,
      mapsPlatform,
    ),
    mapsCtaLabel: MAPS_CTA_LABEL,
    siblings: toDetailSiblingRows(siblings),
    lat: detail.establishment.lat,
    lng: detail.establishment.lng,
  };
}
