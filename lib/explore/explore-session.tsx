"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_EXPLORE_FILTERS,
  toggleFilterChip,
  type ExploreFilterChipId,
  type ExploreFilterState,
} from "@/lib/explore/filters";
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
  listings: NearbyRestroom[];
  setListings: (listings: NearbyRestroom[]) => void;
  distancesAvailable: boolean;
  setDistancesAvailable: (available: boolean) => void;
  selectedId: string | null;
  setSelectedId: (next: SelectedIdUpdater) => void;
};

const ExploreSessionContext = createContext<ExploreSessionValue | null>(null);

/** Shared Explore radius, filters, listings, and selection for top bar, map, sidebar. */
export function ExploreSessionProvider({ children }: { children: ReactNode }) {
  const [radiusMeters, setRadiusMeters] = useState<RadiusStepMeters>(
    DEFAULT_NEARBY_RADIUS_METERS,
  );
  const [filters, setFilters] = useState<ExploreFilterState>(
    DEFAULT_EXPLORE_FILTERS,
  );
  const [listings, setListings] = useState<NearbyRestroom[]>([]);
  const [distancesAvailable, setDistancesAvailable] = useState(false);
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
        listings,
        setListings,
        distancesAvailable,
        setDistancesAvailable,
        selectedId,
        setSelectedId: (next) => {
          setSelectedIdState((prev) =>
            typeof next === "function" ? next(prev) : next,
          );
        },
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
