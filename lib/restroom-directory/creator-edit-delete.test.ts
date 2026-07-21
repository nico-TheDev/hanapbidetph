import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import { InMemoryPostgres } from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";
import type { Actor } from "./ports/auth";
import type { UpdateRestroomInput } from "./schemas";

const EST = "11111111-1111-4111-8111-111111111111";
const RESTROOM = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const MISSING = "99999999-9999-4999-8999-999999999999";

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

function seedAliceRestroom(postgres: InMemoryPostgres): void {
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
    {
      id: admin.userId,
      displayName: admin.displayName,
      avatarUrl: admin.avatarUrl,
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

function editInput(
  overrides: Partial<UpdateRestroomInput> = {},
): UpdateRestroomInput {
  return {
    restroomId: RESTROOM,
    floorArea: "4F",
    restroomLabel: "PWD",
    bidetType: "built_in",
    hasTissue: false,
    hasSoap: true,
    hasHandDrying: true,
    accessCost: "paid",
    accessScope: "needs_patronage",
    ...overrides,
  };
}

describe("updateRestroom / deleteRestroom community-activity gate", () => {
  it("rejects guests for update and delete", async () => {
    const { directory, postgres } = createHarness({ role: "guest" });
    seedAliceRestroom(postgres);

    expect(await directory.updateRestroom(editInput())).toEqual({
      ok: false,
      error: "unauthenticated",
    });
    expect(await directory.deleteRestroom({ restroomId: RESTROOM })).toEqual({
      ok: false,
      error: "unauthenticated",
    });
  });

  it("lets creator edit amenities/labels when no other-user community activity", async () => {
    const { directory, postgres } = createHarness(alice);
    seedAliceRestroom(postgres);

    const result = await directory.updateRestroom(editInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.floorArea).toBe("4F");
    expect(result.value.restroomLabel).toBe("PWD");
    expect(result.value.bidetType).toBe("built_in");
    expect(result.value.hasBidet).toBe(true);
    expect(result.value.hasTissue).toBe(false);
    expect(result.value.hasSoap).toBe(true);
    expect(result.value.hasHandDrying).toBe(true);
    expect(result.value.accessCost).toBe("paid");
    expect(result.value.accessScope).toBe("needs_patronage");

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.floorArea).toBe("4F");
    expect(detail?.restroomLabel).toBe("PWD");
  });

  it("lets creator replace seed photos when no other-user community activity", async () => {
    const { directory, postgres, storage } = createHarness(alice);
    seedAliceRestroom(postgres);
    postgres.seedRestroomPhotos([
      {
        id: "p1111111-1111-4111-8111-111111111111",
        restroomId: RESTROOM,
        uploadedBy: alice.userId,
        storagePath: `${RESTROOM}/old.webp`,
        sortOrder: 0,
        removedAt: null,
      },
    ]);

    const photoBytes = new Uint8Array([9, 8, 7]);
    const result = await directory.updateRestroom(
      editInput({
        photos: [{ data: photoBytes, contentType: "image/webp" }],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.photos).toHaveLength(1);
    expect(result.value.photos[0]?.sortOrder).toBe(0);
    expect(result.value.photos[0]?.storagePath).toBe(
      `${RESTROOM}/${result.value.photos[0]?.id}.webp`,
    );
    expect(
      storage.getObject(
        "restroom-photos",
        result.value.photos[0]!.storagePath,
      ),
    ).toEqual(photoBytes);

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.photos).toHaveLength(1);
    expect(detail?.photos[0]?.id).toBe(result.value.photos[0]?.id);
  });

  it("lets creator hard-delete when no other-user community activity", async () => {
    const { directory, postgres } = createHarness(alice);
    seedAliceRestroom(postgres);

    const result = await directory.deleteRestroom({ restroomId: RESTROOM });

    expect(result).toEqual({ ok: true, value: undefined });
    expect(await postgres.findRestroomDetail(RESTROOM)).toBeNull();
    expect(postgres.restroomCount()).toBe(0);
  });

  it("blocks creator edit/delete after another user verifies", async () => {
    const { auth, directory, postgres } = createHarness(bob);
    seedAliceRestroom(postgres);

    const verify = await directory.verifyRestroom({ restroomId: RESTROOM });
    expect(verify.ok).toBe(true);

    auth.setActor(alice);

    expect(await directory.updateRestroom(editInput())).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(await directory.deleteRestroom({ restroomId: RESTROOM })).toEqual({
      ok: false,
      error: "forbidden",
    });

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.floorArea).toBe("3F");
    expect(postgres.restroomCount()).toBe(1);
  });

  it("blocks creator edit/delete after another user reviews", async () => {
    const { auth, directory, postgres } = createHarness(bob);
    seedAliceRestroom(postgres);

    const review = await directory.upsertReview({
      restroomId: RESTROOM,
      stars: 4,
      comment: "Ok",
    });
    expect(review.ok).toBe(true);

    auth.setActor(alice);

    expect(await directory.updateRestroom(editInput())).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(await directory.deleteRestroom({ restroomId: RESTROOM })).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(postgres.restroomCount()).toBe(1);
  });

  it("does not treat creator's own verify as community activity", async () => {
    const { directory, postgres } = createHarness(alice);
    seedAliceRestroom(postgres);

    const verify = await directory.verifyRestroom({ restroomId: RESTROOM });
    expect(verify.ok).toBe(true);

    const updated = await directory.updateRestroom(
      editInput({ floorArea: "B2" }),
    );
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.floorArea).toBe("B2");

    const deleted = await directory.deleteRestroom({ restroomId: RESTROOM });
    expect(deleted).toEqual({ ok: true, value: undefined });
    expect(postgres.restroomCount()).toBe(0);
  });

  it("forbids non-creator users from edit/delete", async () => {
    const { directory, postgres } = createHarness(bob);
    seedAliceRestroom(postgres);

    expect(await directory.updateRestroom(editInput())).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(await directory.deleteRestroom({ restroomId: RESTROOM })).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(postgres.restroomCount()).toBe(1);
  });

  it("lets admin edit and delete regardless of community activity", async () => {
    const { auth, directory, postgres } = createHarness(bob);
    seedAliceRestroom(postgres);

    const verify = await directory.verifyRestroom({ restroomId: RESTROOM });
    expect(verify.ok).toBe(true);
    const review = await directory.upsertReview({
      restroomId: RESTROOM,
      stars: 5,
    });
    expect(review.ok).toBe(true);

    auth.setActor(admin);

    const updated = await directory.updateRestroom(
      editInput({ floorArea: "Admin floor", restroomLabel: "Staff" }),
    );
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.floorArea).toBe("Admin floor");
    expect(updated.value.restroomLabel).toBe("Staff");

    const deleted = await directory.deleteRestroom({ restroomId: RESTROOM });
    expect(deleted).toEqual({ ok: true, value: undefined });
    expect(postgres.restroomCount()).toBe(0);
  });

  it("returns not_found for missing restroom", async () => {
    const { directory, postgres } = createHarness(alice);
    seedAliceRestroom(postgres);

    expect(
      await directory.updateRestroom(editInput({ restroomId: MISSING })),
    ).toEqual({ ok: false, error: "not_found" });
    expect(
      await directory.deleteRestroom({ restroomId: MISSING }),
    ).toEqual({ ok: false, error: "not_found" });
  });
});
