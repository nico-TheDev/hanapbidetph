"use client";

import { ExploreFilterChips } from "@/components/explore/explore-filter-chips";
import { ExploreRadiusSelector } from "@/components/explore/explore-radius-selector";
import { useOptionalExploreSession } from "@/lib/explore/explore-session";
import {
  EXPLORE_TOP_BAR_BRAND,
  EXPLORE_TOP_BAR_GLASS_CLASS,
  EXPLORE_TOP_BAR_SAFE_AREA_CLASS,
} from "@/lib/explore/top-bar";
import { cn } from "@/lib/utils";

/**
 * Compact glass top bar over the Explore map.
 * Radius + filter chips are wired to `listNearby`; theme remains a placeholder.
 */
export function ExploreTopBar() {
  const session = useOptionalExploreSession();

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
          {session ? (
            <>
              <ExploreRadiusSelector
                valueMeters={session.radiusMeters}
                onChange={session.setRadiusMeters}
              />
              <ExploreFilterChips
                filters={session.filters}
                onToggle={session.toggleFilter}
              />
            </>
          ) : (
            <>
              <div
                aria-hidden
                className="bg-secondary/80 text-muted-foreground h-8 shrink-0 rounded-full px-3 text-[11px] leading-8 font-medium"
                data-slot="radius"
              >
                Radius
              </div>
              <div
                aria-hidden
                className="bg-secondary/80 text-muted-foreground h-8 shrink-0 rounded-full px-3 text-[11px] leading-8 font-medium"
                data-slot="filters"
              >
                Filters
              </div>
            </>
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
