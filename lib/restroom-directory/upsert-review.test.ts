import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import { InMemoryPostgres } from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";
import type { Actor } from "./ports/auth";
import type { UpsertReviewInput } from "./schemas";

const EST = "11111111-1111-4111-8111-111111111111";
const RESTROOM = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ARCHIVED = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const alice: Extract<Actor, { role: "user" }> = {
  role: "user",
  userId: "a1111111-1111-4111-8111-111111111111",
  displayName: "Alice A.",
  avatarUrl: null,
  isAdmin: false,
};

const bob: Extract<Actor, { role: "user" }> = {
  role: "user",
  userId: "b2222222-2222-4222-8222-222222222222",
  displayName: "Bob B.",
  avatarUrl: "https://example.com/bob.png",
  isAdmin: false,
};

function createHarness(actor: Actor = alice) {
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

function seedActiveRestroom(postgres: InMemoryPostgres): void {
  postgres.seedProfiles([
    {
      id: alice.userId,
      displayName: alice.displayName,
      avatarUrl: alice.avatarUrl,
    },
    {
      id: bob.userId,
      displayName: bob.displayName,
      avatarUrl: bob.avatarUrl,
    },
  ]);
  postgres.seedEstablishments([
    {
      id: EST,
      placeId: "ChIJ_dunkin_megamall",
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
}

function baseInput(
  overrides: Partial<UpsertReviewInput> = {},
): UpsertReviewInput {
  return {
    restroomId: RESTROOM,
    stars: 4,
    comment: "Decent spray",
    cleanlinessOk: true,
    amenitiesOk: true,
    accessOk: null,
    photos: [],
    ...overrides,
  };
}

describe("upsertReview", () => {
  it("rejects guests", async () => {
    const { directory, postgres } = createHarness({ role: "guest" });
    seedActiveRestroom(postgres);

    const result = await directory.upsertReview(baseInput());

    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.ratingCount).toBe(0);
    expect(detail?.reviews).toEqual([]);
  });

  it("inserts a review with stars, checkboxes, comment, and up to 3 photos", async () => {
    const { directory, postgres, storage } = createHarness();
    seedActiveRestroom(postgres);
    const photoBytes = [
      new Uint8Array([1, 2, 3]),
      new Uint8Array([4, 5, 6]),
    ];

    const result = await directory.upsertReview(
      baseInput({
        photos: photoBytes.map((data) => ({
          data,
          contentType: "image/webp",
        })),
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toMatchObject({
      restroomId: RESTROOM,
      stars: 4,
      comment: "Decent spray",
      cleanlinessOk: true,
      amenitiesOk: true,
      accessOk: null,
      author: {
        userId: alice.userId,
        displayName: "Alice A.",
        avatarUrl: null,
      },
    });
    expect(result.value.photos).toHaveLength(2);
    for (const [i, photo] of result.value.photos.entries()) {
      expect(photo.storagePath).toBe(
        `${result.value.id}/${photo.id}.webp`,
      );
      expect(photo.sortOrder).toBe(i);
      expect(photo.publicUrl).toBe(
        `memory://review-photos/${photo.storagePath}`,
      );
      expect(storage.getObject("review-photos", photo.storagePath)).toEqual(
        photoBytes[i],
      );
    }

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.ratingCount).toBe(1);
    expect(detail?.ratingAvg).toBe(4);
    expect(detail?.reviews).toHaveLength(1);
    expect(detail?.reviews[0]?.id).toBe(result.value.id);
  });

  it("updates the caller's review in place (one per user per listing)", async () => {
    const { directory, postgres } = createHarness();
    seedActiveRestroom(postgres);

    const first = await directory.upsertReview(baseInput({ stars: 3 }));
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = await directory.upsertReview(
      baseInput({
        stars: 5,
        comment: "Much better now",
        cleanlinessOk: false,
        amenitiesOk: true,
        accessOk: true,
      }),
    );

    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.value.id).toBe(first.value.id);
    expect(second.value.stars).toBe(5);
    expect(second.value.comment).toBe("Much better now");
    expect(second.value.cleanlinessOk).toBe(false);
    expect(second.value.accessOk).toBe(true);
    expect(second.value.createdAt).toBe(first.value.createdAt);
    expect(
      new Date(second.value.updatedAt).getTime(),
    ).toBeGreaterThanOrEqual(new Date(first.value.updatedAt).getTime());

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.reviews).toHaveLength(1);
    expect(detail?.ratingCount).toBe(1);
    expect(detail?.ratingAvg).toBe(5);
  });

  it("enforces uniqueness across users and recomputes rating aggregates", async () => {
    const { auth, directory, postgres } = createHarness(alice);
    seedActiveRestroom(postgres);

    const aliceReview = await directory.upsertReview(
      baseInput({ stars: 4 }),
    );
    expect(aliceReview.ok).toBe(true);

    auth.setActor(bob);
    const bobReview = await directory.upsertReview(
      baseInput({
        stars: 2,
        comment: "Weak pressure",
        cleanlinessOk: null,
        amenitiesOk: false,
        accessOk: true,
      }),
    );
    expect(bobReview.ok).toBe(true);
    if (!bobReview.ok || !aliceReview.ok) return;

    expect(bobReview.value.id).not.toBe(aliceReview.value.id);

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.reviews).toHaveLength(2);
    expect(detail?.ratingCount).toBe(2);
    expect(detail?.ratingAvg).toBe(3);
  });

  it("returns reviews newest-first on detail after upsert", async () => {
    const { auth, directory, postgres } = createHarness(alice);
    seedActiveRestroom(postgres);

    const older = await directory.upsertReview(
      baseInput({ stars: 3, comment: "Older" }),
    );
    expect(older.ok).toBe(true);

    // Ensure distinct created_at ordering in the in-memory stand-in.
    await new Promise((r) => setTimeout(r, 5));

    auth.setActor(bob);
    const newer = await directory.upsertReview(
      baseInput({ stars: 5, comment: "Newer" }),
    );
    expect(newer.ok).toBe(true);
    if (!newer.ok || !older.ok) return;

    const detail = await directory.getRestroom({ id: RESTROOM });
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;

    expect(detail.value.reviews.map((r) => r.id)).toEqual([
      newer.value.id,
      older.value.id,
    ]);
    expect(detail.value.ratingCount).toBe(2);
    expect(detail.value.ratingAvg).toBe(4);
  });

  it("rejects more than 3 photos and invalid input", async () => {
    const { directory, postgres } = createHarness();
    seedActiveRestroom(postgres);

    const tooMany = await directory.upsertReview(
      baseInput({
        photos: [1, 2, 3, 4].map((n) => ({
          data: new Uint8Array([n]),
          contentType: "image/webp",
        })),
      }),
    );
    expect(tooMany).toEqual({ ok: false, error: "validation_error" });

    const badStars = await directory.upsertReview(
      baseInput({ stars: 6 }),
    );
    expect(badStars).toEqual({ ok: false, error: "validation_error" });

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.reviews).toEqual([]);
  });

  it("returns not_found for missing or archived listings", async () => {
    const { directory, postgres } = createHarness();
    postgres.seedProfiles([
      {
        id: alice.userId,
        displayName: alice.displayName,
        avatarUrl: alice.avatarUrl,
      },
    ]);
    postgres.seedEstablishments([
      {
        id: EST,
        placeId: "ChIJ_dunkin_megamall",
        name: "Dunkin' Megamall",
        formattedAddress: "EDSA, Mandaluyong",
        lat: 14.584,
        lng: 121.056,
      },
    ]);
    postgres.seedRestrooms([
      {
        id: ARCHIVED,
        establishmentId: EST,
        createdBy: alice.userId,
        floorArea: null,
        restroomLabel: null,
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
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const archived = await directory.upsertReview(
      baseInput({ restroomId: ARCHIVED }),
    );
    expect(archived).toEqual({ ok: false, error: "not_found" });

    const missing = await directory.upsertReview(
      baseInput({
        restroomId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      }),
    );
    expect(missing).toEqual({ ok: false, error: "not_found" });
  });
});
