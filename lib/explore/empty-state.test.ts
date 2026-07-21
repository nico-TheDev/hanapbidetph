import { describe, expect, it } from "vitest";

import { DEFAULT_EXPLORE_FILTERS, toggleFilterChip } from "./filters";
import { DEFAULT_NEARBY_RADIUS_METERS, MAX_NEARBY_RADIUS_METERS } from "./radius";
import { toMapPinModels } from "./map-pins";
import {
  ADD_CR_CTA,
  ADD_CR_HINT,
  CLEAR_FILTERS_CTA,
  CLEAR_FILTERS_HINT,
  NO_RESTROOMS_NEARBY_TITLE,
  WIDEN_RADIUS_CTA,
  WIDEN_RADIUS_HINT,
  nextWiderRadius,
  resolveExploreEmptyState,
} from "./empty-state";

describe("28 — Explore empty states", () => {
  it('shows "No restrooms nearby" and suggests widening when in coverage with zero pins', () => {
    const empty = resolveExploreEmptyState({
      listingCount: 0,
      filters: DEFAULT_EXPLORE_FILTERS,
      banner: "none",
      radiusMeters: DEFAULT_NEARBY_RADIUS_METERS,
      isSignedIn: false,
    });

    expect(empty.kind).toBe("zero_nearby");
    expect(empty.title).toBe(NO_RESTROOMS_NEARBY_TITLE);
    expect(empty.body).toContain(WIDEN_RADIUS_HINT);
    expect(empty.showWidenRadius).toBe(true);
    expect(empty.showClearFilters).toBe(false);
    expect(empty.emphasizeClearFilters).toBe(false);
    expect(empty.showAddCrHint).toBe(false);
    expect(WIDEN_RADIUS_CTA.toLowerCase()).toContain("widen");
  });

  it("emphasizes Clear filters when active filters hide every listing", () => {
    const filters = toggleFilterChip(DEFAULT_EXPLORE_FILTERS, "hasBidet");
    const empty = resolveExploreEmptyState({
      listingCount: 0,
      filters,
      banner: "none",
      radiusMeters: DEFAULT_NEARBY_RADIUS_METERS,
      isSignedIn: false,
    });

    expect(empty.kind).toBe("filters_hide_all");
    expect(empty.title).toBe(NO_RESTROOMS_NEARBY_TITLE);
    expect(empty.body).toBe(CLEAR_FILTERS_HINT);
    expect(empty.emphasizeClearFilters).toBe(true);
    expect(empty.showClearFilters).toBe(true);
    expect(CLEAR_FILTERS_CTA).toBe("Clear filters");
  });

  it("does not invent phantom pins when the nearby list is empty", () => {
    expect(toMapPinModels([], null)).toEqual([]);

    const empty = resolveExploreEmptyState({
      listingCount: 0,
      filters: DEFAULT_EXPLORE_FILTERS,
      banner: "none",
      radiusMeters: DEFAULT_NEARBY_RADIUS_METERS,
      isSignedIn: false,
    });
    expect(empty.kind).not.toBe("none");
  });

  it("defers to coming-soon outside coverage (no conflicting nearby empty copy)", () => {
    const filters = toggleFilterChip(DEFAULT_EXPLORE_FILTERS, "hasBidet");
    const empty = resolveExploreEmptyState({
      listingCount: 0,
      filters,
      banner: "coming_soon_outside",
      radiusMeters: DEFAULT_NEARBY_RADIUS_METERS,
      isSignedIn: true,
    });

    expect(empty.kind).toBe("none");
    expect(empty.title).toBeNull();
    expect(empty.showClearFilters).toBe(false);
    expect(empty.showAddCrHint).toBe(false);
  });

  it("shows Add CR hint only for signed-in users when empty in coverage", () => {
    const guest = resolveExploreEmptyState({
      listingCount: 0,
      filters: DEFAULT_EXPLORE_FILTERS,
      banner: "none",
      radiusMeters: DEFAULT_NEARBY_RADIUS_METERS,
      isSignedIn: false,
    });
    expect(guest.showAddCrHint).toBe(false);

    const signedIn = resolveExploreEmptyState({
      listingCount: 0,
      filters: DEFAULT_EXPLORE_FILTERS,
      banner: "enable_location",
      radiusMeters: DEFAULT_NEARBY_RADIUS_METERS,
      isSignedIn: true,
    });
    expect(signedIn.showAddCrHint).toBe(true);
    expect(ADD_CR_HINT.toLowerCase()).toContain("add cr");
    expect(ADD_CR_CTA).toBe("Add CR");
  });

  it("hides empty chrome when listings are present", () => {
    const empty = resolveExploreEmptyState({
      listingCount: 3,
      filters: DEFAULT_EXPLORE_FILTERS,
      banner: "none",
      radiusMeters: DEFAULT_NEARBY_RADIUS_METERS,
      isSignedIn: true,
    });
    expect(empty.kind).toBe("none");
    expect(empty.title).toBeNull();
  });

  it("widens radius to the next step until the 5 km max", () => {
    expect(nextWiderRadius(500)).toBe(1000);
    expect(nextWiderRadius(1000)).toBe(2000);
    expect(nextWiderRadius(2000)).toBe(5000);
    expect(nextWiderRadius(MAX_NEARBY_RADIUS_METERS)).toBeNull();

    const atMax = resolveExploreEmptyState({
      listingCount: 0,
      filters: DEFAULT_EXPLORE_FILTERS,
      banner: "none",
      radiusMeters: MAX_NEARBY_RADIUS_METERS,
      isSignedIn: false,
    });
    expect(atMax.showWidenRadius).toBe(false);
  });
});
