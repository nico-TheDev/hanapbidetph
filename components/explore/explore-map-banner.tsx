"use client";

import { Button } from "@/components/ui/button";
import {
  BROWSE_METRO_MANILA_CTA,
  COMING_SOON_OUTSIDE_COPY,
  ENABLE_LOCATION_BANNER,
} from "@/lib/explore/map-copy";
import type { MapBanner } from "@/lib/explore/map-view";
import { EXPLORE_TOP_BAR_GLASS_CLASS } from "@/lib/explore/top-bar";
import { cn } from "@/lib/utils";

type ExploreMapBannerProps = {
  banner: MapBanner;
  onBrowseMetroManila?: () => void;
};

/**
 * Soft overlays under the Explore top bar: location prompt or launch-geo coming soon.
 */
export function ExploreMapBanner({
  banner,
  onBrowseMetroManila,
}: ExploreMapBannerProps) {
  if (banner === "none") {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-4 pt-[calc(max(1rem,env(safe-area-inset-top))+3.75rem)]"
      data-chrome="explore-map-banner"
      data-banner={banner}
      role="status"
    >
      <div
        className={cn(
          "pointer-events-auto flex max-w-md flex-col items-start gap-2 rounded-lg px-3 py-2.5 sm:flex-row sm:items-center",
          EXPLORE_TOP_BAR_GLASS_CLASS,
        )}
      >
        {banner === "enable_location" ? (
          <p className="text-muted-foreground text-sm leading-snug">
            {ENABLE_LOCATION_BANNER}
          </p>
        ) : (
          <>
            <p className="text-foreground text-sm leading-snug font-medium">
              {COMING_SOON_OUTSIDE_COPY}
            </p>
            {onBrowseMetroManila ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onBrowseMetroManila}
              >
                {BROWSE_METRO_MANILA_CTA}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
