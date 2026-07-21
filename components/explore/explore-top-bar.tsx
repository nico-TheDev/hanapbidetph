import {
  EXPLORE_TOP_BAR_BRAND,
  EXPLORE_TOP_BAR_GLASS_CLASS,
  EXPLORE_TOP_BAR_SAFE_AREA_CLASS,
  EXPLORE_TOP_BAR_SLOTS,
} from "@/lib/explore/top-bar";
import { cn } from "@/lib/utils";

/**
 * Compact glass top bar over the Explore map.
 * Radius / filters / theme are layout placeholders until later tickets.
 */
export function ExploreTopBar() {
  return (
    <header
      aria-label="Explore controls"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-30",
        EXPLORE_TOP_BAR_SAFE_AREA_CLASS,
      )}
      data-chrome="explore-top-bar"
    >
      <div
        className={cn(
          "pointer-events-auto mx-4 flex min-h-12 items-center gap-2 rounded-lg px-3 py-2",
          EXPLORE_TOP_BAR_GLASS_CLASS,
        )}
      >
        <p className="font-heading text-primary shrink-0 text-sm font-bold tracking-tight">
          {EXPLORE_TOP_BAR_BRAND}
        </p>

        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {EXPLORE_TOP_BAR_SLOTS.filter((slot) => slot !== "theme").map(
            (slot) => (
              <div
                key={slot}
                aria-hidden
                className="bg-secondary/80 text-muted-foreground h-8 shrink-0 rounded-full px-3 text-[11px] leading-8 font-medium"
                data-slot={slot}
              >
                {slot === "radius" ? "Radius" : "Filters"}
              </div>
            ),
          )}
        </div>

        <div
          aria-hidden
          className="bg-secondary/80 text-muted-foreground size-8 shrink-0 rounded-full"
          data-slot="theme"
          title="Theme toggle"
        />
      </div>
    </header>
  );
}
