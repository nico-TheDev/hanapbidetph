"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

import { ExploreEmptyStateView } from "@/components/explore/explore-empty-state";
import { ExploreMapBanner } from "@/components/explore/explore-map-banner";
import { ExploreMapPins } from "@/components/explore/explore-map-pins";
import { resolveExploreEmptyState } from "@/lib/explore/empty-state";
import { useOptionalExploreSession } from "@/lib/explore/explore-session";
import {
  DEFAULT_EXPLORE_FILTERS,
  toListNearbyFilters,
} from "@/lib/explore/filters";
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
import type { RadiusStepMeters } from "@/lib/explore/radius";
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
  /** Active filters; defaults to session filters. */
  filters?: ListNearbyInput["filters"];
};

type CameraState = {
  center: LatLng;
  zoom: number;
};

/**
 * Full-bleed Google Map canvas for Explore. Requests location on mount;
 * denied/unavailable → Metro Manila fallback; outside launch geo → coming soon.
 * Pins render from `listNearby` with bidet / standard / unverified variants.
 * Radius / filter changes (top bar) refetch nearby and refresh pins.
 */
export function ExploreMap({
  className,
  geolocation,
  listings: controlledListings,
  loadNearby = loadNearbyRestroomsAction,
  radiusMeters: radiusMetersProp,
  filters: filtersProp,
}: ExploreMapProps) {
  const session = useOptionalExploreSession();
  const setSessionListings = session?.setListings;
  const setSessionDistancesAvailable = session?.setDistancesAvailable;
  const setSessionMapBanner = session?.setMapBanner;
  const setSessionNearbyReady = session?.setNearbyReady;
  const radiusMeters =
    radiusMetersProp ?? session?.radiusMeters ?? DEFAULT_NEARBY_RADIUS_METERS;
  const sessionFilters = session?.filters;
  const clearFilters = session?.clearFilters;
  const setRadiusMeters = session?.setRadiusMeters;
  const isSignedIn = session?.isSignedIn ?? false;

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
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const selectedId = session ? session.selectedId : localSelectedId;
  const setSelectedId = session ? session.setSelectedId : setLocalSelectedId;

  const view = resolveMapViewState({
    geolocation: geoResult,
    defaultCenter: config.defaultCenter,
    launchGeo: config.launchGeo,
    browseMetroManila,
  });

  const listings = controlledListings ?? fetchedListings;
  const pins = toMapPinModels(listings, selectedId);
  const emptyFilters = sessionFilters ?? DEFAULT_EXPLORE_FILTERS;
  const emptyRadiusMeters = (session?.radiusMeters ??
    DEFAULT_NEARBY_RADIUS_METERS) as RadiusStepMeters;
  const empty = resolveExploreEmptyState({
    listingCount: listings.length,
    filters: emptyFilters,
    banner: view.banner,
    radiusMeters,
    isSignedIn,
  });
  const showEmptyOverlay =
    ready &&
    empty.kind !== "none" &&
    (controlledListings !== undefined || Boolean(session?.nearbyReady));

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

  // Publish distancesAvailable + banner for sidebar empty / distance labels.
  useEffect(() => {
    setSessionDistancesAvailable?.(view.distancesAvailable);
  }, [setSessionDistancesAvailable, view.distancesAvailable]);

  useEffect(() => {
    setSessionMapBanner?.(view.banner);
  }, [setSessionMapBanner, view.banner]);

  // Load nearby pins from `listNearby` when center / radius / filters / banner allow.
  useEffect(() => {
    if (controlledListings !== undefined) {
      setSessionNearbyReady?.(true);
      return;
    }
    if (!ready) {
      return;
    }
    if (!shouldLoadNearbyPins(view.banner)) {
      setFetchedListings([]);
      setSessionListings?.([]);
      setSelectedId(null);
      setSessionNearbyReady?.(true);
      return;
    }

    let cancelled = false;
    setSessionNearbyReady?.(false);
    const nextFilters =
      filtersProp ??
      (sessionFilters ? toListNearbyFilters(sessionFilters) : undefined);
    void loadNearby({
      lat: view.center.lat,
      lng: view.center.lng,
      radiusMeters,
      filters: nextFilters,
    }).then((next) => {
      if (cancelled) {
        return;
      }
      setFetchedListings(next);
      setSessionListings?.(next);
      setSelectedId((current) => syncSelectedPinId(current, next));
      setSessionNearbyReady?.(true);
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
    filtersProp,
    sessionFilters,
    loadNearby,
    setSessionListings,
    setSessionNearbyReady,
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

      {showEmptyOverlay ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden"
          data-chrome="explore-empty-overlay"
        >
          <ExploreEmptyStateView
            empty={empty}
            radiusMeters={emptyRadiusMeters}
            onWidenRadius={
              setRadiusMeters
                ? (meters) => setRadiusMeters(meters)
                : undefined
            }
            onClearFilters={clearFilters}
            variant="overlay"
            className="mb-16"
          />
        </div>
      ) : null}
    </div>
  );
}
