import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import {
  InMemoryPostgres,
  type SeedNearbyListing,
} from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";
import type { RestroomDirectory } from "./restroom-directory";

/** Makati CBD — launch-geo origin for nearby tests. */
const ORIGIN = { lat: 14.5547, lng: 121.0244 };

/** ~400 m north of origin (inside default 1 km). */
const NEAR = { lat: 14.5583, lng: 121.0244 };

/** ~1.5 km north (outside default 1 km, inside 2 km). */
const MID = { lat: 14.5682, lng: 121.0244 };

/** ~6 km north (outside max 5 km). */
const FAR = { lat: 14.6087, lng: 121.0244 };

const EST_NEAR = "11111111-1111-4111-8111-111111111111";
const EST_MID = "22222222-2222-4222-8222-222222222222";
const EST_FAR = "33333333-3333-4333-8333-333333333333";
const EST_DISPUTED = "44444444-4444-4444-8444-444444444444";

const ID = {
  bidetVerified: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  standardUnverified: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  bidetUnverified: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  standardVerified: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  midFreePublic: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  farPaidPatronage: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  disputedNear: "99999999-9999-4999-8999-999999999999",
  closedNear: "88888888-8888-4888-8888-888888888888",
} as const;

function listing(
  partial: Omit<SeedNearbyListing, "name" | "accessCost" | "accessScope"> &
    Partial<Pick<SeedNearbyListing, "name" | "accessCost" | "accessScope">>,
): SeedNearbyListing {
  return {
    name: partial.name ?? "Test CR",
    accessCost: partial.accessCost ?? "free",
    accessScope: partial.accessScope ?? "public",
    ratingAvg: partial.ratingAvg ?? null,
    ratingCount: partial.ratingCount ?? 0,
    floorArea: partial.floorArea ?? null,
    restroomLabel: partial.restroomLabel ?? null,
    ...partial,
  };
}

function createDirectory(postgres: InMemoryPostgres): RestroomDirectory {
  return createRestroomDirectory({
    auth: new InMemoryAuth(),
    places: new InMemoryPlaces(),
    postgres,
    storage: new InMemoryStorage(),
    geolocation: new InMemoryGeolocation(),
  });
}

function seedFixture(postgres: InMemoryPostgres): void {
  postgres.seedListings([
    listing({
      id: ID.bidetVerified,
      establishmentId: EST_NEAR,
      name: "Bidet Verified",
      ...NEAR,
      bidetType: "manual_spray",
      status: "active",
      verifyCount: 3,
      accessCost: "free",
      accessScope: "public",
    }),
    listing({
      id: ID.standardUnverified,
      establishmentId: EST_NEAR,
      name: "Standard Unverified",
      lat: NEAR.lat + 0.0002,
      lng: NEAR.lng,
      bidetType: "none",
      status: "active",
      verifyCount: 0,
      accessCost: "paid",
      accessScope: "needs_patronage",
    }),
    listing({
      id: ID.bidetUnverified,
      establishmentId: EST_NEAR,
      name: "Bidet Unverified",
      lat: NEAR.lat + 0.0004,
      lng: NEAR.lng,
      bidetType: "built_in",
      status: "active",
      verifyCount: 2,
      accessCost: "free",
      accessScope: "needs_patronage",
    }),
    listing({
      id: ID.standardVerified,
      establishmentId: EST_NEAR,
      name: "Standard Verified",
      lat: NEAR.lat + 0.0006,
      lng: NEAR.lng,
      bidetType: "none",
      status: "active",
      verifyCount: 5,
      accessCost: "paid",
      accessScope: "public",
    }),
    listing({
      id: ID.midFreePublic,
      establishmentId: EST_MID,
      name: "Mid Range Free",
      ...MID,
      bidetType: "high_pressure",
      status: "active",
      verifyCount: 1,
      accessCost: "free",
      accessScope: "public",
    }),
    listing({
      id: ID.farPaidPatronage,
      establishmentId: EST_FAR,
      name: "Far Away",
      ...FAR,
      bidetType: "none",
      status: "active",
      verifyCount: 4,
      accessCost: "paid",
      accessScope: "needs_patronage",
    }),
    listing({
      id: ID.disputedNear,
      establishmentId: EST_DISPUTED,
      name: "Disputed Near",
      lat: NEAR.lat + 0.0001,
      lng: NEAR.lng + 0.0001,
      bidetType: "manual_spray",
      status: "disputed",
      verifyCount: 3,
    }),
    listing({
      id: ID.closedNear,
      establishmentId: EST_DISPUTED,
      name: "Closed Near",
      lat: NEAR.lat + 0.0003,
      lng: NEAR.lng + 0.0001,
      bidetType: "none",
      status: "closed",
      verifyCount: 0,
    }),
  ]);
}

