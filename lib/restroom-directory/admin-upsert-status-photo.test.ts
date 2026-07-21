import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import { InMemoryPostgres } from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";
import type { Actor } from "./ports/auth";
import type { AdminUpsertRestroomInput, RestroomStatus } from "./schemas";

const PLACE_ID = "ChIJ_dunkin_megamall";
const EST = "11111111-1111-4111-8111-111111111111";
const RESTROOM = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const MISSING = "99999999-9999-4999-8999-999999999999";
const RESTROOM_PHOTO = "d1111111-1111-4111-8111-111111111111";
const REVIEW = "e1111111-1111-4111-8111-111111111111";
const REVIEW_PHOTO = "f2222222-2222-4222-8222-222222222222";

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
  const storage = new InMemoryStorage();
  const directory = createRestroomDirectory({
    auth,
    places: new InMemoryPlaces(),
    postgres,
    storage,
    geolocation: new InMemoryGeolocation(),
  });
  return { auth, directory, postgres, storage };
}

function seedBase(postgres: InMemoryPostgres): void {
  postgres.seedProfiles([
    {
      id: alice.userId,
      displayName: alice.displayName,
      avatarUrl: alice.avatarUrl,
    },
    {
      id: admin.userId,
      displayName: admin.displayName,
      avatarUrl: admin.avatarUrl,
    },
  ]);
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
      id: RESTROOM,
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
      verifyCount: 0,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ]);
  postgres.seedListings([
    {
      id: RESTROOM,
      establishmentId: EST,
      name: "Dunkin' Megamall",
      lat: 14.584,
      lng: 121.056,
      bidetType: "manual_spray",
      accessCost: "free",
      accessScope: "public",
      status: "active",
      verifyCount: 0,
      floorArea: "3F",
      restroomLabel: "Female",
    },
  ]);
}

function upsertInput(
  overrides: Partial<AdminUpsertRestroomInput> = {},
): AdminUpsertRestroomInput {
  return {
    placeId: PLACE_ID,
    name: "Dunkin' Megamall",
    formattedAddress: "EDSA, Mandaluyong",
    lat: 14.584,
    lng: 121.056,
    floorArea: "B1",
    restroomLabel: "PWD",
    bidetType: "built_in",
    hasTissue: false,
    hasSoap: true,
    hasHandDrying: true,
    accessCost: "paid",
    accessScope: "needs_patronage",
    photos: [],
    ...overrides,
  };
}

