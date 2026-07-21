"use client";

import { useExploreSession } from "@/lib/explore/explore-session";
import { toNearbyListRows } from "@/lib/explore/radius";

/**
 * Desktop sidebar nearby list rows from `listNearby`.
 * Distance shown only when user location is known (ticket 25).
 * Selection / amenity icons land in ticket 27.
 */
export function ExploreNearbyList() {
  const { listings, distancesAvailable } = useExploreSession();
  const rows = toNearbyListRows(listings, { distancesAvailable });

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm leading-relaxed">
        Listings near you will show here. Widen the radius if nothing is close.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1" data-explore="nearby-list">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-baseline justify-between gap-3 rounded-lg px-1 py-2"
          data-explore="nearby-row"
        >
          <span className="font-heading text-sm font-semibold tracking-tight">
            {row.name}
          </span>
          {row.distanceLabel ? (
            <span className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums">
              {row.distanceLabel}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
