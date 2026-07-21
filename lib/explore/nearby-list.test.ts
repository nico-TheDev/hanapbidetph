import { describe, expect, it } from "vitest";

import type { NearbyRestroom } from "@/lib/restroom-directory/schemas";
import { toMapPinModels } from "@/lib/explore/map-pins";

import {
  selectNearbyListRow,
  syncSelectedNearbyListId,
  toNearbyListRows,
} from "./nearby-list";

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

describe("27 — desktop sidebar nearby list", () => {
  it("preserves distance-sorted order with name, distance, and amenity flags", () => {
    const rows = toNearbyListRows([NEARBY, FARTHER], {
      distancesAvailable: true,
      selectedId: null,
    });

    expect(rows.map((r) => r.id)).toEqual([NEARBY.id, FARTHER.id]);
    expect(rows).toEqual([
      {
        id: NEARBY.id,
        name: NEARBY.name,
        distanceLabel: "50 m",
        hasBidet: true,
        communityVerified: true,
        selected: false,
      },
      {
        id: FARTHER.id,
        name: FARTHER.name,
        distanceLabel: "1.5 km",
        hasBidet: false,
        communityVerified: false,
        selected: false,
      },
    ]);
  });

  it("omits distance labels when location is unknown", () => {
    const rows = toNearbyListRows([NEARBY, FARTHER], {
      distancesAvailable: false,
    });
    expect(rows.every((row) => row.distanceLabel === null)).toBe(true);
    expect(rows.map((row) => row.name)).toEqual([NEARBY.name, FARTHER.name]);
  });

  it("selecting a row marks it selected and highlights the matching map pin", () => {
    const selectedId = selectNearbyListRow(FARTHER.id);
    const rows = toNearbyListRows([NEARBY, FARTHER], {
      distancesAvailable: true,
      selectedId,
    });
    expect(rows.find((r) => r.id === FARTHER.id)?.selected).toBe(true);
    expect(rows.find((r) => r.id === NEARBY.id)?.selected).toBe(false);

    const pins = toMapPinModels([NEARBY, FARTHER], selectedId);
    expect(pins.find((p) => p.id === FARTHER.id)?.selected).toBe(true);
    expect(pins.find((p) => p.id === NEARBY.id)?.selected).toBe(false);
  });

  it("clears selection when radius or filters drop the listing", () => {
    const selectedId = selectNearbyListRow(FARTHER.id);
    expect(syncSelectedNearbyListId(selectedId, [NEARBY])).toBeNull();
    expect(syncSelectedNearbyListId(selectedId, [NEARBY, FARTHER])).toBe(
      selectedId,
    );
  });
});
