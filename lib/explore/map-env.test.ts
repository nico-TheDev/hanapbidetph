import { afterEach, describe, expect, it, vi } from "vitest";

import { readMapEnvConfig } from "./map-env";

describe("readMapEnvConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads public Maps key, default center, and launch geo from TRD env names", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "maps-key");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT", "14.5995");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG", "120.9842");
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_GEO", "metro-manila");

    expect(readMapEnvConfig()).toEqual({
      googleMapsApiKey: "maps-key",
      defaultCenter: { lat: 14.5995, lng: 120.9842 },
      launchGeo: "metro-manila",
    });
  });

  it("falls back to Metro Manila center when default center env vars are empty", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT", "");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG", "");
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_GEO", "");

    const config = readMapEnvConfig();
    expect(config.defaultCenter.lat).toBeCloseTo(14.5995, 3);
    expect(config.defaultCenter.lng).toBeCloseTo(120.9842, 3);
    expect(config.launchGeo).toBe("metro-manila");
    expect(config.googleMapsApiKey).toBe("");
  });
});
