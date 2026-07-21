"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { clearExploreFilters } from "@/lib/explore/empty-state";
import {
  DEFAULT_EXPLORE_FILTERS,
  toggleFilterChip,
  type ExploreFilterChipId,
  type ExploreFilterState,
} from "@/lib/explore/filters";
import type { MapBanner } from "@/lib/explore/map-view";
import {
  DEFAULT_NEARBY_RADIUS_METERS,
  type RadiusStepMeters,
} from "@/lib/explore/radius";
import type { NearbyRestroom } from "@/lib/restroom-directory/schemas";

type SelectedIdUpdater =
  | string
  | null
  | ((prev: string | null) => string | null);

type ExploreSessionValue = {
  radiusMeters: RadiusStepMeters;
  setRadiusMeters: (meters: RadiusStepMeters) => void;
  filters: ExploreFilterState;
  toggleFilter: (chipId: ExploreFilterChipId) => void;
  clearFilters: () => void;
  listings: NearbyRestroom[];
  setListings: (listings: NearbyRestroom[]) => void;
  /** False until the first nearby load settles (avoids empty-state flash). */
  nearbyReady: boolean;
  setNearbyReady: (ready: boolean) => void;
  distancesAvailable: boolean;
  setDistancesAvailable: (available: boolean) => void;
  mapBanner: MapBanner;
  setMapBanner: (banner: MapBanner) => void;
  selectedId: string | null;
  setSelectedId: (next: SelectedIdUpdater) => void;
  isSignedIn: boolean;
};

const ExploreSessionContext = createContext<ExploreSessionValue | null>(null);

type ExploreSessionProviderProps = {
  children: ReactNode;
  /** From server session — gates Add CR empty-state hint. */
  isSignedIn?: boolean;
};

/** Shared Explore radius, filters, listings, and selection for top bar, map, sidebar. */
export function ExploreSessionProvider({
  children,
  isSignedIn = false,
}: ExploreSessionProviderProps) {
  const [radiusMeters, setRadiusMeters] = useState<RadiusStepMeters>(
    DEFAULT_NEARBY_RADIUS_METERS,
  );
  const [filters, setFilters] = useState<ExploreFilterState>(
    DEFAULT_EXPLORE_FILTERS,
  );
  const [listings, setListings] = useState<NearbyRestroom[]>([]);
  const [nearbyReady, setNearbyReady] = useState(false);
  const [distancesAvailable, setDistancesAvailable] = useState(false);
  const [mapBanner, setMapBanner] = useState<MapBanner>("none");
  const [selectedId, setSelectedIdState] = useState<string | null>(null);

  return (
    <ExploreSessionContext.Provider
      value={{
        radiusMeters,
        setRadiusMeters,
        filters,
        toggleFilter: (chipId) => {
          setFilters((current) => toggleFilterChip(current, chipId));
        },
        clearFilters: () => {
          setFilters(clearExploreFilters());
        },
        listings,
        setListings,
        nearbyReady,
        setNearbyReady,
        distancesAvailable,
        setDistancesAvailable,
        mapBanner,
        setMapBanner,
        selectedId,
        setSelectedId: (next) => {
          setSelectedIdState((prev) =>
            typeof next === "function" ? next(prev) : next,
          );
        },
        isSignedIn,
      }}
    >
      {children}
    </ExploreSessionContext.Provider>
  );
}

export function useExploreSession(): ExploreSessionValue {
  const ctx = useContext(ExploreSessionContext);
  if (!ctx) {
    throw new Error("useExploreSession must be used within ExploreSessionProvider");
  }
  return ctx;
}

/** Optional hook when chrome may render outside Explore (returns null). */
export function useOptionalExploreSession(): ExploreSessionValue | null {
  return useContext(ExploreSessionContext);
}
