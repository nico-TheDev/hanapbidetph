import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import { InMemoryPostgres } from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";
import type { RestroomDirectory } from "./restroom-directory";

const EST = "11111111-1111-4111-8111-111111111111";
const OTHER_EST = "22222222-2222-4222-8222-222222222222";

const ID = {
  primary: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  siblingActive: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  siblingDisputed: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  siblingArchived: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  otherPlace: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  disputed: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  archived: "99999999-9999-4999-8999-999999999999",
} as const;

const USER = {
  alice: "a1111111-1111-4111-8111-111111111111",
  bob: "b2222222-2222-4222-8222-222222222222",
} as const;

const PHOTO = {
  keep: "p1111111-1111-4111-8111-111111111111",
  removed: "p2222222-2222-4222-8222-222222222222",
  reviewKeep: "p3333333-3333-4333-8333-333333333333",
  reviewRemoved: "p4444444-4444-4444-8444-444444444444",
} as const;

const REVIEW = {
  newer: "r1111111-1111-4111-8111-111111111111",
  older: "r2222222-2222-4222-8222-222222222222",
} as const;

function createDirectory(postgres: InMemoryPostgres): RestroomDirectory {
  return createRestroomDirectory({
    auth: new InMemoryAuth(),
    places: new InMemoryPlaces(),
    postgres,
    storage: new InMemoryStorage(),
    geolocation: new InMemoryGeolocation(),
  });
}

