/** Explore (`/`) top-bar chrome contract — slots wired in tickets 25–26 / theme later. */

export const EXPLORE_TOP_BAR_BRAND = "HanapBidet PH";

export const EXPLORE_TOP_BAR_SLOTS = ["radius", "filters", "theme"] as const;

export type ExploreTopBarSlot = (typeof EXPLORE_TOP_BAR_SLOTS)[number];

/** Level-2 glass: ~90% neutral surface + 12px blur + soft ambient shadow (DESIGN.md). */
export const EXPLORE_TOP_BAR_GLASS_CLASS =
  "bg-background/90 shadow-[0_4px_16px_rgb(45_49_50/0.10)] backdrop-blur-[12px]";

/** Notch / status-bar clearance for floating map overlays. */
export const EXPLORE_TOP_BAR_SAFE_AREA_CLASS =
  "pt-[max(1rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]";

/**
 * Top bar overlays the Explore map only. Other end-user tabs keep sidebar-only
 * content without a broken floating chrome strip over an empty map frame.
 */
export function shouldShowExploreTopBar(pathname: string): boolean {
  return pathname === "/";
}
