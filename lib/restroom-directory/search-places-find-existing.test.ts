import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import { InMemoryPostgres } from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";
import type { Actor } from "./ports/auth";

const PLACE_ID = "ChIJ_dunkin_megamall";
const OTHER_PLACE_ID = "ChIJ_other";

const EST = "11111111-1111-4111-8111-111111111111";
const OTHER_EST = "22222222-2222-4222-8222-222222222222";

const ID = {
  activeA: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  activeB: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  disputed: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  archived: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  otherPlace: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
} as const;

const signedInUser: Extract<Actor, { role: "user" }> = {
  role: "user",
  userId: "a1111111-1111-4111-8111-111111111111",
  displayName: "Alice A.",
  avatarUrl: null,
  isAdmin: false,
};

function createHarness(actor: Actor = signedInUser) {
  const auth = new InMemoryAuth();
  auth.setActor(actor);
  const places = new InMemoryPlaces();
  const postgres = new InMemoryPostgres();
  const directory = createRestroomDirectory({
    auth,
    places,
    postgres,
    storage: new InMemoryStorage(),
    geolocation: new InMemoryGeolocation(),
  });
  return { directory, places, postgres };
}

function seedExistingAtPlace(postgres: InMemoryPostgres): void {
  postgres.seedEstablishments([
    {
      id: EST,
      placeId: PLACE_ID,
      name: "Dunkin' Megamall",
      formattedAddress: "EDSA, Mandaluyong",
      lat: 14.584,
      lng: 121.056,
    },
    {
      id: OTHER_EST,
      placeId: OTHER_PLACE_ID,
      name: "Other Spot",
      formattedAddress: null,
      lat: 14.55,
      lng: 121.02,
    },
  ]);

  postgres.seedRestrooms([
    {
      id: ID.activeA,
      establishmentId: EST,
      createdBy: signedInUser.userId,
      floorArea: "3F",
      restroomLabel: "Female",
      bidetType: "manual_spray",
      hasTissue: true,
      hasSoap: true,
      hasHandDrying: false,
      accessCost: "free",
      accessScope: "public",
      status: "active",
      verifyCount: 3,
      ratingAvg: 4.5,
      ratingCount: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: ID.activeB,
      establishmentId: EST,
      createdBy: signedInUser.userId,
      floorArea: "B1",
      restroomLabel: "Male",
      bidetType: "none",
      hasTissue: true,
      hasSoap: false,
      hasHandDrying: true,
      accessCost: "free",
      accessScope: "public",
      status: "active",
      verifyCount: 0,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    },
    {
      id: ID.disputed,
      establishmentId: EST,
      createdBy: null,
      floorArea: null,
      restroomLabel: "Disputed",
      bidetType: "none",
      hasTissue: false,
      hasSoap: false,
      hasHandDrying: false,
      accessCost: "paid",
      accessScope: "needs_patronage",
      status: "disputed",
      verifyCount: 1,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: "2026-01-03T00:00:00.000Z",
      updatedAt: "2026-01-03T00:00:00.000Z",
    },
    {
      id: ID.archived,
      establishmentId: EST,
      createdBy: null,
      floorArea: null,
      restroomLabel: "Archived",
      bidetType: "none",
      hasTissue: false,
      hasSoap: false,
      hasHandDrying: false,
      accessCost: "free",
      accessScope: "public",
      status: "archived",
      verifyCount: 0,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: "2026-01-04T00:00:00.000Z",
      updatedAt: "2026-01-04T00:00:00.000Z",
    },
    {
      id: ID.otherPlace,
      establishmentId: OTHER_EST,
      createdBy: null,
      floorArea: "1F",
      restroomLabel: null,
      bidetType: "built_in",
      hasTissue: true,
      hasSoap: true,
      hasHandDrying: true,
      accessCost: "free",
      accessScope: "public",
      status: "active",
      verifyCount: 1,
      ratingAvg: 3,
      ratingCount: 1,
      createdAt: "2026-01-05T00:00:00.000Z",
      updatedAt: "2026-01-05T00:00:00.000Z",
    },
  ]);
}

describe("searchPlaces", () => {
  it("rejects guests", async () => {
    const { directory } = createHarness({ role: "guest" });
    const result = await directory.searchPlaces({ query: "Dunkin" });
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
  });

  it("returns empty suggestions when Places has no matches", async () => {
    const { directory, places, postgres } = createHarness();
    places.seedSuggestions([
      {
        placeId: PLACE_ID,
        name: "Dunkin' Megamall",
        formattedAddress: "EDSA, Mandaluyong",
      },
    ]);

    const result = await directory.searchPlaces({ query: "Starbucks" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
    // Autocomplete is not persisted into establishments.
    expect(await postgres.findActiveRestroomsByPlaceId(PLACE_ID)).toEqual([]);
  });

  it("returns establishment suggestions from Places without persisting", async () => {
    const { directory, places, postgres } = createHarness();
    places.seedSuggestions([
      {
        placeId: PLACE_ID,
        name: "Dunkin' Megamall",
        formattedAddress: "EDSA, Mandaluyong",
      },
      {
        placeId: "ChIJ_dunkin_bgc",
        name: "Dunkin' BGC",
        formattedAddress: "26th St, Taguig",
      },
      {
        placeId: "ChIJ_unrelated",
        name: "Jollibee",
        formattedAddress: "Makati Ave",
      },
    ]);

    const result = await directory.searchPlaces({ query: "Dunkin" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([
        {
          placeId: PLACE_ID,
          name: "Dunkin' Megamall",
          formattedAddress: "EDSA, Mandaluyong",
        },
        {
          placeId: "ChIJ_dunkin_bgc",
          name: "Dunkin' BGC",
          formattedAddress: "26th St, Taguig",
        },
      ]);
    }
    expect(await postgres.findActiveRestroomsByPlaceId(PLACE_ID)).toEqual([]);
    expect(
      await postgres.findActiveRestroomsByPlaceId("ChIJ_dunkin_bgc"),
    ).toEqual([]);
  });

  it("rejects empty query", async () => {
    const { directory } = createHarness();
    const result = await directory.searchPlaces({ query: "" });
    expect(result).toEqual({ ok: false, error: "validation_error" });
  });
});

describe("findExistingForPlace", () => {
  it("rejects guests", async () => {
    const { directory } = createHarness({ role: "guest" });
    const result = await directory.findExistingForPlace({
      placeId: PLACE_ID,
    });
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
  });

  it("returns empty list when no restrooms exist at the place", async () => {
    const { directory } = createHarness();
    const result = await directory.findExistingForPlace({
      placeId: "ChIJ_unknown",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it("returns active restrooms for a place_id, excluding non-active and other places", async () => {
    const { directory, postgres } = createHarness();
    seedExistingAtPlace(postgres);

    const result = await directory.findExistingForPlace({
      placeId: PLACE_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([
        {
          id: ID.activeA,
          floorArea: "3F",
          restroomLabel: "Female",
          bidetType: "manual_spray",
          hasBidet: true,
          verifyCount: 3,
          communityVerified: true,
          ratingAvg: 4.5,
          ratingCount: 2,
        },
        {
          id: ID.activeB,
          floorArea: "B1",
          restroomLabel: "Male",
          bidetType: "none",
          hasBidet: false,
          verifyCount: 0,
          communityVerified: false,
          ratingAvg: null,
          ratingCount: 0,
        },
      ]);
    }
  });

  it("rejects empty placeId", async () => {
    const { directory } = createHarness();
    const result = await directory.findExistingForPlace({ placeId: "" });
    expect(result).toEqual({ ok: false, error: "validation_error" });
  });
});
