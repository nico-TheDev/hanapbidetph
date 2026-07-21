import { afterEach, describe, expect, it } from "vitest";

import { setExploreDirectoryOverride } from "@/lib/explore/directory";
import { rateReturnPath } from "@/lib/explore/detail-rate";
import { upsertReviewAction } from "@/lib/explore/upsert-review-action";
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

afterEach(() => {
  setExploreDirectoryOverride(null);
});

function harness(actor: Actor = alice) {
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
  setExploreDirectoryOverride(directory);
  return { auth, postgres, directory, storage };
}

function seedRestroom(postgres: InMemoryPostgres): void {
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

describe("upsertReviewAction", () => {
  it("sends anonymous callers through auth-gate with rate return path", async () => {
    const { postgres } = harness({ role: "guest" });
    seedRestroom(postgres);

    const result = await upsertReviewAction({
      restroomId: RESTROOM,
      stars: 4,
      comment: "Nice",
      cleanlinessOk: true,
      amenitiesOk: null,
      accessOk: null,
      photos: [],
    });

    expect(result).toEqual({
      ok: false,
      error: "unauthenticated",
      message: "Sign in to rate this restroom.",
      loginHref: `/login?next=${encodeURIComponent(rateReturnPath(RESTROOM))}`,
    });
  });

  it("submits a new review with stars, checkboxes, comment, and up to 3 photos", async () => {
    const { postgres } = harness(alice);
    seedRestroom(postgres);

    const result = await upsertReviewAction({
      restroomId: RESTROOM,
      stars: 5,
      comment: "Great spray",
      cleanlinessOk: true,
      amenitiesOk: true,
      accessOk: false,
      photos: [
        { base64: Buffer.from([1, 2, 3]).toString("base64"), contentType: "image/webp" },
        { base64: Buffer.from([4, 5, 6]).toString("base64"), contentType: "image/webp" },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.review).toMatchObject({
      restroomId: RESTROOM,
      stars: 5,
      comment: "Great spray",
      cleanlinessOk: true,
      amenitiesOk: true,
      accessOk: false,
      author: { userId: alice.userId, displayName: "Alice A." },
    });
    expect(result.review.photos).toHaveLength(2);
    expect(result.ratingAvg).toBe(5);
    expect(result.ratingCount).toBe(1);

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.ratingCount).toBe(1);
    expect(detail?.reviews).toHaveLength(1);
  });

  it("updates an existing review in place and refreshes aggregates", async () => {
    const { auth, postgres } = harness(alice);
    seedRestroom(postgres);

    const first = await upsertReviewAction({
      restroomId: RESTROOM,
      stars: 3,
      comment: "Ok",
      cleanlinessOk: true,
      amenitiesOk: null,
      accessOk: null,
      photos: [],
    });
    expect(first.ok).toBe(true);

    auth.setActor(bob);
    await upsertReviewAction({
      restroomId: RESTROOM,
      stars: 5,
      comment: "Bob",
      cleanlinessOk: true,
      amenitiesOk: true,
      accessOk: true,
      photos: [],
    });

    auth.setActor(alice);
    const second = await upsertReviewAction({
      restroomId: RESTROOM,
      stars: 4,
      comment: "Better now",
      cleanlinessOk: true,
      amenitiesOk: true,
      accessOk: null,
      photos: [],
    });

    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.review.stars).toBe(4);
    expect(second.review.comment).toBe("Better now");
    expect(second.ratingCount).toBe(2);
    expect(second.ratingAvg).toBe(4.5);

    const detail = await postgres.findRestroomDetail(RESTROOM);
    expect(detail?.reviews).toHaveLength(2);
  });

  it("returns a retryable error without clearing the listing", async () => {
    harness(alice);
    const result = await upsertReviewAction({
      restroomId: RESTROOM,
      stars: 4,
      comment: null,
      cleanlinessOk: null,
      amenitiesOk: null,
      accessOk: null,
      photos: [],
    });

    expect(result).toEqual({
      ok: false,
      error: "not_found",
      message: "This listing is no longer available.",
    });
  });

  it("rejects more than 3 photos and invalid stars", async () => {
    const { postgres } = harness(alice);
    seedRestroom(postgres);

    const tooMany = await upsertReviewAction({
      restroomId: RESTROOM,
      stars: 4,
      comment: null,
      cleanlinessOk: null,
      amenitiesOk: null,
      accessOk: null,
      photos: [1, 2, 3, 4].map((n) => ({
        base64: Buffer.from([n]).toString("base64"),
        contentType: "image/webp",
      })),
    });
    expect(tooMany.ok).toBe(false);
    if (tooMany.ok) return;
    expect(tooMany.error).toBe("validation_error");

    const badStars = await upsertReviewAction({
      restroomId: RESTROOM,
      stars: 0,
      comment: null,
      cleanlinessOk: null,
      amenitiesOk: null,
      accessOk: null,
      photos: [],
    });
    expect(badStars.ok).toBe(false);
    if (badStars.ok) return;
    expect(badStars.error).toBe("validation_error");
  });
});
