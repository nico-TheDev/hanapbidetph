import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import { InMemoryPostgres } from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";
import type { Actor } from "./ports/auth";
import type { ReportRestroomInput } from "./schemas";

const EST = "11111111-1111-4111-8111-111111111111";
const RESTROOM = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ARCHIVED = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const NEAR = { lat: 14.5583, lng: 121.0244 };
const ORIGIN = { lat: 14.5547, lng: 121.0244 };

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
      lat: NEAR.lat,
      lng: NEAR.lng,
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
      lat: NEAR.lat,
      lng: NEAR.lng,
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

function baseInput(
  overrides: Partial<ReportRestroomInput> = {},
): ReportRestroomInput {
  return {
    restroomId: RESTROOM,
    reason: "doesnt_exist",
    details: "Could not find it on 3F",
    ...overrides,
  };
}

describe("reportRestroom", () => {
  it("rejects guests", async () => {
    const { directory, postgres } = createHarness({ role: "guest" });
    seedActiveRestroom(postgres);

    const result = await directory.reportRestroom(baseInput());

    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(postgres.reportsFor(RESTROOM)).toEqual([]);
    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.status).toBe("active");
  });

  it("inserts a report with reason and optional details, sets disputed", async () => {
    const { directory, postgres } = createHarness();
    seedActiveRestroom(postgres);

    const result = await directory.reportRestroom(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toMatchObject({
      restroomId: RESTROOM,
      reason: "doesnt_exist",
      details: "Could not find it on 3F",
      status: "open",
    });
    expect(result.value.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(postgres.reportsFor(RESTROOM)).toHaveLength(1);

    const detail = await directory.getRestroom({ id: RESTROOM });
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    expect(detail.value.status).toBe("disputed");
    expect(detail.value.isDisputed).toBe(true);
  });

  it("allows null details and multiple open reports", async () => {
    const { auth, directory, postgres } = createHarness(alice);
    seedActiveRestroom(postgres);

    const first = await directory.reportRestroom(
      baseInput({ reason: "wrong_location", details: null }),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.details).toBeNull();

    auth.setActor(bob);
    const second = await directory.reportRestroom(
      baseInput({ reason: "permanently_closed", details: "Boarded up" }),
    );
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.id).not.toBe(first.value.id);
    expect(postgres.reportsFor(RESTROOM)).toHaveLength(2);

    const row = await postgres.findRestroomDetail(RESTROOM);
    expect(row?.status).toBe("disputed");
  });

  it("excludes disputed listings from listNearby after report", async () => {
    const { directory, postgres } = createHarness();
    seedActiveRestroom(postgres);

    const before = await directory.listNearby(ORIGIN);
    expect(before.ok).toBe(true);
    if (!before.ok) return;
    expect(before.value.map((r) => r.id)).toEqual([RESTROOM]);

    const reported = await directory.reportRestroom(baseInput());
    expect(reported.ok).toBe(true);

    const after = await directory.listNearby(ORIGIN);
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(after.value).toEqual([]);
  });

  it("rejects invalid reason and returns not_found for missing/archived", async () => {
    const { directory, postgres } = createHarness();
    seedActiveRestroom(postgres);
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

    const invalid = await directory.reportRestroom({
      restroomId: RESTROOM,
      reason: "not_a_reason" as ReportRestroomInput["reason"],
    });
    expect(invalid).toEqual({ ok: false, error: "validation_error" });

    const archived = await directory.reportRestroom(
      baseInput({ restroomId: ARCHIVED }),
    );
    expect(archived).toEqual({ ok: false, error: "not_found" });

    const missing = await directory.reportRestroom(
      baseInput({
        restroomId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      }),
    );
    expect(missing).toEqual({ ok: false, error: "not_found" });
  });
});
