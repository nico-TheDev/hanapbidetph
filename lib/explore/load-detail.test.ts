import { afterEach, describe, expect, it } from "vitest";

import { setExploreDirectoryOverride } from "@/lib/explore/directory";
import { loadRestroomDetailAction } from "@/lib/explore/load-detail-action";
import { toDetailContentView } from "@/lib/explore/detail-content";
import { createRestroomDirectory } from "@/lib/restroom-directory";
import { InMemoryAuth } from "@/lib/restroom-directory/fakes/in-memory-auth";
import { InMemoryGeolocation } from "@/lib/restroom-directory/fakes/in-memory-geolocation";
import { InMemoryPlaces } from "@/lib/restroom-directory/fakes/in-memory-places";
import { InMemoryPostgres } from "@/lib/restroom-directory/fakes/in-memory-postgres";
import { InMemoryStorage } from "@/lib/restroom-directory/fakes/in-memory-storage";

const EST = "11111111-1111-4111-8111-111111111111";
const ID = {
  primary: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  sibling: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  archived: "99999999-9999-4999-8999-999999999999",
} as const;
const USER = "a1111111-1111-4111-8111-111111111111";
const PHOTO = "p1111111-1111-4111-8111-111111111111";

afterEach(() => {
  setExploreDirectoryOverride(null);
});

function seedFixture(postgres: InMemoryPostgres): void {
  postgres.seedEstablishments([
    {
      id: EST,
      placeId: "ChIJ_primary",
      name: "Ayala Mall",
      formattedAddress: "Makati Ave, Makati",
      lat: 14.5547,
      lng: 121.0244,
    },
  ]);
  postgres.seedRestrooms([
    {
      id: ID.primary,
      establishmentId: EST,
      createdBy: USER,
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
      id: ID.sibling,
      establishmentId: EST,
      createdBy: null,
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
      id: ID.archived,
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
      createdAt: "2026-01-03T10:00:00.000Z",
      updatedAt: "2026-01-03T10:00:00.000Z",
    },
  ]);
  postgres.seedRestroomPhotos([
    {
      id: PHOTO,
      restroomId: ID.primary,
      storagePath: `${ID.primary}/${PHOTO}.webp`,
      sortOrder: 0,
      removedAt: null,
    },
  ]);
}

describe("30 — loadRestroomDetailAction", () => {
  it("returns getRestroom detail + listSiblings for the Explore shell", async () => {
    const postgres = new InMemoryPostgres();
    seedFixture(postgres);
    setExploreDirectoryOverride(
      createRestroomDirectory({
        auth: new InMemoryAuth(),
        places: new InMemoryPlaces(),
        postgres,
        storage: new InMemoryStorage(),
        geolocation: new InMemoryGeolocation(),
      }),
    );

    const result = await loadRestroomDetailAction(ID.primary);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.detail.establishment.name).toBe("Ayala Mall");
    expect(result.detail.communityVerified).toBe(true);
    expect(result.detail.photos).toHaveLength(1);
    expect(result.siblings.map((s) => s.id)).toEqual([ID.sibling]);
    expect(result.viewer).toBeNull();

    const view = toDetailContentView({
      detail: result.detail,
      siblings: result.siblings,
      distancesAvailable: true,
      nearby: {
        id: ID.primary,
        establishmentId: EST,
        name: "Ayala Mall",
        lat: 14.5547,
        lng: 121.0244,
        distanceMeters: 250,
        bidetType: "manual_spray",
        hasBidet: true,
        accessCost: "free",
        accessScope: "public",
        verifyCount: 3,
        communityVerified: true,
        ratingAvg: 4.5,
        ratingCount: 2,
        pinVariant: "bidet",
        floorArea: "3F, North wing",
        restroomLabel: "Female",
      },
    });
    expect(view.distanceLabel).toBe("250 m");
    expect(view.siblings[0]?.title).toBe("2F · Male");
    expect(view.mapsUrl).toContain("14.5547,121.0244");
  });

  it("returns not_found for archived listings", async () => {
    const postgres = new InMemoryPostgres();
    seedFixture(postgres);
    setExploreDirectoryOverride(
      createRestroomDirectory({
        auth: new InMemoryAuth(),
        places: new InMemoryPlaces(),
        postgres,
        storage: new InMemoryStorage(),
        geolocation: new InMemoryGeolocation(),
      }),
    );

    const result = await loadRestroomDetailAction(ID.archived);
    expect(result).toEqual({ ok: false, error: "not_found" });
  });
});
