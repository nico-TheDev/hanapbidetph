"use client";

import { BadgeCheck, Droplets } from "lucide-react";

import { ExploreEmptyStateView } from "@/components/explore/explore-empty-state";
import { resolveExploreEmptyState } from "@/lib/explore/empty-state";
import { useExploreSession } from "@/lib/explore/explore-session";
import {
  selectNearbyListRow,
  toNearbyListRows,
} from "@/lib/explore/nearby-list";
import { cn } from "@/lib/utils";

/**
 * Desktop sidebar nearby list from `listNearby` (distance-sorted).
 * Row click selects the listing and highlights the matching map pin.
 * Empty nearby / filter-hidden states use APPFLOW copy (ticket 28).
 * Detail panel content lands in a later ticket.
 */
export function ExploreNearbyList() {
  const {
    listings,
    distancesAvailable,
    selectedId,
    setSelectedId,
    filters,
    mapBanner,
    radiusMeters,
    setRadiusMeters,
    clearFilters,
    nearbyReady,
    isSignedIn,
  } = useExploreSession();
  const rows = toNearbyListRows(listings, {
    distancesAvailable,
    selectedId,
  });

  const empty = resolveExploreEmptyState({
    listingCount: listings.length,
    filters,
    banner: mapBanner,
    radiusMeters,
    isSignedIn,
  });

  if (rows.length === 0) {
    if (!nearbyReady || empty.kind === "none") {
      return (
        <p className="text-muted-foreground text-sm leading-relaxed">
          Listings near you will show here.
        </p>
      );
    }

    return (
      <ExploreEmptyStateView
        empty={empty}
        radiusMeters={radiusMeters}
        onWidenRadius={setRadiusMeters}
        onClearFilters={clearFilters}
        variant="inline"
      />
    );
  }

  return (
    <ul
      className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto"
      data-explore="nearby-list"
      aria-label="Nearby restrooms"
    >
      {rows.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            data-explore="nearby-row"
            data-selected={row.selected ? "true" : "false"}
            data-has-bidet={row.hasBidet ? "true" : "false"}
            data-community-verified={row.communityVerified ? "true" : "false"}
            aria-pressed={row.selected}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
              row.selected
                ? "bg-primary/10 text-foreground"
                : "hover:bg-secondary/70 text-foreground",
            )}
            onClick={() => setSelectedId(selectNearbyListRow(row.id))}
          >
            <span className="min-w-0 flex-1">
              <span className="font-heading block text-sm font-semibold tracking-tight">
                {row.name}
              </span>
              <span className="mt-1 flex items-center gap-2">
                {row.hasBidet ? (
                  <span
                    className="text-primary inline-flex items-center gap-0.5 text-[11px] font-medium"
                    title="Has bidet"
                  >
                    <Droplets className="size-3.5 shrink-0" aria-hidden />
                    <span className="sr-only">Has bidet</span>
                  </span>
                ) : null}
                {row.communityVerified ? (
                  <span
                    className="text-primary inline-flex items-center gap-0.5 text-[11px] font-medium"
                    title="Community verified"
                  >
                    <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
                    <span className="sr-only">Community verified</span>
                  </span>
                ) : null}
              </span>
            </span>
            {row.distanceLabel ? (
              <span className="text-muted-foreground shrink-0 pt-0.5 text-xs font-medium tabular-nums">
                {row.distanceLabel}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
