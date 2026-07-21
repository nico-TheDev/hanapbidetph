"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

import { ExploreMapBanner } from "@/components/explore/explore-map-banner";
import { readMapEnvConfig } from "@/lib/explore/map-env";
import {
  DEFAULT_EXPLORE_ZOOM,
  MAP_API_MISSING_COPY,
} from "@/lib/explore/map-copy";
import { resolveMapViewState } from "@/lib/explore/map-view";
import { BrowserGeolocation } from "@/lib/restroom-directory/adapters/browser-geolocation";
import type {
  GeolocationPort,
  GeolocationResult,
} from "@/lib/restroom-directory/ports/geolocation";
import type { LatLng } from "@/lib/restroom-directory/schemas";
import { cn } from "@/lib/utils";

type ExploreMapProps = {
  className?: string;
  /** Injected for tests / Storybook; defaults to browser geolocation. */
  geolocation?: GeolocationPort;
};

type CameraState = {
  center: LatLng;
  zoom: number;
};

/**
 * Full-bleed Google Map canvas for Explore. Requests location on mount;
 * denied/unavailable → Metro Manila fallback; outside launch geo → coming soon.
 */
export function ExploreMap({ className, geolocation }: ExploreMapProps) {
  const [config] = useState(() => readMapEnvConfig());
  const [browseMetroManila, setBrowseMetroManila] = useState(false);
  const [geoResult, setGeoResult] = useState<GeolocationResult>({
    status: "unavailable",
  });
  const [ready, setReady] = useState(false);
  const [camera, setCamera] = useState<CameraState>({
    center: config.defaultCenter,
    zoom: DEFAULT_EXPLORE_ZOOM,
  });

  const view = resolveMapViewState({
    geolocation: geoResult,
    defaultCenter: config.defaultCenter,
    launchGeo: config.launchGeo,
    browseMetroManila,
  });

  useEffect(() => {
    let cancelled = false;
    const port = geolocation ?? new BrowserGeolocation();

    void port.getCurrentPosition().then((result) => {
      if (cancelled) {
        return;
      }
      setGeoResult(result);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [geolocation]);

  // Sync programmatic camera jumps (initial resolve + Browse Metro Manila).
  useEffect(() => {
    setCamera({ center: view.center, zoom: DEFAULT_EXPLORE_ZOOM });
  }, [view.center.lat, view.center.lng, view.centerSource]);

  if (!config.googleMapsApiKey) {
    return (
      <div
        className={cn(
          "bg-secondary/40 text-muted-foreground relative flex h-full min-h-[50vh] flex-1 items-center justify-center p-8 text-center text-sm",
          className,
        )}
        data-shell="map-canvas"
        data-map-status="missing-key"
      >
        <p>{MAP_API_MISSING_COPY}</p>
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-full min-h-[50vh] w-full flex-1", className)}
      data-shell="map-canvas"
      data-map-ready={ready ? "true" : "false"}
      data-distances-available={view.distancesAvailable ? "true" : "false"}
      data-center-source={view.centerSource}
    >
      <APIProvider apiKey={config.googleMapsApiKey}>
        <Map
          className="absolute inset-0 h-full w-full"
          defaultCenter={config.defaultCenter}
          defaultZoom={DEFAULT_EXPLORE_ZOOM}
          center={camera.center}
          zoom={camera.zoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          onCameraChanged={(event) => {
            setCamera({
              center: event.detail.center,
              zoom: event.detail.zoom,
            });
          }}
        />
      </APIProvider>

      <ExploreMapBanner
        banner={view.banner}
        onBrowseMetroManila={
          view.banner === "coming_soon_outside"
            ? () => setBrowseMetroManila(true)
            : undefined
        }
      />
    </div>
  );
}