describe("06 — listNearby", () => {
  it("returns restrooms within radius ordered by distance", async () => {
    const postgres = new InMemoryPostgres();
    seedFixture(postgres);
    const directory = createDirectory(postgres);

    const result = await directory.listNearby({
      ...ORIGIN,
      radiusMeters: 1000,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const ids = result.value.map((r) => r.id);
    expect(ids).toEqual([
      ID.bidetVerified,
      ID.standardUnverified,
      ID.bidetUnverified,
      ID.standardVerified,
    ]);
    expect(result.value.every((r) => r.distanceMeters <= 1000)).toBe(true);
    for (let i = 1; i < result.value.length; i++) {
      expect(result.value[i]!.distanceMeters).toBeGreaterThanOrEqual(
        result.value[i - 1]!.distanceMeters,
      );
    }
  });

  it("excludes restrooms outside radius and disputed (and non-active) listings", async () => {
    const postgres = new InMemoryPostgres();
    seedFixture(postgres);
    const directory = createDirectory(postgres);

    const defaultRadius = await directory.listNearby({ ...ORIGIN });
    expect(defaultRadius.ok).toBe(true);
    if (!defaultRadius.ok) return;

    const defaultIds = defaultRadius.value.map((r) => r.id);
    expect(defaultIds).not.toContain(ID.midFreePublic);
    expect(defaultIds).not.toContain(ID.farPaidPatronage);
    expect(defaultIds).not.toContain(ID.disputedNear);
    expect(defaultIds).not.toContain(ID.closedNear);

    const twoKm = await directory.listNearby({
      ...ORIGIN,
      radiusMeters: 2000,
    });
    expect(twoKm.ok).toBe(true);
    if (!twoKm.ok) return;
    expect(twoKm.value.map((r) => r.id)).toContain(ID.midFreePublic);
    expect(twoKm.value.map((r) => r.id)).not.toContain(ID.farPaidPatronage);
    expect(twoKm.value.map((r) => r.id)).not.toContain(ID.disputedNear);
  });

  it("applies hasBidet, accessCost, accessScope, and communityVerified filters", async () => {
    const postgres = new InMemoryPostgres();
    seedFixture(postgres);
    const directory = createDirectory(postgres);

    const hasBidet = await directory.listNearby({
      ...ORIGIN,
      radiusMeters: 2000,
      filters: { hasBidet: true },
    });
    expect(hasBidet.ok).toBe(true);
    if (!hasBidet.ok) return;
    expect(hasBidet.value.map((r) => r.id).sort()).toEqual(
      [ID.bidetVerified, ID.bidetUnverified, ID.midFreePublic].sort(),
    );
    expect(hasBidet.value.every((r) => r.hasBidet)).toBe(true);

    const free = await directory.listNearby({
      ...ORIGIN,
      radiusMeters: 2000,
      filters: { accessCost: "free" },
    });
    expect(free.ok).toBe(true);
    if (!free.ok) return;
    expect(free.value.every((r) => r.accessCost === "free")).toBe(true);
    expect(free.value.map((r) => r.id).sort()).toEqual(
      [ID.bidetVerified, ID.bidetUnverified, ID.midFreePublic].sort(),
    );

    const publicScope = await directory.listNearby({
      ...ORIGIN,
      radiusMeters: 2000,
      filters: { accessScope: "public" },
    });
    expect(publicScope.ok).toBe(true);
    if (!publicScope.ok) return;
    expect(publicScope.value.every((r) => r.accessScope === "public")).toBe(
      true,
    );
    expect(publicScope.value.map((r) => r.id).sort()).toEqual(
      [ID.bidetVerified, ID.standardVerified, ID.midFreePublic].sort(),
    );

    const verified = await directory.listNearby({
      ...ORIGIN,
      radiusMeters: 2000,
      filters: { communityVerified: true },
    });
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;
    expect(verified.value.every((r) => r.communityVerified)).toBe(true);
    expect(verified.value.map((r) => r.id).sort()).toEqual(
      [ID.bidetVerified, ID.standardVerified].sort(),
    );

    const combo = await directory.listNearby({
      ...ORIGIN,
      radiusMeters: 2000,
      filters: {
        hasBidet: true,
        accessCost: "free",
        accessScope: "public",
        communityVerified: true,
      },
    });
    expect(combo.ok).toBe(true);
    if (!combo.ok) return;
    expect(combo.value.map((r) => r.id)).toEqual([ID.bidetVerified]);
  });

  it("computes pin-variant classification per listing", async () => {
    const postgres = new InMemoryPostgres();
    seedFixture(postgres);
    const directory = createDirectory(postgres);

    const result = await directory.listNearby({
      ...ORIGIN,
      radiusMeters: 1000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.value.map((r) => [r.id, r]));

    expect(byId[ID.bidetVerified]).toMatchObject({
      hasBidet: true,
      communityVerified: true,
      pinVariant: "bidet",
      verifyCount: 3,
    });
    expect(byId[ID.standardUnverified]).toMatchObject({
      hasBidet: false,
      communityVerified: false,
      pinVariant: "standard_unverified",
      verifyCount: 0,
    });
    expect(byId[ID.bidetUnverified]).toMatchObject({
      hasBidet: true,
      communityVerified: false,
      pinVariant: "bidet_unverified",
      verifyCount: 2,
    });
    expect(byId[ID.standardVerified]).toMatchObject({
      hasBidet: false,
      communityVerified: true,
      pinVariant: "standard",
      verifyCount: 5,
    });
  });

  it("rejects radius above 5 km and defaults to 1 km", async () => {
    const postgres = new InMemoryPostgres();
    seedFixture(postgres);
    const directory = createDirectory(postgres);

    const tooFar = await directory.listNearby({
      ...ORIGIN,
      radiusMeters: 5001,
    });
    expect(tooFar).toEqual({ ok: false, error: "validation_error" });

    const defaulted = await directory.listNearby({ ...ORIGIN });
    expect(defaulted.ok).toBe(true);
    if (!defaulted.ok) return;
    expect(defaulted.value.map((r) => r.id)).not.toContain(ID.midFreePublic);
  });
});