function seedDetailFixture(postgres: InMemoryPostgres): void {
  postgres.seedProfiles([
    {
      id: USER.alice,
      displayName: "Alice A.",
      avatarUrl: "https://example.com/alice.jpg",
    },
    {
      id: USER.bob,
      displayName: "Bob B.",
      avatarUrl: null,
    },
  ]);

  postgres.seedEstablishments([
    {
      id: EST,
      placeId: "ChIJ_primary",
      name: "Ayala Mall",
      formattedAddress: "Makati Ave, Makati",
      lat: 14.5547,
      lng: 121.0244,
    },
    {
      id: OTHER_EST,
      placeId: "ChIJ_other",
      name: "Other Spot",
      formattedAddress: null,
      lat: 14.56,
      lng: 121.03,
    },
  ]);

  postgres.seedRestrooms([
    {
      id: ID.primary,
      establishmentId: EST,
      createdBy: USER.alice,
      floorArea: "3F, North wing",
      restroomLabel: "Female",
      bidetType: "manual_spray",
      hasTissue: true,
      hasSoap: true,
      hasHandDrying: false,
      accessCost: "free",
      accessScope: "public",
      status: "active",
      verifyCount: 3,
      ratingAvg: 4.5,
      ratingCount: 2,
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-10T10:00:00.000Z",
    },
    {
      id: ID.siblingActive,
      establishmentId: EST,
      createdBy: USER.bob,
      floorArea: "2F",
      restroomLabel: "Male",
      bidetType: "none",
      hasTissue: false,
      hasSoap: true,
      hasHandDrying: true,
      accessCost: "paid",
      accessScope: "needs_patronage",
      status: "active",
      verifyCount: 1,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: "2026-01-02T10:00:00.000Z",
      updatedAt: "2026-01-02T10:00:00.000Z",
    },
    {
      id: ID.siblingDisputed,
      establishmentId: EST,
      createdBy: null,
      floorArea: null,
      restroomLabel: "PWD",
      bidetType: "built_in",
      hasTissue: true,
      hasSoap: true,
      hasHandDrying: true,
      accessCost: "free",
      accessScope: "public",
      status: "disputed",
      verifyCount: 0,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: "2026-01-03T10:00:00.000Z",
      updatedAt: "2026-01-03T10:00:00.000Z",
    },
    {
      id: ID.siblingArchived,
      establishmentId: EST,
      createdBy: null,
      floorArea: null,
      restroomLabel: "Old",
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
      createdAt: "2026-01-04T10:00:00.000Z",
      updatedAt: "2026-01-04T10:00:00.000Z",
    },
    {
      id: ID.otherPlace,
      establishmentId: OTHER_EST,
      createdBy: null,
      floorArea: null,
      restroomLabel: null,
      bidetType: "high_pressure",
      hasTissue: true,
      hasSoap: true,
      hasHandDrying: true,
      accessCost: "free",
      accessScope: "public",
      status: "active",
      verifyCount: 5,
      ratingAvg: 5,
      ratingCount: 1,
      createdAt: "2026-01-05T10:00:00.000Z",
      updatedAt: "2026-01-05T10:00:00.000Z",
    },
    {
      id: ID.disputed,
      establishmentId: EST,
      createdBy: USER.alice,
      floorArea: "B1",
      restroomLabel: "All-gender",
      bidetType: "none",
      hasTissue: true,
      hasSoap: false,
      hasHandDrying: false,
      accessCost: "free",
      accessScope: "public",
      status: "disputed",
      verifyCount: 2,
      ratingAvg: 3,
      ratingCount: 1,
      createdAt: "2026-01-06T10:00:00.000Z",
      updatedAt: "2026-01-06T10:00:00.000Z",
    },
    {
      id: ID.archived,
      establishmentId: EST,
      createdBy: null,
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
      createdAt: "2026-01-07T10:00:00.000Z",
      updatedAt: "2026-01-07T10:00:00.000Z",
    },
  ]);

  postgres.seedRestroomPhotos([
    {
      id: PHOTO.keep,
      restroomId: ID.primary,
      storagePath: `${ID.primary}/${PHOTO.keep}.webp`,
      sortOrder: 0,
      removedAt: null,
    },
    {
      id: PHOTO.removed,
      restroomId: ID.primary,
      storagePath: `${ID.primary}/${PHOTO.removed}.webp`,
      sortOrder: 1,
      removedAt: "2026-01-09T00:00:00.000Z",
    },
  ]);

  postgres.seedReviews([
    {
      id: REVIEW.older,
      restroomId: ID.primary,
      userId: USER.alice,
      stars: 4,
      comment: "Decent",
      cleanlinessOk: true,
      amenitiesOk: true,
      accessOk: null,
      createdAt: "2026-01-08T08:00:00.000Z",
      updatedAt: "2026-01-08T08:00:00.000Z",
    },
    {
      id: REVIEW.newer,
      restroomId: ID.primary,
      userId: USER.bob,
      stars: 5,
      comment: "Great spray",
      cleanlinessOk: true,
      amenitiesOk: true,
      accessOk: true,
      createdAt: "2026-01-09T12:00:00.000Z",
      updatedAt: "2026-01-09T12:00:00.000Z",
    },
  ]);

  postgres.seedReviewPhotos([
    {
      id: PHOTO.reviewKeep,
      reviewId: REVIEW.newer,
      storagePath: `${REVIEW.newer}/${PHOTO.reviewKeep}.webp`,
      sortOrder: 0,
      removedAt: null,
    },
    {
      id: PHOTO.reviewRemoved,
      reviewId: REVIEW.newer,
      storagePath: `${REVIEW.newer}/${PHOTO.reviewRemoved}.webp`,
      sortOrder: 1,
      removedAt: "2026-01-09T13:00:00.000Z",
    },
  ]);
}

