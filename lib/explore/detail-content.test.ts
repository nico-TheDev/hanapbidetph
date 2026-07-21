import { describe, expect, it } from "vitest";

import {
  COMMUNITY_VERIFIED_LABEL,
  MAPS_CTA_LABEL,
  PHOTO_PLACEHOLDER_LABEL,
  UNVERIFIED_LABEL,
  amenityChipsFromDetail,
  detectMapsPlatform,
  formatRatingSummary,
  mapsHandoffUrl,
  resolveDetailDistanceLabel,
  siblingTitle,
  toDetailContentView,
} from "./detail-content";
import type {
  NearbyRestroom,
  RestroomDetail,
  SiblingRestroom,
} from "@/lib/restroom-directory/schemas";

const EST = {
  id: "11111111-1111-4111-8111-111111111111",
  placeId: "ChIJ_test",
  name: "Ayala Mall",
  formattedAddress: "Makati Ave, Makati",
  lat: 14.5547,
  lng: 121.0244,
} as const;

const DETAIL_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SIBLING_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PHOTO_ID = "p1111111-1111-4111-8111-111111111111";

function baseDetail(
  overrides: Partial<RestroomDetail> = {},
): RestroomDetail {
  return {
    id: DETAIL_ID,
    establishment: { ...EST },
    floorArea: "3F, North wing",
    restroomLabel: "Female",
    bidetType: "manual_spray",
    hasBidet: true,
    hasTissue: true,
    hasSoap: true,
    hasHandDrying: false,
    accessCost: "free",
    accessScope: "public",
    status: "active",
    verifyCount: 3,
    communityVerified: true,
    ratingAvg: 4.5,
    ratingCount: 2,
    isDisputed: false,
    createdBy: null,
    photos: [
      {
        id: PHOTO_ID,
        storagePath: `${DETAIL_ID}/${PHOTO_ID}.webp`,
        publicUrl: `https://cdn.example/${DETAIL_ID}/${PHOTO_ID}.webp`,
        sortOrder: 0,
      },
    ],
    reviews: [],
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
    ...overrides,
  };
}

function nearbyRow(
  overrides: Partial<NearbyRestroom> = {},
): NearbyRestroom {
  return {
    id: DETAIL_ID,
    establishmentId: EST.id,
    name: EST.name,
    lat: EST.lat,
    lng: EST.lng,
    distanceMeters: 320,
    bidetType: "manual_spray",
    hasBidet: true,
    accessCost: "free",
    accessScope: "public",
    verifyCount: 3,
    communityVerified: true,
    ratingAvg: 4.5,
    ratingCount: 2,
    pinVariant: "bidet",
    floorArea: "3F, North wing",
    restroomLabel: "Female",
    ...overrides,
  };
}

