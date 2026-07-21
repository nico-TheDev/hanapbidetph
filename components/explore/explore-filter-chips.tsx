"use client";

import {
  EXPLORE_FILTER_CHIPS,
  FILTER_CHIP_SELECTED_CLASS,
  FILTER_CHIP_UNSELECTED_CLASS,
  chipLabel,
  isChipSelected,
  type ExploreFilterChipId,
  type ExploreFilterState,
} from "@/lib/explore/filters";
import { cn } from "@/lib/utils";

type ExploreFilterChipsProps = {
  filters: ExploreFilterState;
  onToggle: (chipId: ExploreFilterChipId) => void;
  className?: string;
};

/**
 * Horizontal-scroll filter chips for Explore.
 * Unselected Soft Aqua; selected Fresh Teal + white. Multi-select OK.
 */
export function ExploreFilterChips({
  filters,
  onToggle,
  className,
}: ExploreFilterChipsProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto",
        className,
      )}
      data-slot="filters"
      role="group"
      aria-label="Filter nearby restrooms"
    >
      {EXPLORE_FILTER_CHIPS.map((chip) => {
        const selected = isChipSelected(filters, chip.id);
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={selected}
            data-chip={chip.id}
            data-selected={selected ? "true" : "false"}
            className={cn(
              "h-8 shrink-0 rounded-full px-3 text-[11px] font-medium whitespace-nowrap transition-colors",
              selected
                ? FILTER_CHIP_SELECTED_CLASS
                : FILTER_CHIP_UNSELECTED_CLASS,
            )}
            onClick={() => onToggle(chip.id)}
          >
            {chipLabel(filters, chip.id)}
          </button>
        );
      })}
    </div>
  );
}