describe("adminUpsertRestroom / adminSetStatus / adminRemovePhoto", () => {
  it("rejects guests as unauthenticated for all admin ops", async () => {
    const { directory, postgres } = createHarness({ role: "guest" });
    seedBase(postgres);

    expect(await directory.adminUpsertRestroom(upsertInput())).toEqual({
      ok: false,
      error: "unauthenticated",
    });
    expect(
      await directory.adminSetStatus({
        restroomId: RESTROOM,
        status: "closed",
      }),
    ).toEqual({ ok: false, error: "unauthenticated" });
    expect(
      await directory.adminRemovePhoto({
        photoId: RESTROOM_PHOTO,
        kind: "restroom",
      }),
    ).toEqual({ ok: false, error: "unauthenticated" });
  });

  it("rejects non-admin users as forbidden for all admin ops", async () => {
    const { directory, postgres } = createHarness(alice);
    seedBase(postgres);

    expect(await directory.adminUpsertRestroom(upsertInput())).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(
      await directory.adminSetStatus({
        restroomId: RESTROOM,
        status: "closed",
      }),
    ).toEqual({ ok: false, error: "forbidden" });
    expect(
      await directory.adminRemovePhoto({
        photoId: RESTROOM_PHOTO,
        kind: "restroom",
      }),
    ).toEqual({ ok: false, error: "forbidden" });
    expect(postgres.restroomCount()).toBe(1);
  });

  it("lets admin seed a new listing with any fields and optional status", async () => {
    const { directory, postgres, storage } = createHarness(admin);
    postgres.seedProfiles([
      {
        id: admin.userId,
        displayName: admin.displayName,
        avatarUrl: admin.avatarUrl,
      },
    ]);

    const photoBytes = new Uint8Array([1, 2, 3]);
    const result = await directory.adminUpsertRestroom(
      upsertInput({
        placeId: "ChIJ_new_seed_place",
        name: "Seed Cafe",
        formattedAddress: "Makati Ave",
        lat: 14.55,
        lng: 121.02,
        status: "active",
        photos: [{ data: photoBytes, contentType: "image/webp" }],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.floorArea).toBe("B1");
    expect(result.value.restroomLabel).toBe("PWD");
    expect(result.value.bidetType).toBe("built_in");
    expect(result.value.hasBidet).toBe(true);
    expect(result.value.hasTissue).toBe(false);
    expect(result.value.accessCost).toBe("paid");
    expect(result.value.accessScope).toBe("needs_patronage");
    expect(result.value.status).toBe("active");
    expect(result.value.verifyCount).toBe(0);
    expect(result.value.communityVerified).toBe(false);
    expect(result.value.createdBy).toBe(admin.userId);
    expect(result.value.establishment.placeId).toBe("ChIJ_new_seed_place");
    expect(result.value.photos).toHaveLength(1);
    expect(
      storage.getObject(
        "restroom-photos",
        result.value.photos[0]!.storagePath,
      ),
    ).toEqual(photoBytes);
    expect(postgres.restroomCount()).toBe(1);
  });

  it("lets admin edit an existing listing including status and photos", async () => {
    const { directory, postgres, storage } = createHarness(admin);
    seedBase(postgres);
    postgres.seedRestroomPhotos([
      {
        id: RESTROOM_PHOTO,
        restroomId: RESTROOM,
        uploadedBy: alice.userId,
        storagePath: `${RESTROOM}/old.webp`,
        sortOrder: 0,
        removedAt: null,
      },
    ]);

    const photoBytes = new Uint8Array([9, 8, 7]);
    const result = await directory.adminUpsertRestroom(
      upsertInput({
        restroomId: RESTROOM,
        status: "closed",
        photos: [{ data: photoBytes, contentType: "image/webp" }],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.id).toBe(RESTROOM);
    expect(result.value.floorArea).toBe("B1");
    expect(result.value.restroomLabel).toBe("PWD");
    expect(result.value.status).toBe("closed");
    expect(result.value.photos).toHaveLength(1);
    expect(result.value.photos[0]?.id).not.toBe(RESTROOM_PHOTO);
    expect(
      storage.getObject(
        "restroom-photos",
        result.value.photos[0]!.storagePath,
      ),
    ).toEqual(photoBytes);

    const oldPhoto = postgres.photoById(RESTROOM_PHOTO, "restroom");
    expect(oldPhoto?.removedAt).not.toBeNull();
  });

  it("returns not_found when admin upsert targets a missing restroomId", async () => {
    const { directory, postgres } = createHarness(admin);
    seedBase(postgres);

    expect(
      await directory.adminUpsertRestroom(
        upsertInput({ restroomId: MISSING }),
      ),
    ).toEqual({ ok: false, error: "not_found" });
  });

  it.each([
    "active",
    "disputed",
    "closed",
    "archived",
  ] as const satisfies readonly RestroomStatus[])(
    "lets admin set status to %s",
    async (status) => {
      const { directory, postgres } = createHarness(admin);
      seedBase(postgres);

      const result = await directory.adminSetStatus({
        restroomId: RESTROOM,
        status,
      });
      expect(result).toEqual({ ok: true, value: undefined });

      const detail = await postgres.findRestroomDetail(RESTROOM);
      expect(detail?.status).toBe(status);

      if (status === "active") {
        const nearby = await directory.listNearby({
          lat: 14.584,
          lng: 121.056,
          radiusMeters: 500,
        });
        expect(nearby.ok).toBe(true);
        if (nearby.ok) {
          expect(nearby.value.map((r) => r.id)).toContain(RESTROOM);
        }
      } else {
        const nearby = await directory.listNearby({
          lat: 14.584,
          lng: 121.056,
          radiusMeters: 500,
        });
        expect(nearby.ok).toBe(true);
        if (nearby.ok) {
          expect(nearby.value.map((r) => r.id)).not.toContain(RESTROOM);
        }
      }
    },
  );

  it("returns not_found when adminSetStatus targets a missing listing", async () => {
    const { directory, postgres } = createHarness(admin);
    seedBase(postgres);

    expect(
      await directory.adminSetStatus({
        restroomId: MISSING,
        status: "archived",
      }),
    ).toEqual({ ok: false, error: "not_found" });
  });

  it("lets admin soft-remove restroom and review photos via removed_at", async () => {
    const { directory, postgres } = createHarness(admin);
    seedBase(postgres);
    postgres.seedRestroomPhotos([
      {
        id: RESTROOM_PHOTO,
        restroomId: RESTROOM,
        uploadedBy: alice.userId,
        storagePath: `${RESTROOM}/seed.webp`,
        sortOrder: 0,
        removedAt: null,
      },
    ]);
    postgres.seedReviews([
      {
        id: REVIEW,
        restroomId: RESTROOM,
        userId: alice.userId,
        stars: 4,
        comment: "Ok",
        cleanlinessOk: true,
        amenitiesOk: null,
        accessOk: null,
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
    postgres.seedReviewPhotos([
      {
        id: REVIEW_PHOTO,
        reviewId: REVIEW,
        storagePath: `${REVIEW}/shot.webp`,
        sortOrder: 0,
        removedAt: null,
      },
    ]);

    expect(
      await directory.adminRemovePhoto({
        photoId: RESTROOM_PHOTO,
        kind: "restroom",
      }),
    ).toEqual({ ok: true, value: undefined });
    expect(
      await directory.adminRemovePhoto({
        photoId: REVIEW_PHOTO,
        kind: "review",
      }),
    ).toEqual({ ok: true, value: undefined });

    expect(postgres.photoById(RESTROOM_PHOTO, "restroom")?.removedAt).not.toBeNull();
    expect(postgres.photoById(REVIEW_PHOTO, "review")?.removedAt).not.toBeNull();

    const detail = await directory.getRestroom({ id: RESTROOM });
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    expect(detail.value.photos).toEqual([]);
    expect(detail.value.reviews[0]?.photos).toEqual([]);
  });

  it("returns not_found for missing or already-removed photos", async () => {
    const { directory, postgres } = createHarness(admin);
    seedBase(postgres);
    postgres.seedRestroomPhotos([
      {
        id: RESTROOM_PHOTO,
        restroomId: RESTROOM,
        uploadedBy: alice.userId,
        storagePath: `${RESTROOM}/gone.webp`,
        sortOrder: 0,
        removedAt: "2026-01-03T00:00:00.000Z",
      },
    ]);

    expect(
      await directory.adminRemovePhoto({
        photoId: MISSING,
        kind: "restroom",
      }),
    ).toEqual({ ok: false, error: "not_found" });
    expect(
      await directory.adminRemovePhoto({
        photoId: RESTROOM_PHOTO,
        kind: "restroom",
      }),
    ).toEqual({ ok: false, error: "not_found" });
  });
});
