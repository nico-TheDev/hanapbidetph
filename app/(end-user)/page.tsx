"use client";

import { ExploreNearbyList } from "@/components/explore/explore-nearby-list";
import { PlaceholderPage } from "@/components/app-shell/placeholder-page";

export default function ExplorePage() {
  return (
    <PlaceholderPage
      title="Nearby"
      description="Comfort rooms near you. Adjust the radius in the map top bar to look farther."
    >
      <ExploreNearbyList />
    </PlaceholderPage>
  );
}
