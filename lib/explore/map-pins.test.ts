import { describe, expect, it } from "vitest";

import type { NearbyRestroom } from "@/lib/restroom-directory/schemas";

import {
  DEFAULT_NEARBY_RADIUS_METERS,
  PIN_BIDET_FILL,
  PIN_STANDARD_FILL,
  pinAppearanceFromVariant,
  selectMapPinId,
  shouldLoadNearbyPins,
  syncSelectedPinId,
  toMapPinModels,
} from "./map-pins";

const BIDET_VERIFIED: NearbyRestroom = {
  id: "11111111-1111-4111-8111-111111111111",
  establishmentId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Bidet Verified",
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

const STANDARD_UNVERIFIED: NearbyRestroom = {
  id: "22222222-2222-4222-8222-222222222222",
  establishmentId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  name: "Standard Unverified",
  lat: 14.555,
  lng: 121.025,
  distanceMeters: 120,
  bidetType: "none",
  hasBidet: false,
  accessCost: "paid",
  accessScope: "needs_patronage",
  verifyCount: 0,
  communityVerified: false,
  ratingAvg: null,
  ratingCount: 0,
  pinVariant: "standard_unverified",
  floorArea: null,
  restroomLabel: null,
};

const BIDET_UNVERIFIED: NearbyRestroom = {
  id: "33333333-3333-4333-8333-333333333333",
  establishmentId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  name: "Bidet Unverified",
  lat: 14.556,
  lng: 121.026,
  distanceMeters: 200,
  bidetType: "built_in",
  hasBidet: true,
  accessCost: "free",
  accessScope: "public",
  verifyCount: 1,
  communityVerified: false,
  ratingAvg: null,
  ratingCount: 0,
  pinVariant: "bidet_unverified",
  floorArea: null,
  restroomLabel: null,
};

const STANDARD_VERIFIED: NearbyRestroom = {
  id: "44444444-4444-4444-8444-444444444444",
  establishmentId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  name: "Standard Verified",
  lat: 14.557,
  lng: 121.027,
  distanceMeters: 300,
  bidetType: "none",
  hasBidet: false,
  accessCost: "free",
  accessScope: "public",
  verifyCount: 5,
  communityVerified: true,
  ratingAvg: 3,
  ratingCount: 1,
  pinVariant: "standard",
  floorArea: null,
  restroomLabel: null,
};

describe("24 — map pins from listNearby", () => {
  it("defaults nearby radius to 1 km", () => {
    expect(DEFAULT_NEARBY_RADIUS_METERS).toBe(1000);
  });

  it("maps pinVariant to teal / charcoal fill and unverified overlay flags", () => {
    expect(pinAppearanceFromVariant("bidet")).toEqual({
      fill: PIN_BIDET_FILL,
      unverified: false,
      hasBidet: true,
    });
    expect(pinAppearanceFromVariant("standard")).toEqual({
      fill: PIN_STANDARD_FILL,
      unverified: false,
      hasBidet: false,
    });
    expect(pinAppearanceFromVariant("bidet_unverified")).toEqual({
      fill: PIN_BIDET_FILL,
      unverified: true,
      hasBidet: true,
    });
    expect(pinAppearanceFromVariant("standard_unverified")).toEqual({
      fill: PIN_STANDARD_FILL,
      unverified: true,
      hasBidet: false,
    });
  });

  it("places pin models at establishment coordinates from listNearby rows", () => {
    const pins = toMapPinModels(
      [BIDET_VERIFIED, STANDARD_UNVERIFIED, BIDET_UNVERIFIED, STANDARD_VERIFIED],
      null,
    );

    expect(pins).toHaveLength(4);
    expect(pins[0]).toMatchObject({
      id: BIDET_VERIFIED.id,
      lat: BIDET_VERIFIED.lat,
      lng: BIDET_VERIFIED.lng,
      pinVariant: "bidet",
      appearance: { fill: PIN_BIDET_FILL, unverified: false },
      selected: false,
    });
    expect(pins[1]).toMatchObject({
      id: STANDARD_UNVERIFIED.id,
      pinVariant: "standard_unverified",
      appearance: { fill: PIN_STANDARD_FILL, unverified: true },
    });
    expect(pins[2].appearance.unverified).toBe(true);
    expect(pins[2].appearance.fill).toBe(PIN_BIDET_FILL);
    expect(pins[3].appearance).toEqual({
      fill: PIN_STANDARD_FILL,
      unverified: false,
      hasBidet: false,
    });
  });

  it("marks the selected listing and clears selection when it leaves nearby data", () => {
    const selected = selectMapPinId(BIDET_VERIFIED.id);
    expect(selected).toBe(BIDET_VERIFIED.id);

    const withSelection = toMapPinModels(
      [BIDET_VERIFIED, STANDARD_UNVERIFIED],
      selected,
    );
    expect(withSelection.find((p) => p.id === BIDET_VERIFIED.id)?.selected).toBe(
      true,
    );
    expect(
      withSelection.find((p) => p.id === STANDARD_UNVERIFIED.id)?.selected,
    ).toBe(false);

    expect(
      syncSelectedPinId(selected, [STANDARD_UNVERIFIED]),
    ).toBeNull();
    expect(
      syncSelectedPinId(selected, [BIDET_VERIFIED, STANDARD_UNVERIFIED]),
    ).toBe(selected);
  });

  it("updates pin models when nearby listings change", () => {
    const first = toMapPinModels([BIDET_VERIFIED], null);
    expect(first.map((p) => p.id)).toEqual([BIDET_VERIFIED.id]);

    const next = toMapPinModels(
      [STANDARD_UNVERIFIED, BIDET_UNVERIFIED],
      null,
    );
    expect(next.map((p) => p.id)).toEqual([
      STANDARD_UNVERIFIED.id,
      BIDET_UNVERIFIED.id,
    ]);
    expect(next[0].lat).toBe(STANDARD_UNVERIFIED.lat);
    expect(next[0].lng).toBe(STANDARD_UNVERIFIED.lng);
  });

  it("skips nearby load outside launch geo; loads for fallback / browse / in-coverage", () => {
    expect(shouldLoadNearbyPins("coming_soon_outside")).toBe(false);
    expect(shouldLoadNearbyPins("enable_location")).toBe(true);
    expect(shouldLoadNearbyPins("none")).toBe(true);
  });
});
