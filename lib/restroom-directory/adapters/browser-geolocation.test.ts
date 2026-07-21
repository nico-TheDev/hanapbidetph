import { describe, expect, it, vi } from "vitest";

import { BrowserGeolocation } from "@/lib/restroom-directory/adapters/browser-geolocation";

describe("BrowserGeolocation", () => {
  it("maps a successful navigator position to granted", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 14.55,
          longitude: 121.02,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON() {
            return {};
          },
        },
        timestamp: Date.now(),
        toJSON() {
          return {};
        },
      });
    });

    const geo = new BrowserGeolocation({
      geolocation: { getCurrentPosition },
    });

    await expect(geo.getCurrentPosition()).resolves.toEqual({
      status: "granted",
      position: { lat: 14.55, lng: 121.02 },
    });
  });

  it("maps PERMISSION_DENIED to denied", async () => {
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, error?: PositionErrorCallback) => {
        error?.({
          code: 1,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: "denied",
        } as GeolocationPositionError);
      },
    );

    const geo = new BrowserGeolocation({
      geolocation: { getCurrentPosition },
    });

    await expect(geo.getCurrentPosition()).resolves.toEqual({
      status: "denied",
    });
  });

  it("maps missing geolocation API to unavailable", async () => {
    const geo = new BrowserGeolocation({ geolocation: null });
    await expect(geo.getCurrentPosition()).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("maps POSITION_UNAVAILABLE and TIMEOUT to unavailable", async () => {
    const makeError =
      (code: number) =>
      (_success: PositionCallback, error?: PositionErrorCallback) => {
        error?.({
          code,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: "fail",
        } as GeolocationPositionError);
      };

    const unavailable = new BrowserGeolocation({
      geolocation: {
        getCurrentPosition: makeError(2),
      },
    });
    await expect(unavailable.getCurrentPosition()).resolves.toEqual({
      status: "unavailable",
    });

    const timeout = new BrowserGeolocation({
      geolocation: {
        getCurrentPosition: makeError(3),
      },
    });
    await expect(timeout.getCurrentPosition()).resolves.toEqual({
      status: "unavailable",
    });
  });
});
