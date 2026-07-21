import { describe, expect, it } from "vitest";

import {
  EXPLORE_FILTER_CHIPS,
  FILTER_CHIP_SELECTED_CLASS,
  FILTER_CHIP_UNSELECTED_CLASS,
  DEFAULT_EXPLORE_FILTERS,
  chipLabel,
  isChipSelected,
  toListNearbyFilters,
  toggleFilterChip,
  type ExploreFilterState,
} from "./filters";

describe("26 — filter chips wired to listNearby", () => {
  it("exposes four chips: Has bidet, Free/Paid, Community verified only, Public/Needs patronage", () => {
    expect(EXPLORE_FILTER_CHIPS.map((chip) => chip.id)).toEqual([
      "hasBidet",
      "accessCost",
      "communityVerified",
      "accessScope",
    ]);
    expect(EXPLORE_FILTER_CHIPS.map((chip) => chip.idleLabel)).toEqual([
      "Has bidet",
      "Free/Paid",
      "Community verified only",
      "Public/Needs patronage",
    ]);
  });

  it("uses Soft Aqua unselected and teal + white selected classes", () => {
    expect(FILTER_CHIP_UNSELECTED_CLASS).toContain("bg-secondary");
    expect(FILTER_CHIP_UNSELECTED_CLASS).toContain("text-primary");
    expect(FILTER_CHIP_SELECTED_CLASS).toContain("bg-primary");
    expect(FILTER_CHIP_SELECTED_CLASS).toContain("text-primary-foreground");
  });

  it("toggles Has bidet and Community verified only as boolean filters", () => {
    let state: ExploreFilterState = { ...DEFAULT_EXPLORE_FILTERS };

    state = toggleFilterChip(state, "hasBidet");
    expect(isChipSelected(state, "hasBidet")).toBe(true);
    expect(toListNearbyFilters(state)).toEqual({ hasBidet: true });

    state = toggleFilterChip(state, "communityVerified");
    expect(isChipSelected(state, "communityVerified")).toBe(true);
    expect(toListNearbyFilters(state)).toEqual({
      hasBidet: true,
      communityVerified: true,
    });

    state = toggleFilterChip(state, "hasBidet");
    expect(isChipSelected(state, "hasBidet")).toBe(false);
    expect(toListNearbyFilters(state)).toEqual({ communityVerified: true });
  });

  it("cycles Free/Paid and Public/Needs patronage through enum values", () => {
    let state: ExploreFilterState = { ...DEFAULT_EXPLORE_FILTERS };

    state = toggleFilterChip(state, "accessCost");
    expect(chipLabel(state, "accessCost")).toBe("Free");
    expect(toListNearbyFilters(state)).toEqual({ accessCost: "free" });

    state = toggleFilterChip(state, "accessCost");
    expect(chipLabel(state, "accessCost")).toBe("Paid");
    expect(toListNearbyFilters(state)).toEqual({ accessCost: "paid" });

    state = toggleFilterChip(state, "accessCost");
    expect(isChipSelected(state, "accessCost")).toBe(false);
    expect(chipLabel(state, "accessCost")).toBe("Free/Paid");
    expect(toListNearbyFilters(state)).toBeUndefined();

    state = toggleFilterChip(state, "accessScope");
    expect(chipLabel(state, "accessScope")).toBe("Public");
    expect(toListNearbyFilters(state)).toEqual({ accessScope: "public" });

    state = toggleFilterChip(state, "accessScope");
    expect(chipLabel(state, "accessScope")).toBe("Needs patronage");
    expect(toListNearbyFilters(state)).toEqual({
      accessScope: "needs_patronage",
    });

    state = toggleFilterChip(state, "accessScope");
    expect(isChipSelected(state, "accessScope")).toBe(false);
    expect(chipLabel(state, "accessScope")).toBe("Public/Needs patronage");
  });

  it("allows multiple filters active at once for listNearby", () => {
    let state: ExploreFilterState = { ...DEFAULT_EXPLORE_FILTERS };
    state = toggleFilterChip(state, "hasBidet");
    state = toggleFilterChip(state, "accessCost");
    state = toggleFilterChip(state, "communityVerified");
    state = toggleFilterChip(state, "accessScope");

    expect(toListNearbyFilters(state)).toEqual({
      hasBidet: true,
      accessCost: "free",
      communityVerified: true,
      accessScope: "public",
    });

    expect(EXPLORE_FILTER_CHIPS.every((chip) => isChipSelected(state, chip.id))).toBe(
      true,
    );
  });
});
