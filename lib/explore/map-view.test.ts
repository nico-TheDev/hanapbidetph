import { describe, expect, it } from "vitest";

import {
  isWithinLaunchGeo,
  METRO_MANILA_BOUNDS,
  resolveMapViewState,
} from "./map-view";

const METRO_CENTER = { lat: 14.5995, lng: 120.9842 };
const MAKATI = { lat: 14.5547, lng: 121.0244 };
const CEBU = { lat: 10.3157, lng: 123.8854 };

describe("isWithinLaunchGeo", () => {
  it("treats Metro Manila coordinates as in coverage when launch geo is metro-manila", () => {
    expect(isWithinLaunchGeo(MAKATI, "metro-manila")).toBe(true);
    expect(isWithinLaunchGeo(METRO_CENTER, "metro-manila")).toBe(true);
  });

  it("treats points outside NCR bounds as out of coverage", () => {
    expect(isWithinLaunchGeo(CEBU, "metro-manila")).toBe(false);
    expect(
      isWithinLaunchGeo(
        { lat: METRO_MANILA_BOUNDS.north + 0.01, lng: METRO_CENTER.lng },
        "metro-manila",
      ),
    ).toBe(false);
  });

  it("returns false for unknown launch geo flags", () => {
    expect(isWithinLaunchGeo(MAKATI, "cebu")).toBe(false);
    expect(isWithinLaunchGeo(MAKATI, "")).toBe(false);
  });
});

describe("resolveMapViewState", () => {
  const defaults = {
    defaultCenter: METRO_CENTER,
    launchGeo: "metro-manila",
    browseMetroManila: false,
  };

  it("centers on the user and enables distances when location is granted inside coverage", () => {
    const view = resolveMapViewState({
      ...defaults,
      geolocation: { status: "granted", position: MAKATI },
    });

    expect(view).toEqual({
      center: MAKATI,
      distancesAvailable: true,
      banner: "none",
      centerSource: "user",
    });
  });

  it("falls back to Metro Manila default when location is denied; distances omitted", () => {
    const view = resolveMapViewState({
      ...defaults,
      geolocation: { status: "denied" },
    });

    expect(view).toEqual({
      center: METRO_CENTER,
      distancesAvailable: false,
      banner: "enable_location",
      centerSource: "metro_manila_fallback",
    });
  });

  it("falls back to Metro Manila default when location is unavailable; distances omitted", () => {
    const view = resolveMapViewState({
      ...defaults,
      geolocation: { status: "unavailable" },
    });

    expect(view.center).toEqual(METRO_CENTER);
    expect(view.distancesAvailable).toBe(false);
    expect(view.banner).toBe("enable_location");
    expect(view.centerSource).toBe("metro_manila_fallback");
  });

  it("shows coming-soon when the user is outside launch geo", () => {
    const view = resolveMapViewState({
      ...defaults,
      geolocation: { status: "granted", position: CEBU },
    });

    expect(view).toEqual({
      center: CEBU,
      distancesAvailable: false,
      banner: "coming_soon_outside",
      centerSource: "user",
    });
  });

  it("Browse Metro Manila CTA moves center to default and clears coming-soon", () => {
    const view = resolveMapViewState({
      ...defaults,
      browseMetroManila: true,
      geolocation: { status: "granted", position: CEBU },
    });

    expect(view).toEqual({
      center: METRO_CENTER,
      distancesAvailable: false,
      banner: "none",
      centerSource: "metro_manila_browse",
    });
  });
});
