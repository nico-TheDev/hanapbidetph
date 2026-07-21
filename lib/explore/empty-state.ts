import {
  DEFAULT_EXPLORE_FILTERS,
  toListNearbyFilters,
  type ExploreFilterState,
} from "@/lib/explore/filters";
import type { MapBanner } from "@/lib/explore/map-view";
import {
  RADIUS_STEPS_METERS,
  type RadiusStepMeters,
} from "@/lib/explore/radius";

/** APPFLOW: in-coverage zero pins. */
export const NO_RESTROOMS_NEARBY_TITLE = "No restrooms nearby";

export const WIDEN_RADIUS_HINT =
  "Try widening the search radius to look farther.";

export const CLEAR_FILTERS_HINT =
  "Clear filters to see more restrooms in this area.";

export const CLEAR_FILTERS_CTA = "Clear filters";

export const WIDEN_RADIUS_CTA = "Widen radius";

export const ADD_CR_HINT =
  "Know a comfort room nearby? Add it from the Add CR tab.";

export const ADD_CR_CTA = "Add CR";

export const ADD_CR_HREF = "/add";

export type ExploreEmptyKind = "none" | "zero_nearby" | "filters_hide_all";

export type ExploreEmptyState = {
  kind: ExploreEmptyKind;
  title: string | null;
  body: string | null;
  emphasizeClearFilters: boolean;
  showWidenRadius: boolean;
  showClearFilters: boolean;
  showAddCrHint: boolean;
};

const NONE: ExploreEmptyState = {
  kind: "none",
  title: null,
  body: null,
  emphasizeClearFilters: false,
  showWidenRadius: false,
  showClearFilters: false,
  showAddCrHint: false,
};

export type ResolveExploreEmptyStateInput = {
  listingCount: number;
  filters: ExploreFilterState;
  /** Map banner from ticket 23 — outside coverage suppresses nearby empty copy. */
  banner: MapBanner;
  radiusMeters: number;
  isSignedIn: boolean;
};

/** Next radius step above current, or null at the 5 km max. */
export function nextWiderRadius(
  radiusMeters: number,
): RadiusStepMeters | null {
  const index = RADIUS_STEPS_METERS.indexOf(
    radiusMeters as RadiusStepMeters,
  );
  if (index < 0 || index >= RADIUS_STEPS_METERS.length - 1) {
    return null;
  }
  return RADIUS_STEPS_METERS[index + 1]!;
}

/** Reset chip state to defaults (no active listNearby filters). */
export function clearExploreFilters(): ExploreFilterState {
  return { ...DEFAULT_EXPLORE_FILTERS };
}

/**
 * Pure empty-state decision for Explore (sidebar + map overlay).
 * Outside Metro Manila keeps coming-soon copy from ticket 23 — no conflicting
 * “No restrooms nearby” when filters are also active.
 */
export function resolveExploreEmptyState(
  input: ResolveExploreEmptyStateInput,
): ExploreEmptyState {
  if (input.listingCount > 0) {
    return NONE;
  }

  // Ticket 23 coming-soon owns outside-coverage UX (including with filters).
  if (input.banner === "coming_soon_outside") {
    return NONE;
  }

  const filtersActive = toListNearbyFilters(input.filters) !== undefined;
  const canWiden = nextWiderRadius(input.radiusMeters) !== null;
  const showAddCrHint = input.isSignedIn;

  if (filtersActive) {
    return {
      kind: "filters_hide_all",
      title: NO_RESTROOMS_NEARBY_TITLE,
      body: CLEAR_FILTERS_HINT,
      emphasizeClearFilters: true,
      showWidenRadius: canWiden,
      showClearFilters: true,
      showAddCrHint,
    };
  }

  return {
    kind: "zero_nearby",
    title: NO_RESTROOMS_NEARBY_TITLE,
    body: canWiden
      ? WIDEN_RADIUS_HINT
      : "Nothing in range yet — try again later or add a comfort room.",
    emphasizeClearFilters: false,
    showWidenRadius: canWiden,
    showClearFilters: false,
    showAddCrHint,
  };
}
