import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import { InMemoryPostgres } from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";
import type { Actor } from "./ports/auth";

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
  avatarUrl: null,
  isAdmin: false,
};

const carol: Extract<Actor, { role: "user" }> = {
  role: "user",
  userId: "c3333333-3333-4333-8333-333333333333",
  displayName: "Carol C.",
  avatarUrl: null,
  isAdmin: false,
};

function createHarness(actor: Actor = alice) {
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

function seedActiveRestroom(
  postgres: InMemoryPostgres,
  verifyCount = 0,
): void {
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
      verifyCount,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ]);
}

describe("verifyRestroom", () => {
  it("rejects guests", async () => {
    const { directory, postgres } = createHarness({ role: "guest" });
    seedActiveRestroom(postgres);

    const result = await directory.verifyRestroom({ restroomId: RESTROOM });

    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(postgres.restroomCount()).toBe(1);
  });

  it("records a verify and increments verify_count without creating a listing", async () => {
    const { directory, postgres } = createHarness();
    seedActiveRestroom(postgres);
    expect(postgres.restroomCount()).toBe(1);

    const result = await directory.verifyRestroom({ restroomId: RESTROOM });

    expect(result).toEqual({
      ok: true,
      value: {
        restroomId: RESTROOM,
        verifyCount: 1,
        communityVerified: false,
      },
    });
    expect(postgres.restroomCount()).toBe(1);

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.verifyCount).toBe(1);
  });

  it("rejects a second verify from the same user (uniqueness)", async () => {
    const { directory, postgres } = createHarness();
    seedActiveRestroom(postgres);

    const first = await directory.verifyRestroom({ restroomId: RESTROOM });
    expect(first.ok).toBe(true);

    const duplicate = await directory.verifyRestroom({
      restroomId: RESTROOM,
    });
    expect(duplicate).toEqual({ ok: false, error: "conflict" });

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.verifyCount).toBe(1);
  });

  it("sets communityVerified at ≥3 distinct verifiers", async () => {
    const { auth, directory, postgres } = createHarness(alice);
    seedActiveRestroom(postgres);

    const first = await directory.verifyRestroom({ restroomId: RESTROOM });
    expect(first).toEqual({
      ok: true,
      value: {
        restroomId: RESTROOM,
        verifyCount: 1,
        communityVerified: false,
      },
    });

    auth.setActor(bob);
    const second = await directory.verifyRestroom({ restroomId: RESTROOM });
    expect(second).toEqual({
      ok: true,
      value: {
        restroomId: RESTROOM,
        verifyCount: 2,
        communityVerified: false,
      },
    });

    auth.setActor(carol);
    const third = await directory.verifyRestroom({ restroomId: RESTROOM });
    expect(third).toEqual({
      ok: true,
      value: {
        restroomId: RESTROOM,
        verifyCount: 3,
        communityVerified: true,
      },
    });

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.verifyCount).toBe(3);
  });

  it("duplicate-add same-CR path verifies existing listing instead of creating", async () => {
    const { directory, postgres } = createHarness(bob);
    seedActiveRestroom(postgres, 0);
    const before = postgres.restroomCount();

    // Add-flow shortcut: user confirms "same CR" → verifyRestroom, not addRestroom.
    const result = await directory.verifyRestroom({ restroomId: RESTROOM });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.verifyCount).toBe(1);
    expect(result.value.communityVerified).toBe(false);
    expect(postgres.restroomCount()).toBe(before);

    const siblings = await postgres.findActiveRestroomsByPlaceId(
      "ChIJ_dunkin_megamall",
    );
    expect(siblings).toHaveLength(1);
    expect(siblings[0]?.id).toBe(RESTROOM);
  });

  it("returns not_found for missing or archived listings", async () => {
    const { directory, postgres } = createHarness();
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

    const archived = await directory.verifyRestroom({
      restroomId: ARCHIVED,
    });
    expect(archived).toEqual({ ok: false, error: "not_found" });

    const missing = await directory.verifyRestroom({
      restroomId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    });
    expect(missing).toEqual({ ok: false, error: "not_found" });
  });

  it("rejects invalid restroomId", async () => {
    const { directory } = createHarness();
    const result = await directory.verifyRestroom({
      restroomId: "not-a-uuid",
    });
    expect(result).toEqual({ ok: false, error: "validation_error" });
  });
});
