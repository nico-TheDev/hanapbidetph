import { afterEach, describe, expect, it } from "vitest";

import { setExploreDirectoryOverride } from "@/lib/explore/directory";
import { loadNearbyRestroomsAction } from "@/lib/explore/load-nearby-action";
import {
  PIN_BIDET_FILL,
  PIN_STANDARD_FILL,
  toMapPinModels,
} from "@/lib/explore/map-pins";
import { createRestroomDirectory } from "@/lib/restroom-directory";
import { InMemoryAuth } from "@/lib/restroom-directory/fakes/in-memory-auth";
import { InMemoryGeolocation } from "@/lib/restroom-directory/fakes/in-memory-geolocation";
import { InMemoryPlaces } from "@/lib/restroom-directory/fakes/in-memory-places";
import { InMemoryPostgres } from "@/lib/restroom-directory/fakes/in-memory-postgres";
import { InMemoryStorage } from "@/lib/restroom-directory/fakes/in-memory-storage";

const ORIGIN = { lat: 14.5547, lng: 121.0244 };

const ID = {
  bidet: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  standardUnverified: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
};

afterEach(() => {
  setExploreDirectoryOverride(null);
});

describe("24 — loadNearbyRestroomsAction → map pins", () => {
  it("returns listNearby rows that map to teal / charcoal / unverified pins", async () => {
    const postgres = new InMemoryPostgres();
    postgres.seedListings([
      {
        id: ID.bidet,
        establishmentId: "11111111-1111-4111-8111-111111111111",
        name: "Bidet CR",
        lat: ORIGIN.lat,
        lng: ORIGIN.lng,
        bidetType: "manual_spray",
        accessCost: "free",
        accessScope: "public",
        verifyCount: 3,
        status: "active",
      },
      {
        id: ID.standardUnverified,
        establishmentId: "22222222-2222-4222-8222-222222222222",
        name: "Standard CR",
        lat: ORIGIN.lat + 0.001,
        lng: ORIGIN.lng,
        bidetType: "none",
        accessCost: "free",
        accessScope: "public",
        verifyCount: 0,
        status: "active",
      },
    ]);

    setExploreDirectoryOverride(
      createRestroomDirectory({
        auth: new InMemoryAuth(),
        places: new InMemoryPlaces(),
        postgres,
        storage: new InMemoryStorage(),
        geolocation: new InMemoryGeolocation(),
      }),
    );

    const listings = await loadNearbyRestroomsAction({
      ...ORIGIN,
      radiusMeters: 1000,
    });

    expect(listings.map((r) => r.id)).toEqual([ID.bidet, ID.standardUnverified]);
    expect(listings[0].pinVariant).toBe("bidet");
    expect(listings[1].pinVariant).toBe("standard_unverified");

    const pins = toMapPinModels(listings, ID.bidet);
    expect(pins[0]).toMatchObject({
      id: ID.bidet,
      lat: ORIGIN.lat,
      lng: ORIGIN.lng,
      selected: true,
      appearance: { fill: PIN_BIDET_FILL, unverified: false },
    });
    expect(pins[1]).toMatchObject({
      id: ID.standardUnverified,
      selected: false,
      appearance: { fill: PIN_STANDARD_FILL, unverified: true },
    });
  });
});
