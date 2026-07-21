import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "./create-restroom-directory";
import { InMemoryAuth } from "./fakes/in-memory-auth";
import { InMemoryGeolocation } from "./fakes/in-memory-geolocation";
import { InMemoryPlaces } from "./fakes/in-memory-places";
import { InMemoryPostgres } from "./fakes/in-memory-postgres";
import { InMemoryStorage } from "./fakes/in-memory-storage";

describe("RestroomDirectory seam", () => {
  it("wires adapters and returns an empty nearby list", async () => {
    const directory = createRestroomDirectory({
      auth: new InMemoryAuth(),
      places: new InMemoryPlaces(),
      postgres: new InMemoryPostgres(),
      storage: new InMemoryStorage(),
      geolocation: new InMemoryGeolocation(),
    });

    const result = await directory.listNearby({
      lat: 14.5547,
      lng: 121.0244,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });
});
