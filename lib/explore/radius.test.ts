import { describe, expect, it } from "vitest";

import {
  DEFAULT_NEARBY_RADIUS_METERS,
  MAX_NEARBY_RADIUS_METERS,
  RADIUS_SELECTOR_OPTIONS,
  RADIUS_STEPS_METERS,
  formatListingDistance,
  formatRadiusLabel,
} from "./radius";

describe("25 — radius selector wired to listNearby", () => {
  it("exposes 0.5 / 1 / 2 / 5 km steps with default 1 km and max 5 km", () => {
    expect(RADIUS_STEPS_METERS).toEqual([500, 1000, 2000, 5000]);
    expect(DEFAULT_NEARBY_RADIUS_METERS).toBe(1000);
    expect(MAX_NEARBY_RADIUS_METERS).toBe(5000);
    expect(RADIUS_SELECTOR_OPTIONS.map((o) => o.valueMeters)).toEqual(
      RADIUS_STEPS_METERS,
    );
    expect(RADIUS_SELECTOR_OPTIONS.map((o) => o.label)).toEqual([
      "0.5 km",
      "1 km",
      "2 km",
      "5 km",
    ]);
  });

  it("formats the current radius label for the top-bar control", () => {
    expect(formatRadiusLabel(500)).toBe("0.5 km");
    expect(formatRadiusLabel(1000)).toBe("1 km");
    expect(formatRadiusLabel(2000)).toBe("2 km");
    expect(formatRadiusLabel(5000)).toBe("5 km");
  });

  it("formats listing distances only when user location is known", () => {
    expect(formatListingDistance(50, true)).toBe("50 m");
    expect(formatListingDistance(999, true)).toBe("999 m");
    expect(formatListingDistance(1000, true)).toBe("1 km");
    expect(formatListingDistance(1500, true)).toBe("1.5 km");
    expect(formatListingDistance(50, false)).toBeNull();
    expect(formatListingDistance(1500, false)).toBeNull();
  });
});
