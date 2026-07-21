import { describe, expect, it } from "vitest";

import type { NearbyRestroom } from "@/lib/restroom-directory/schemas";

import {
  DEFAULT_NEARBY_RADIUS_METERS,
  MAX_NEARBY_RADIUS_METERS,
  RADIUS_SELECTOR_OPTIONS,
  RADIUS_STEPS_METERS,
  formatListingDistance,
  formatRadiusLabel,
  toNearbyListRows,
} from "./radius";

const NEARBY: NearbyRestroom = {
  id: "11111111-1111-4111-8111-111111111111",
  establishmentId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "SM Aura CR",
  lat: 14.5547,
  lng: 121.0244,
  distanceMeters: 50,
  bidetType: "manual_spray",
  hasBidet: true,
  accessCost: "free",
  accessScope: "public",
  verifyCount: 3,
  communityVerified: true,
  ratingAvg: 4.5,
  ratingCount: 2,
  pinVariant: "bidet",
  floorArea: null,
  restroomLabel: null,
};

const FARTHER: NearbyRestroom = {
  ...NEARBY,
  id: "22222222-2222-4222-8222-222222222222",
  establishmentId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  name: "BGC High Street CR",
  distanceMeters: 1500,
  pinVariant: "standard",
  hasBidet: false,
  bidetType: "none",
  verifyCount: 0,
  communityVerified: false,
  ratingAvg: null,
  ratingCount: 0,
};

describe("25 — radius selector wired to listNearby", () => {
  it("exposes 0.5 / 1 / 2 / 5 km steps with default 1 km and max 5 km", () => {
    expect(RADIUS_STEPS_METERS).toEqual([500, 1000, 2000, 5000]);
    expect(DEFAULT_NEARBY_RADIUS_METERS).toBe(1000);
    expect(MAX_NEARBY_RADIUS_METERS).toBe(5000);
    expect(RADIUS_SELECTOR_OPTIONS.map((o) => o.valueMeters)).toEqual(
      RADIUS_STEPS_METERS,
    );
    expect(RADIUS_SELECTOR_OPTIONS.map((o) => o.label)).toEqual([
      "0.5 km",
      "1 km",
      "2 km",
      "5 km",
    ]);
  });

  it("formats the current radius label for the top-bar control", () => {
    expect(formatRadiusLabel(500)).toBe("0.5 km");
    expect(formatRadiusLabel(1000)).toBe("1 km");
    expect(formatRadiusLabel(2000)).toBe("2 km");
    expect(formatRadiusLabel(5000)).toBe("5 km");
  });

  it("formats listing distances only when user location is known", () => {
    expect(formatListingDistance(50, true)).toBe("50 m");
    expect(formatListingDistance(999, true)).toBe("999 m");
    expect(formatListingDistance(1000, true)).toBe("1 km");
    expect(formatListingDistance(1500, true)).toBe("1.5 km");
    expect(formatListingDistance(50, false)).toBeNull();
    expect(formatListingDistance(1500, false)).toBeNull();
  });

  it("builds sidebar listing rows with distance when location is known", () => {
    const withDistance = toNearbyListRows([NEARBY, FARTHER], {
      distancesAvailable: true,
    });
    expect(withDistance).toEqual([
      {
        id: NEARBY.id,
        name: NEARBY.name,
        distanceLabel: "50 m",
      },
      {
        id: FARTHER.id,
        name: FARTHER.name,
        distanceLabel: "1.5 km",
      },
    ]);

    const withoutDistance = toNearbyListRows([NEARBY, FARTHER], {
      distancesAvailable: false,
    });
    expect(withoutDistance.every((row) => row.distanceLabel === null)).toBe(
      true,
    );
    expect(withoutDistance.map((row) => row.name)).toEqual([
      NEARBY.name,
      FARTHER.name,
    ]);
  });
});