describe("07 — getRestroom + listSiblings", () => {
  it("returns full detail with non-removed photos and reviews newest-first", async () => {
    const postgres = new InMemoryPostgres();
    seedDetailFixture(postgres);
    const directory = createDirectory(postgres);

    const result = await directory.getRestroom({ id: ID.primary });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toMatchObject({
      id: ID.primary,
      establishment: {
        id: EST,
        placeId: "ChIJ_primary",
        name: "Ayala Mall",
        formattedAddress: "Makati Ave, Makati",
        lat: 14.5547,
        lng: 121.0244,
      },
      floorArea: "3F, North wing",
      restroomLabel: "Female",
      bidetType: "manual_spray",
      hasBidet: true,
      hasTissue: true,
      hasSoap: true,
      hasHandDrying: false,
      accessCost: "free",
      accessScope: "public",
      status: "active",
      verifyCount: 3,
      communityVerified: true,
      ratingAvg: 4.5,
      ratingCount: 2,
      isDisputed: false,
      createdBy: USER.alice,
    });

    expect(result.value.photos).toEqual([
      {
        id: PHOTO.keep,
        storagePath: `${ID.primary}/${PHOTO.keep}.webp`,
        publicUrl: `memory://restroom-photos/${ID.primary}/${PHOTO.keep}.webp`,
        sortOrder: 0,
      },
    ]);

    expect(result.value.reviews.map((r) => r.id)).toEqual([
      REVIEW.newer,
      REVIEW.older,
    ]);
    expect(result.value.reviews[0]).toMatchObject({
      id: REVIEW.newer,
      restroomId: ID.primary,
      stars: 5,
      comment: "Great spray",
      author: {
        userId: USER.bob,
        displayName: "Bob B.",
        avatarUrl: null,
      },
      photos: [
        {
          id: PHOTO.reviewKeep,
          storagePath: `${REVIEW.newer}/${PHOTO.reviewKeep}.webp`,
          publicUrl: `memory://review-photos/${REVIEW.newer}/${PHOTO.reviewKeep}.webp`,
          sortOrder: 0,
        },
      ],
    });
  });

  it("returns disputed listings with isDisputed true", async () => {
    const postgres = new InMemoryPostgres();
    seedDetailFixture(postgres);
    const directory = createDirectory(postgres);

    const result = await directory.getRestroom({ id: ID.disputed });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      id: ID.disputed,
      status: "disputed",
      isDisputed: true,
      hasBidet: false,
      communityVerified: false,
    });
  });

  it("returns not_found for archived or missing listings", async () => {
    const postgres = new InMemoryPostgres();
    seedDetailFixture(postgres);
    const directory = createDirectory(postgres);

    const archived = await directory.getRestroom({ id: ID.archived });
    expect(archived).toEqual({ ok: false, error: "not_found" });

    const missing = await directory.getRestroom({
      id: "00000000-0000-4000-8000-000000000000",
    });
    expect(missing).toEqual({ ok: false, error: "not_found" });
  });

  it("listSiblings returns other active restrooms at the same establishment", async () => {
    const postgres = new InMemoryPostgres();
    seedDetailFixture(postgres);
    const directory = createDirectory(postgres);

    const result = await directory.listSiblings({ restroomId: ID.primary });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.map((s) => s.id)).toEqual([ID.siblingActive]);
    expect(result.value[0]).toMatchObject({
      id: ID.siblingActive,
      floorArea: "2F",
      restroomLabel: "Male",
      bidetType: "none",
      hasBidet: false,
      verifyCount: 1,
      communityVerified: false,
      ratingAvg: null,
      ratingCount: 0,
    });
  });

  it("listSiblings returns not_found for archived or missing restrooms", async () => {
    const postgres = new InMemoryPostgres();
    seedDetailFixture(postgres);
    const directory = createDirectory(postgres);

    const archived = await directory.listSiblings({ restroomId: ID.archived });
    expect(archived).toEqual({ ok: false, error: "not_found" });

    const missing = await directory.listSiblings({
      restroomId: "00000000-0000-4000-8000-000000000000",
    });
    expect(missing).toEqual({ ok: false, error: "not_found" });
  });

  it("rejects invalid getRestroom and listSiblings input", async () => {
    const postgres = new InMemoryPostgres();
    const directory = createDirectory(postgres);

    const badDetail = await directory.getRestroom({ id: "not-a-uuid" });
    expect(badDetail).toEqual({ ok: false, error: "validation_error" });

    const badSiblings = await directory.listSiblings({
      restroomId: "also-bad",
    });
    expect(badSiblings).toEqual({ ok: false, error: "validation_error" });
  });
});
