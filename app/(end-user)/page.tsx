"use client";

import { ExploreDetailShell } from "@/components/explore/explore-detail-shell";
import { ExploreNearbyList } from "@/components/explore/explore-nearby-list";
import { PlaceholderPage } from "@/components/app-shell/placeholder-page";
import { useExploreSession } from "@/lib/explore/explore-session";
import { isDetailShellOpen } from "@/lib/explore/detail-shell";

export default function ExplorePage() {
  const { selectedId } = useExploreSession();
  const detailOpen = isDetailShellOpen(selectedId);

  return (
    <PlaceholderPage
      title={detailOpen ? "Detail" : "Nearby"}
      description={
        detailOpen
          ? "Listing detail opens in this panel on desktop; the map stays visible."
          : "Comfort rooms near you. Adjust the radius in the map top bar to look farther."
      }
    >
      {detailOpen ? (
        <ExploreDetailShell variant="desktop" />
      ) : (
        <ExploreNearbyList />
      )}
    </PlaceholderPage>
  );
}
