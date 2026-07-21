import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import { InMemoryPostgres } from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";
import type { Actor } from "./ports/auth";

const EST = "11111111-1111-4111-8111-111111111111";
const SURVIVOR = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const LOSER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
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

const carol: Extract<Actor, { role: "user" }> = {
  role: "user",
  userId: "c4444444-4444-4444-8444-444444444444",
  displayName: "Carol C.",
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
  return { auth, directory, postgres };
}

function seedPair(postgres: InMemoryPostgres): void {
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
      id: carol.userId,
      displayName: carol.displayName,
      avatarUrl: carol.avatarUrl,
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
      id: SURVIVOR,
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
      verifyCount: 1,
      ratingAvg: 4,
      ratingCount: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: LOSER,
      establishmentId: EST,
      createdBy: bob.userId,
      floorArea: "2F",
      restroomLabel: "Male",
      bidetType: "none",
      hasTissue: false,
      hasSoap: true,
      hasHandDrying: true,
      accessCost: "paid",
      accessScope: "needs_patronage",
      status: "active",
      verifyCount: 2,
      ratingAvg: 5,
      ratingCount: 1,
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    },
  ]);
  postgres.seedListings([
    {
      id: SURVIVOR,
      establishmentId: EST,
      name: "Dunkin' Megamall",
      lat: 14.584,
      lng: 121.056,
      bidetType: "manual_spray",
      accessCost: "free",
      accessScope: "public",
      status: "active",
      verifyCount: 1,
      ratingAvg: 4,
      ratingCount: 1,
      floorArea: "3F",
      restroomLabel: "Female",
    },
    {
      id: LOSER,
      establishmentId: EST,
      name: "Dunkin' Megamall",
      lat: 14.584,
      lng: 121.056,
      bidetType: "none",
      accessCost: "paid",
      accessScope: "needs_patronage",
      status: "active",
      verifyCount: 2,
      ratingAvg: 5,
      ratingCount: 1,
      floorArea: "2F",
      restroomLabel: "Male",
    },
  ]);
}

