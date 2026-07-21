"use client";

import {
  RADIUS_SELECTOR_OPTIONS,
  type RadiusStepMeters,
} from "@/lib/explore/radius";
import { cn } from "@/lib/utils";

type ExploreRadiusSelectorProps = {
  valueMeters: RadiusStepMeters;
  onChange: (meters: RadiusStepMeters) => void;
  className?: string;
};

/** Compact top-bar control for Explore search radius (0.5 / 1 / 2 / 5 km). */
export function ExploreRadiusSelector({
  valueMeters,
  onChange,
  className,
}: ExploreRadiusSelectorProps) {
  return (
    <label
      className={cn(
        "bg-secondary/80 text-foreground inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium",
        className,
      )}
      data-slot="radius"
    >
      <span className="text-muted-foreground sr-only sm:not-sr-only sm:inline">
        Radius
      </span>
      <select
        aria-label="Search radius"
        className="bg-transparent text-foreground max-w-18 cursor-pointer border-0 p-0 text-[11px] font-semibold outline-none"
        value={valueMeters}
        onChange={(event) => {
          onChange(Number(event.target.value) as RadiusStepMeters);
        }}
      >
        {RADIUS_SELECTOR_OPTIONS.map((option) => (
          <option key={option.valueMeters} value={option.valueMeters}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
