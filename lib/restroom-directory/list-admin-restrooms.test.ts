import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import { InMemoryPostgres } from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";
import type { Actor } from "./ports/auth";

const PLACE_ID = "ChIJ_dunkin_megamall";
const EST = "11111111-1111-4111-8111-111111111111";
const RESTROOM_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const RESTROOM_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const alice: Extract<Actor, { role: "user" }> = {
  role: "user",
  userId: "a1111111-1111-4111-8111-111111111111",
  displayName: "Alice A.",
  avatarUrl: null,
  isAdmin: false,
};

const admin: Extract<Actor, { role: "admin" }> = {
  role: "admin",
  userId: "c3333333-3333-4333-8333-333333333333",
  displayName: "Admin A.",
  avatarUrl: null,
  isAdmin: true,
};

function createHarness(actor: Actor = admin) {
  const auth = new InMemoryAuth();
  auth.setActor(actor);
  const postgres = new InMemoryPostgres();
  const directory = createRestroomDirectory({
    auth,
    places: new InMemoryPlaces(),
    postgres,
    storage: new InMemoryStorage(),
    geolocation: new InMemoryGeolocation(),
  });
  return { directory, postgres };
}

function seedTwoListings(postgres: InMemoryPostgres): void {
  postgres.seedEstablishments([
    {
      id: EST,
      placeId: PLACE_ID,
      name: "Dunkin' Megamall",
      formattedAddress: "EDSA, Mandaluyong",
      lat: 14.584,
      lng: 121.056,
    },
  ]);
  postgres.seedRestrooms([
    {
      id: RESTROOM_A,
      establishmentId: EST,
      createdBy: alice.userId,
      floorArea: "3F",
      restroomLabel: "Female",
      bidetType: "manual_spray",
      hasTissue: true,
      hasSoap: true,
      hasHandDrying: false,
      accessCost: "free",
      accessScope: "public",
      status: "active",
      verifyCount: 2,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: RESTROOM_B,
      establishmentId: EST,
      createdBy: alice.userId,
      floorArea: "B1",
      restroomLabel: "Male",
      bidetType: "none",
      hasTissue: false,
      hasSoap: true,
      hasHandDrying: true,
      accessCost: "paid",
      accessScope: "needs_patronage",
      status: "disputed",
      verifyCount: 0,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    },
  ]);
}

describe("listAdminRestrooms", () => {
  it("rejects guests", async () => {
    const { directory } = createHarness({ role: "guest" });
    expect(await directory.listAdminRestrooms()).toEqual({
      ok: false,
      error: "unauthenticated",
    });
  });

  it("rejects non-admin users", async () => {
    const { directory } = createHarness(alice);
    expect(await directory.listAdminRestrooms()).toEqual({
      ok: false,
      error: "forbidden",
    });
  });

  it("returns all restrooms with name, status, and verify count", async () => {
    const { directory, postgres } = createHarness();
    seedTwoListings(postgres);

    const result = await directory.listAdminRestrooms();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(2);
    expect(result.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: RESTROOM_A,
          name: "Dunkin' Megamall",
          status: "active",
          verifyCount: 2,
          floorArea: "3F",
          restroomLabel: "Female",
        }),
        expect.objectContaining({
          id: RESTROOM_B,
          name: "Dunkin' Megamall",
          status: "disputed",
          verifyCount: 0,
          floorArea: "B1",
          restroomLabel: "Male",
        }),
      ]),
    );
  });

  it("includes fields needed to seed the edit form", async () => {
    const { directory, postgres } = createHarness();
    seedTwoListings(postgres);

    const result = await directory.listAdminRestrooms();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const row = result.value.find((r) => r.id === RESTROOM_A);
    expect(row).toMatchObject({
      placeId: PLACE_ID,
      formattedAddress: "EDSA, Mandaluyong",
      lat: 14.584,
      lng: 121.056,
      bidetType: "manual_spray",
      hasTissue: true,
      hasSoap: true,
      hasHandDrying: false,
      accessCost: "free",
      accessScope: "public",
    });
  });
});
