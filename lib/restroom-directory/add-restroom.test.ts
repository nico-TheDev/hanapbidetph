import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import { InMemoryPostgres } from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";
import type { Actor } from "./ports/auth";
import type { AddRestroomInput } from "./schemas";

const PLACE_ID = "ChIJ_dunkin_megamall";
const EST = "11111111-1111-4111-8111-111111111111";
const EXISTING_RESTROOM = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

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
  const storage = new InMemoryStorage();
  const directory = createRestroomDirectory({
    auth,
    places,
    postgres,
    storage,
    geolocation: new InMemoryGeolocation(),
  });
  return { directory, places, postgres, storage };
}

function baseInput(
  overrides: Partial<AddRestroomInput> = {},
): AddRestroomInput {
  return {
    placeId: PLACE_ID,
    name: "Dunkin' Megamall",
    formattedAddress: "EDSA, Mandaluyong",
    lat: 14.584,
    lng: 121.056,
    floorArea: "3F",
    restroomLabel: "Female",
    bidetType: "manual_spray",
    hasTissue: true,
    hasSoap: true,
    hasHandDrying: false,
    accessCost: "free",
    accessScope: "public",
    photos: [],
    ...overrides,
  };
}

function seedExistingEstablishment(postgres: InMemoryPostgres): void {
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
      id: EXISTING_RESTROOM,
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
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ]);
}

describe("addRestroom", () => {
  it("rejects guests", async () => {
    const { directory } = createHarness({ role: "guest" });
    const result = await directory.addRestroom(baseInput());
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
  });

  it("creates establishment + restroom for a new place_id as active unverified", async () => {
    const { directory, postgres } = createHarness();

    const result = await directory.addRestroom(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.status).toBe("active");
    expect(result.value.verifyCount).toBe(0);
    expect(result.value.communityVerified).toBe(false);
    expect(result.value.isDisputed).toBe(false);
    expect(result.value.createdBy).toBe(signedInUser.userId);
    expect(result.value.floorArea).toBe("3F");
    expect(result.value.restroomLabel).toBe("Female");
    expect(result.value.bidetType).toBe("manual_spray");
    expect(result.value.hasBidet).toBe(true);
    expect(result.value.establishment.placeId).toBe(PLACE_ID);
    expect(result.value.establishment.name).toBe("Dunkin' Megamall");
    expect(result.value.photos).toEqual([]);

    const byPlace = await postgres.findActiveRestroomsByPlaceId(PLACE_ID);
    expect(byPlace).toHaveLength(1);
    expect(byPlace[0]?.id).toBe(result.value.id);

    const detail = await postgres.findRestroomDetail(result.value.id);
    expect(detail?.establishment.placeId).toBe(PLACE_ID);
  });

  it("adds a sibling restroom at an existing establishment", async () => {
    const { directory, postgres } = createHarness();
    seedExistingEstablishment(postgres);

    const result = await directory.addRestroom(
      baseInput({
        floorArea: "3F North",
        restroomLabel: "PWD",
        bidetType: "built_in",
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.establishment.id).toBe(EST);
    expect(result.value.establishment.placeId).toBe(PLACE_ID);
    expect(result.value.id).not.toBe(EXISTING_RESTROOM);
    expect(result.value.floorArea).toBe("3F North");
    expect(result.value.restroomLabel).toBe("PWD");
    expect(result.value.status).toBe("active");
    expect(result.value.verifyCount).toBe(0);

    const siblings = await postgres.findActiveSiblings(EXISTING_RESTROOM);
    expect(siblings).not.toBeNull();
    expect(siblings).toHaveLength(1);
    expect(siblings?.[0]?.id).toBe(result.value.id);

    const byPlace = await postgres.findActiveRestroomsByPlaceId(PLACE_ID);
    expect(byPlace).toHaveLength(2);
  });

  it("uploads up to 3 seed photos and rejects more than 3", async () => {
    const { directory, storage } = createHarness();
    const photoBytes = [
      new Uint8Array([1, 2, 3]),
      new Uint8Array([4, 5, 6]),
      new Uint8Array([7, 8, 9]),
    ];

    const okResult = await directory.addRestroom(
      baseInput({
        photos: photoBytes.map((data) => ({
          data,
          contentType: "image/webp",
        })),
      }),
    );

    expect(okResult.ok).toBe(true);
    if (!okResult.ok) return;

    expect(okResult.value.photos).toHaveLength(3);
    for (const [i, photo] of okResult.value.photos.entries()) {
      expect(photo.storagePath).toBe(
        `${okResult.value.id}/${photo.id}.webp`,
      );
      expect(photo.sortOrder).toBe(i);
      expect(photo.publicUrl).toBe(
        `memory://restroom-photos/${photo.storagePath}`,
      );
      expect(storage.getObject("restroom-photos", photo.storagePath)).toEqual(
        photoBytes[i],
      );
    }

    const tooMany = await directory.addRestroom(
      baseInput({
        placeId: "ChIJ_other_place",
        name: "Other Cafe",
        photos: [1, 2, 3, 4].map((n) => ({
          data: new Uint8Array([n]),
          contentType: "image/webp",
        })),
      }),
    );
    expect(tooMany).toEqual({ ok: false, error: "validation_error" });
  });
});