describe("adminMerge + listOpenReports", () => {
  it("rejects guests as unauthenticated", async () => {
    const { directory, postgres } = createHarness({ role: "guest" });
    seedPair(postgres);

    expect(
      await directory.adminMerge({ loserId: LOSER, survivorId: SURVIVOR }),
    ).toEqual({ ok: false, error: "unauthenticated" });
    expect(await directory.listOpenReports()).toEqual({
      ok: false,
      error: "unauthenticated",
    });
  });

  it("rejects non-admin users as forbidden", async () => {
    const { directory, postgres } = createHarness(alice);
    seedPair(postgres);

    expect(
      await directory.adminMerge({ loserId: LOSER, survivorId: SURVIVOR }),
    ).toEqual({ ok: false, error: "forbidden" });
    expect(await directory.listOpenReports()).toEqual({
      ok: false,
      error: "forbidden",
    });
  });

  it("archives loser, sets merged_into_id, and recalculates survivor aggregates", async () => {
    const { directory, postgres } = createHarness();
    seedPair(postgres);
    postgres.seedVerifies([
      {
        id: "v1111111-1111-4111-8111-111111111111",
        restroomId: SURVIVOR,
        userId: alice.userId,
        createdAt: "2026-01-01T01:00:00.000Z",
      },
      {
        id: "v2222222-2222-4222-8222-222222222222",
        restroomId: LOSER,
        userId: bob.userId,
        createdAt: "2026-01-02T01:00:00.000Z",
      },
      {
        id: "v3333333-3333-4333-8333-333333333333",
        restroomId: LOSER,
        userId: carol.userId,
        createdAt: "2026-01-02T02:00:00.000Z",
      },
    ]);
    postgres.seedReviews([
      {
        id: "r1111111-1111-4111-8111-111111111111",
        restroomId: SURVIVOR,
        userId: alice.userId,
        stars: 4,
        comment: "ok",
        cleanlinessOk: true,
        amenitiesOk: true,
        accessOk: true,
        createdAt: "2026-01-01T03:00:00.000Z",
        updatedAt: "2026-01-01T03:00:00.000Z",
      },
      {
        id: "r2222222-2222-4222-8222-222222222222",
        restroomId: LOSER,
        userId: bob.userId,
        stars: 5,
        comment: "great",
        cleanlinessOk: true,
        amenitiesOk: null,
        accessOk: null,
        createdAt: "2026-01-02T03:00:00.000Z",
        updatedAt: "2026-01-02T03:00:00.000Z",
      },
    ]);

    expect(
      await directory.adminMerge({ loserId: LOSER, survivorId: SURVIVOR }),
    ).toEqual({ ok: true, value: undefined });

    const loser = postgres.restroomById(LOSER);
    expect(loser?.status).toBe("archived");
    expect(loser?.mergedIntoId).toBe(SURVIVOR);

    const survivor = postgres.restroomById(SURVIVOR);
    expect(survivor?.status).toBe("active");
    expect(survivor?.verifyCount).toBe(3);
    expect(survivor?.ratingCount).toBe(2);
    expect(survivor?.ratingAvg).toBe(4.5);

    const detail = await directory.getRestroom({ id: SURVIVOR });
    expect(detail).toMatchObject({
      ok: true,
      value: {
        verifyCount: 3,
        communityVerified: true,
        ratingCount: 2,
        ratingAvg: 4.5,
      },
    });

    // Loser leaves the nearby map (archived).
    const nearby = await directory.listNearby({
      lat: 14.584,
      lng: 121.056,
      radiusMeters: 1000,
    });
    expect(nearby.ok && nearby.value.map((r) => r.id)).toEqual([SURVIVOR]);
  });

  it("skips duplicate verifiers and reviews without UNIQUE violations", async () => {
    const { directory, postgres } = createHarness();
    seedPair(postgres);
    postgres.seedVerifies([
      {
        id: "v1111111-1111-4111-8111-111111111111",
        restroomId: SURVIVOR,
        userId: alice.userId,
        createdAt: "2026-01-01T01:00:00.000Z",
      },
      {
        id: "v2222222-2222-4222-8222-222222222222",
        restroomId: LOSER,
        userId: alice.userId,
        createdAt: "2026-01-02T01:00:00.000Z",
      },
      {
        id: "v3333333-3333-4333-8333-333333333333",
        restroomId: LOSER,
        userId: bob.userId,
        createdAt: "2026-01-02T02:00:00.000Z",
      },
    ]);
    postgres.seedReviews([
      {
        id: "r1111111-1111-4111-8111-111111111111",
        restroomId: SURVIVOR,
        userId: alice.userId,
        stars: 3,
        comment: "survivor",
        cleanlinessOk: null,
        amenitiesOk: null,
        accessOk: null,
        createdAt: "2026-01-01T03:00:00.000Z",
        updatedAt: "2026-01-01T03:00:00.000Z",
      },
      {
        id: "r2222222-2222-4222-8222-222222222222",
        restroomId: LOSER,
        userId: alice.userId,
        stars: 5,
        comment: "loser duplicate",
        cleanlinessOk: null,
        amenitiesOk: null,
        accessOk: null,
        createdAt: "2026-01-02T03:00:00.000Z",
        updatedAt: "2026-01-02T03:00:00.000Z",
      },
      {
        id: "r3333333-3333-4333-8333-333333333333",
        restroomId: LOSER,
        userId: bob.userId,
        stars: 4,
        comment: "unique",
        cleanlinessOk: true,
        amenitiesOk: true,
        accessOk: true,
        createdAt: "2026-01-02T04:00:00.000Z",
        updatedAt: "2026-01-02T04:00:00.000Z",
      },
    ]);

    expect(
      await directory.adminMerge({ loserId: LOSER, survivorId: SURVIVOR }),
    ).toEqual({ ok: true, value: undefined });

    expect(postgres.verifiesFor(SURVIVOR).map((v) => v.userId).sort()).toEqual(
      [alice.userId, bob.userId].sort(),
    );
    // Duplicate alice verify stays on archived loser (not moved).
    expect(postgres.verifiesFor(LOSER).map((v) => v.userId)).toEqual([
      alice.userId,
    ]);

    const survivorReviews = postgres.reviewsFor(SURVIVOR);
    expect(survivorReviews.map((r) => r.userId).sort()).toEqual(
      [alice.userId, bob.userId].sort(),
    );
    expect(
      survivorReviews.find((r) => r.userId === alice.userId)?.comment,
    ).toBe("survivor");
    expect(postgres.reviewsFor(LOSER).map((r) => r.userId)).toEqual([
      alice.userId,
    ]);

    const survivor = postgres.restroomById(SURVIVOR);
    expect(survivor?.verifyCount).toBe(2);
    expect(survivor?.ratingCount).toBe(2);
    expect(survivor?.ratingAvg).toBe(3.5);
  });

  it("returns not_found when loser or survivor is missing", async () => {
    const { directory, postgres } = createHarness();
    seedPair(postgres);

    expect(
      await directory.adminMerge({ loserId: MISSING, survivorId: SURVIVOR }),
    ).toEqual({ ok: false, error: "not_found" });
    expect(
      await directory.adminMerge({ loserId: LOSER, survivorId: MISSING }),
    ).toEqual({ ok: false, error: "not_found" });
  });

  it("rejects merge of a listing into itself", async () => {
    const { directory, postgres } = createHarness();
    seedPair(postgres);

    expect(
      await directory.adminMerge({ loserId: SURVIVOR, survivorId: SURVIVOR }),
    ).toEqual({ ok: false, error: "validation_error" });
  });

  it("listOpenReports returns open reports ordered by created_at", async () => {
    const { directory, postgres } = createHarness();
    seedPair(postgres);
    postgres.seedReports([
      {
        id: "p2222222-2222-4222-8222-222222222222",
        restroomId: SURVIVOR,
        reporterId: bob.userId,
        reason: "wrong_location",
        details: "second",
        status: "open",
        createdAt: "2026-03-02T00:00:00.000Z",
      },
      {
        id: "p1111111-1111-4111-8111-111111111111",
        restroomId: LOSER,
        reporterId: alice.userId,
        reason: "doesnt_exist",
        details: "first",
        status: "open",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
      {
        id: "p3333333-3333-4333-8333-333333333333",
        restroomId: SURVIVOR,
        reporterId: carol.userId,
        reason: "inappropriate_photos",
        details: "closed out",
        status: "dismissed",
        createdAt: "2026-03-03T00:00:00.000Z",
      },
      {
        id: "p4444444-4444-4444-8444-444444444444",
        restroomId: LOSER,
        reporterId: bob.userId,
        reason: "permanently_closed",
        details: "reviewed",
        status: "reviewed",
        createdAt: "2026-02-28T00:00:00.000Z",
      },
    ]);

    const result = await directory.listOpenReports();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.map((r) => r.id)).toEqual([
      "p1111111-1111-4111-8111-111111111111",
      "p2222222-2222-4222-8222-222222222222",
    ]);
    expect(result.value[0]).toMatchObject({
      restroomId: LOSER,
      reason: "doesnt_exist",
      details: "first",
      status: "open",
      restroomName: "Dunkin' Megamall",
      reporterDisplayName: "Alice A.",
      createdAt: "2026-03-01T00:00:00.000Z",
    });
    expect(result.value[1]).toMatchObject({
      restroomId: SURVIVOR,
      reason: "wrong_location",
      details: "second",
      status: "open",
      restroomName: "Dunkin' Megamall",
      reporterDisplayName: "Bob B.",
      createdAt: "2026-03-02T00:00:00.000Z",
    });
  });
});
