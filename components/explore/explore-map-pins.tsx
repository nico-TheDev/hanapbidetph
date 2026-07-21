"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";

import { ExploreMapPinMarker } from "@/components/explore/explore-map-pin-marker";
import type { MapPinModel } from "@/lib/explore/map-pins";

type ExploreMapPinsProps = {
  pins: MapPinModel[];
  onSelect: (listingId: string) => void;
};

/**
 * Renders `listNearby` pins on the Explore map. Tap selects (preview state).
 */
export function ExploreMapPins({ pins, onSelect }: ExploreMapPinsProps) {
  return (
    <>
      {pins.map((pin) => (
        <AdvancedMarker
          key={pin.id}
          position={{ lat: pin.lat, lng: pin.lng }}
          title={pin.name}
          onClick={() => onSelect(pin.id)}
          zIndex={pin.selected ? 10 : 1}
        >
          <ExploreMapPinMarker
            appearance={pin.appearance}
            selected={pin.selected}
            name={pin.name}
          />
        </AdvancedMarker>
      ))}
    </>
  );
}
