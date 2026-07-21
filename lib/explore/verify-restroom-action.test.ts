import { afterEach, describe, expect, it } from "vitest";

import { setExploreDirectoryOverride } from "@/lib/explore/directory";
import { verifyReturnPath } from "@/lib/explore/detail-verify";
import { verifyRestroomAction } from "@/lib/explore/verify-restroom-action";
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

function seedRestroom(postgres: InMemoryPostgres, verifyCount = 0): void {
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
      verifyCount,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ]);
}

describe("verifyRestroomAction", () => {
  it("sends anonymous callers through auth-gate with verify return path", async () => {
    const { postgres } = harness({ role: "guest" });
    seedRestroom(postgres);

    const result = await verifyRestroomAction(RESTROOM);

    expect(result).toEqual({
      ok: false,
      error: "unauthenticated",
      message: "Sign in to verify this restroom.",
      loginHref: `/login?next=${encodeURIComponent(verifyReturnPath(RESTROOM))}`,
    });
  });

  it("verifies once and treats a second attempt as already verified", async () => {
    const { auth, postgres } = harness(alice);
    seedRestroom(postgres, 0);

    const first = await verifyRestroomAction(RESTROOM);
    expect(first).toEqual({
      ok: true,
      restroomId: RESTROOM,
      verifyCount: 1,
      communityVerified: false,
      alreadyVerified: false,
    });

    const second = await verifyRestroomAction(RESTROOM);
    expect(second).toEqual({
      ok: true,
      restroomId: RESTROOM,
      verifyCount: 1,
      communityVerified: false,
      alreadyVerified: true,
    });

    auth.setActor(bob);
    await verifyRestroomAction(RESTROOM);
    auth.setActor(carol);
    const third = await verifyRestroomAction(RESTROOM);
    expect(third).toMatchObject({
      ok: true,
      verifyCount: 3,
      communityVerified: true,
      alreadyVerified: false,
    });
  });

  it("returns a retryable error without clearing the listing", async () => {
    harness(alice);
    // No seeded restroom → not_found from verifyRestroom.
    const result = await verifyRestroomAction(RESTROOM);
    expect(result).toEqual({
      ok: false,
      error: "not_found",
      message: "This listing is no longer available.",
    });
  });
});