describe("30 — Detail content + Maps handoff", () => {
  it("renders amenity fields and trust signals from getRestroom", () => {
    const detail = baseDetail();
    const view = toDetailContentView({
      detail,
      siblings: [],
      distancesAvailable: false,
    });

    expect(view.establishmentName).toBe("Ayala Mall");
    expect(view.formattedAddress).toBe("Makati Ave, Makati");
    expect(view.locationLine).toBe("3F, North wing · Female");
    expect(view.floorArea).toBe("3F, North wing");
    expect(view.restroomLabel).toBe("Female");
    expect(view.communityVerified).toBe(true);
    expect(view.trustLabel).toBe(COMMUNITY_VERIFIED_LABEL);
    expect(view.ratingLabel).toBe("4.5 · 2 ratings");
    expect(amenityChipsFromDetail(detail).map((c) => c.label)).toEqual([
      "Manual spray",
      "Tissue",
      "Soap",
      "Free",
      "Public",
    ]);
    expect(view.photos).toEqual([
      {
        id: PHOTO_ID,
        publicUrl: `https://cdn.example/${DETAIL_ID}/${PHOTO_ID}.webp`,
      },
    ]);
    expect(view.showPhotoPlaceholder).toBe(false);
  });

  it("shows distance when user location is available", () => {
    expect(
      resolveDetailDistanceLabel(nearbyRow({ distanceMeters: 320 }), true),
    ).toBe("320 m");
    expect(
      resolveDetailDistanceLabel(nearbyRow({ distanceMeters: 320 }), false),
    ).toBeNull();

    const view = toDetailContentView({
      detail: baseDetail(),
      siblings: [],
      nearby: nearbyRow({ distanceMeters: 1500 }),
      distancesAvailable: true,
    });
    expect(view.distanceLabel).toBe("1.5 km");
  });

  it("shows Community verified badge only at ≥3 verifies", () => {
    const verified = toDetailContentView({
      detail: baseDetail({ verifyCount: 3, communityVerified: true }),
      siblings: [],
      distancesAvailable: false,
    });
    expect(verified.trustLabel).toBe(COMMUNITY_VERIFIED_LABEL);
    expect(verified.communityVerified).toBe(true);

    const unverified = toDetailContentView({
      detail: baseDetail({
        verifyCount: 2,
        communityVerified: false,
        ratingAvg: null,
        ratingCount: 0,
      }),
      siblings: [],
      distancesAvailable: false,
    });
    expect(unverified.trustLabel).toBe(UNVERIFIED_LABEL);
    expect(unverified.communityVerified).toBe(false);
    expect(unverified.ratingLabel).toBeNull();
  });

  it("lists sibling restrooms with switchable titles", () => {
    const siblings: SiblingRestroom[] = [
      {
        id: SIBLING_ID,
        floorArea: "2F",
        restroomLabel: "Male",
        bidetType: "none",
        hasBidet: false,
        verifyCount: 1,
        communityVerified: false,
        ratingAvg: null,
        ratingCount: 0,
      },
    ];

    expect(siblingTitle(siblings[0]!)).toBe("2F · Male");

    const view = toDetailContentView({
      detail: baseDetail(),
      siblings,
      distancesAvailable: false,
    });

    expect(view.siblings).toEqual([
      {
        id: SIBLING_ID,
        title: "2F · Male",
        hasBidet: false,
        communityVerified: false,
        ratingLabel: null,
      },
    ]);
  });

  it("builds Maps handoff URLs with correct coordinates", () => {
    expect(mapsHandoffUrl(14.5547, 121.0244, "other")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=14.5547,121.0244",
    );
    expect(mapsHandoffUrl(14.5547, 121.0244, "ios")).toBe(
      "https://maps.apple.com/?daddr=14.5547,121.0244",
    );
    expect(detectMapsPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe(
      "ios",
    );
    expect(detectMapsPlatform("Mozilla/5.0 (Linux; Android 14)")).toBe("other");

    const view = toDetailContentView({
      detail: baseDetail(),
      siblings: [],
      distancesAvailable: false,
      mapsPlatform: "other",
    });
    expect(view.mapsCtaLabel).toBe(MAPS_CTA_LABEL);
    expect(view.mapsUrl).toContain("14.5547,121.0244");
    expect(view.lat).toBe(14.5547);
    expect(view.lng).toBe(121.0244);
  });

  it("uses a photo placeholder when the listing has no seed photos", () => {
    const view = toDetailContentView({
      detail: baseDetail({ photos: [] }),
      siblings: [],
      distancesAvailable: false,
    });
    expect(view.showPhotoPlaceholder).toBe(true);
    expect(view.photos).toEqual([]);
    expect(PHOTO_PLACEHOLDER_LABEL).toBe("No photos yet");
  });

  it("formats rating summary and amenity chips for paid / patronage listings", () => {
    expect(formatRatingSummary(5, 1)).toBe("5 · 1 rating");
    expect(formatRatingSummary(null, 0)).toBeNull();

    const chips = amenityChipsFromDetail(
      baseDetail({
        bidetType: "none",
        hasBidet: false,
        hasTissue: false,
        hasSoap: false,
        hasHandDrying: true,
        accessCost: "paid",
        accessScope: "needs_patronage",
      }),
    );
    expect(chips.map((c) => c.label)).toEqual([
      "No bidet",
      "Hand drying",
      "Paid",
      "Needs patronage",
    ]);
  });
});
