import { describe, expect, it } from "vitest";

import {
  BROWSE_METRO_MANILA_CTA,
  COMING_SOON_OUTSIDE_COPY,
  ENABLE_LOCATION_BANNER,
} from "./map-copy";

describe("Explore map copy", () => {
  it("uses soft enable-location banner copy when geolocation is denied", () => {
    expect(ENABLE_LOCATION_BANNER.toLowerCase()).toContain("location");
    expect(ENABLE_LOCATION_BANNER.toLowerCase()).toContain("distance");
  });

  it("exposes coming-soon outside Metro Manila + browse CTA", () => {
    expect(COMING_SOON_OUTSIDE_COPY).toBe("Coming soon outside Metro Manila");
    expect(BROWSE_METRO_MANILA_CTA).toBe("Browse Metro Manila");
  });
});
