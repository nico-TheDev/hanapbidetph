"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

import { ExploreMapBanner } from "@/components/explore/explore-map-banner";
import { ExploreMapPins } from "@/components/explore/explore-map-pins";
import { useOptionalExploreSession } from "@/lib/explore/explore-session";
import { loadNearbyRestroomsAction } from "@/lib/explore/load-nearby-action";
import { readMapEnvConfig } from "@/lib/explore/map-env";
import {
  DEFAULT_EXPLORE_ZOOM,
  MAP_API_MISSING_COPY,
} from "@/lib/explore/map-copy";
import {
  DEFAULT_NEARBY_RADIUS_METERS,
  EXPLORE_MAP_ID,
  selectMapPinId,
  shouldLoadNearbyPins,
  syncSelectedPinId,
  toMapPinModels,
} from "@/lib/explore/map-pins";
import { resolveMapViewState } from "@/lib/explore/map-view";
import { BrowserGeolocation } from "@/lib/restroom-directory/adapters/browser-geolocation";
import type {
  GeolocationPort,
  GeolocationResult,
} from "@/lib/restroom-directory/ports/geolocation";
import type {
  LatLng,
  ListNearbyInput,
  NearbyRestroom,
} from "@/lib/restroom-directory/schemas";
import { cn } from "@/lib/utils";

type ExploreMapProps = {
  className?: string;
  /** Injected for tests / Storybook; defaults to browser geolocation. */
  geolocation?: GeolocationPort;
  /**
   * Controlled nearby listings. When omitted, loads via `loadNearby`
   * (defaults to `listNearby` server action).
   */
  listings?: NearbyRestroom[];
  /** Injected nearby loader (tests use RestroomDirectory fakes). */
  loadNearby?: (input: ListNearbyInput) => Promise<NearbyRestroom[]>;
  /** Radius in meters; defaults to session radius or 1 km. */
  radiusMeters?: number;
};

type CameraState = {
  center: LatLng;
  zoom: number;
};

/**
 * Full-bleed Google Map canvas for Explore. Requests location on mount;
 * denied/unavailable → Metro Manila fallback; outside launch geo → coming soon.
 * Pins render from `listNearby` with bidet / standard / unverified variants.
 * Radius changes (top-bar selector) refetch nearby and refresh pins.
 */
export function ExploreMap({
  className,
  geolocation,
  listings: controlledListings,
  loadNearby = loadNearbyRestroomsAction,
  radiusMeters: radiusMetersProp,
}: ExploreMapProps) {
  const session = useOptionalExploreSession();
  const setSessionListings = session?.setListings;
  const setSessionDistancesAvailable = session?.setDistancesAvailable;
  const radiusMeters =
    radiusMetersProp ?? session?.radiusMeters ?? DEFAULT_NEARBY_RADIUS_METERS;

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
  const [fetchedListings, setFetchedListings] = useState<NearbyRestroom[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const view = resolveMapViewState({
    geolocation: geoResult,
    defaultCenter: config.defaultCenter,
    launchGeo: config.launchGeo,
    browseMetroManila,
  });

  const listings = controlledListings ?? fetchedListings;
  const pins = toMapPinModels(listings, selectedId);

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

  // Publish distancesAvailable for sidebar distance labels.
  useEffect(() => {
    setSessionDistancesAvailable?.(view.distancesAvailable);
  }, [setSessionDistancesAvailable, view.distancesAvailable]);

  // Load nearby pins from `listNearby` when center / radius / banner allow.
  useEffect(() => {
    if (controlledListings !== undefined) {
      return;
    }
    if (!ready) {
      return;
    }
    if (!shouldLoadNearbyPins(view.banner)) {
      setFetchedListings([]);
      setSessionListings?.([]);
      setSelectedId(null);
      return;
    }

    let cancelled = false;
    void loadNearby({
      lat: view.center.lat,
      lng: view.center.lng,
      radiusMeters,
    }).then((next) => {
      if (cancelled) {
        return;
      }
      setFetchedListings(next);
      setSessionListings?.(next);
      setSelectedId((current) => syncSelectedPinId(current, next));
    });

    return () => {
      cancelled = true;
    };
  }, [
    controlledListings,
    ready,
    view.banner,
    view.center.lat,
    view.center.lng,
    view.centerSource,
    radiusMeters,
    loadNearby,
    setSessionListings,
  ]);

  // Controlled listings: keep selection + session list in sync when data changes.
  useEffect(() => {
    if (controlledListings === undefined) {
      return;
    }
    setSessionListings?.(controlledListings);
    setSelectedId((current) =>
      syncSelectedPinId(current, controlledListings),
    );
  }, [controlledListings, setSessionListings]);
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
      data-radius-meters={radiusMeters}
      data-pin-count={pins.length}
      data-selected-pin={selectedId ?? ""}
    >
      <APIProvider apiKey={config.googleMapsApiKey}>
        <Map
          className="absolute inset-0 h-full w-full"
          mapId={EXPLORE_MAP_ID}
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
        >
          <ExploreMapPins
            pins={pins}
            onSelect={(id) => setSelectedId(selectMapPinId(id))}
          />
        </Map>
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
