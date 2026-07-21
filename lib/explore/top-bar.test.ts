import { describe, expect, it } from "vitest";

import {
  EXPLORE_FILTER_CHIPS,
  FILTER_CHIP_SELECTED_CLASS,
  FILTER_CHIP_UNSELECTED_CLASS,
} from "./filters";
import { RADIUS_SELECTOR_OPTIONS } from "./radius";
import {
  EXPLORE_TOP_BAR_BRAND,
  EXPLORE_TOP_BAR_GLASS_CLASS,
  EXPLORE_TOP_BAR_SAFE_AREA_CLASS,
  EXPLORE_TOP_BAR_SLOTS,
  shouldShowExploreTopBar,
} from "./top-bar";

describe("shouldShowExploreTopBar", () => {
  it("shows only on Explore home so desktop sidebar-only tabs stay unbroken", () => {
    expect(shouldShowExploreTopBar("/")).toBe(true);
    expect(shouldShowExploreTopBar("/add")).toBe(false);
    expect(shouldShowExploreTopBar("/profile")).toBe(false);
    expect(shouldShowExploreTopBar("/reviews")).toBe(false);
    expect(shouldShowExploreTopBar("/restrooms/abc")).toBe(false);
    expect(shouldShowExploreTopBar("/login")).toBe(false);
    expect(shouldShowExploreTopBar("/admin")).toBe(false);
  });
});

describe("Explore top bar layout contract", () => {
  it("exposes HanapBidet brand copy for the chrome wordmark", () => {
    expect(EXPLORE_TOP_BAR_BRAND).toBe("HanapBidet PH");
  });

  it("reserves slots for radius, filters, and theme toggle", () => {
    expect(EXPLORE_TOP_BAR_SLOTS).toEqual(["radius", "filters", "theme"]);
  });

  it("wires radius slot options to 0.5 / 1 / 2 / 5 km steps", () => {
    expect(RADIUS_SELECTOR_OPTIONS).toEqual([
      { valueMeters: 500, label: "0.5 km" },
      { valueMeters: 1000, label: "1 km" },
      { valueMeters: 2000, label: "2 km" },
      { valueMeters: 5000, label: "5 km" },
    ]);
  });

  it("wires filter slot chips with Soft Aqua / teal selected styles", () => {
    expect(EXPLORE_FILTER_CHIPS.map((chip) => chip.idleLabel)).toEqual([
      "Has bidet",
      "Free/Paid",
      "Community verified only",
      "Public/Needs patronage",
    ]);
    expect(FILTER_CHIP_UNSELECTED_CLASS).toContain("bg-secondary");
    expect(FILTER_CHIP_SELECTED_CLASS).toContain("bg-primary");
  });

  it("uses glassmorphic chrome (backdrop blur + soft shadow) over the map", () => {
    expect(EXPLORE_TOP_BAR_GLASS_CLASS).toContain("backdrop-blur");
    expect(EXPLORE_TOP_BAR_GLASS_CLASS).toMatch(/shadow|bg-background\//);
  });

  it("pads for mobile safe-area insets (notches / home indicator)", () => {
    expect(EXPLORE_TOP_BAR_SAFE_AREA_CLASS).toContain("safe-area-inset-top");
  });
});
