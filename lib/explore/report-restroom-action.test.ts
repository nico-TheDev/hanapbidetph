import { afterEach, describe, expect, it } from "vitest";

import { setExploreDirectoryOverride } from "@/lib/explore/directory";
import { reportReturnPath } from "@/lib/explore/detail-report";
import { reportRestroomAction } from "@/lib/explore/report-restroom-action";
import { createRestroomDirectory } from "@/lib/restroom-directory";
import { InMemoryAuth } from "@/lib/restroom-directory/fakes/in-memory-auth";
import { InMemoryGeolocation } from "@/lib/restroom-directory/fakes/in-memory-geolocation";
import { InMemoryPlaces } from "@/lib/restroom-directory/fakes/in-memory-places";
import { InMemoryPostgres } from "@/lib/restroom-directory/fakes/in-memory-postgres";
import { InMemoryStorage } from "@/lib/restroom-directory/fakes/in-memory-storage";
import type { Actor } from "@/lib/restroom-directory/ports/auth";

const EST = "11111111-1111-4111-8111-111111111111";
const RESTROOM = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const alice: Extract<Actor, { role: "user" }> = {
  role: "user",
  userId: "a1111111-1111-4111-8111-111111111111",
  displayName: "Alice A.",
  avatarUrl: null,
  isAdmin: false,
};

afterEach(() => {
  setExploreDirectoryOverride(null);
});

function harness(actor: Actor = alice) {
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
  setExploreDirectoryOverride(directory);
  return { auth, postgres, directory };
}

function seedRestroom(postgres: InMemoryPostgres): void {
  postgres.seedEstablishments([
    {
      id: EST,
      placeId: "ChIJ_test",
      name: "Ayala Mall",
      formattedAddress: "Makati",
      lat: 14.55,
      lng: 121.02,
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

describe("reportRestroomAction", () => {
  it("sends anonymous callers through auth-gate with report return path", async () => {
    const { postgres } = harness({ role: "guest" });
    seedRestroom(postgres);

    const result = await reportRestroomAction({
      restroomId: RESTROOM,
      reason: "doesnt_exist",
      details: null,
    });

    expect(result).toEqual({
      ok: false,
      error: "unauthenticated",
      message: "Sign in to report this restroom.",
      loginHref: `/login?next=${encodeURIComponent(reportReturnPath(RESTROOM))}`,
    });
  });

  it("submits reason + optional details and marks the listing disputed", async () => {
    const { postgres, directory } = harness(alice);
    seedRestroom(postgres);

    const result = await reportRestroomAction({
      restroomId: RESTROOM,
      reason: "wrong_location",
      details: "Across the street",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.isDisputed).toBe(true);
    expect(result.report).toMatchObject({
      restroomId: RESTROOM,
      reason: "wrong_location",
      details: "Across the street",
      status: "open",
    });

    const detail = await directory.getRestroom({ id: RESTROOM });
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    expect(detail.value.isDisputed).toBe(true);
  });

  it("returns a retryable error without clearing the listing", async () => {
    harness(alice);
    const result = await reportRestroomAction({
      restroomId: RESTROOM,
      reason: "doesnt_exist",
      details: null,
    });
    expect(result).toEqual({
      ok: false,
      error: "not_found",
      message: "This listing is no longer available.",
    });
  });
});
