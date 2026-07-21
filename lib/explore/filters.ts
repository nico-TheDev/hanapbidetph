import type {
  AccessCost,
  AccessScope,
  ListNearbyInput,
} from "@/lib/restroom-directory/schemas";

type NearbyFilters = NonNullable<ListNearbyInput["filters"]>;

export type ExploreFilterChipId =
  | "hasBidet"
  | "accessCost"
  | "communityVerified"
  | "accessScope";

export type ExploreFilterState = {
  hasBidet: boolean;
  accessCost: AccessCost | null;
  communityVerified: boolean;
  accessScope: AccessScope | null;
};

export type ExploreFilterChipDef = {
  id: ExploreFilterChipId;
  idleLabel: string;
};

/** Soft Aqua bg + teal text (unselected). */
export const FILTER_CHIP_UNSELECTED_CLASS =
  "bg-secondary text-primary shadow-[0_1px_2px_rgb(45_49_50/0.05)]";

/** Fresh Teal bg + white text (selected). */
export const FILTER_CHIP_SELECTED_CLASS =
  "bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(45_49_50/0.05)]";

export const DEFAULT_EXPLORE_FILTERS: ExploreFilterState = {
  hasBidet: false,
  accessCost: null,
  communityVerified: false,
  accessScope: null,
};

export const EXPLORE_FILTER_CHIPS: readonly ExploreFilterChipDef[] = [
  { id: "hasBidet", idleLabel: "Has bidet" },
  { id: "accessCost", idleLabel: "Free/Paid" },
  { id: "communityVerified", idleLabel: "Community verified only" },
  { id: "accessScope", idleLabel: "Public/Needs patronage" },
] as const;

const ACCESS_COST_CYCLE: Array<AccessCost | null> = [null, "free", "paid"];
const ACCESS_SCOPE_CYCLE: Array<AccessScope | null> = [
  null,
  "public",
  "needs_patronage",
];

function nextInCycle<T>(cycle: readonly T[], current: T): T {
  const index = cycle.indexOf(current);
  return cycle[(index + 1) % cycle.length]!;
}

/** Toggle / cycle a chip; returns a new filter state. */
export function toggleFilterChip(
  state: ExploreFilterState,
  chipId: ExploreFilterChipId,
): ExploreFilterState {
  switch (chipId) {
    case "hasBidet":
      return { ...state, hasBidet: !state.hasBidet };
    case "communityVerified":
      return { ...state, communityVerified: !state.communityVerified };
    case "accessCost":
      return {
        ...state,
        accessCost: nextInCycle(ACCESS_COST_CYCLE, state.accessCost),
      };
    case "accessScope":
      return {
        ...state,
        accessScope: nextInCycle(ACCESS_SCOPE_CYCLE, state.accessScope),
      };
  }
}

export function isChipSelected(
  state: ExploreFilterState,
  chipId: ExploreFilterChipId,
): boolean {
  switch (chipId) {
    case "hasBidet":
      return state.hasBidet;
    case "communityVerified":
      return state.communityVerified;
    case "accessCost":
      return state.accessCost !== null;
    case "accessScope":
      return state.accessScope !== null;
  }
}

export function chipLabel(
  state: ExploreFilterState,
  chipId: ExploreFilterChipId,
): string {
  const def = EXPLORE_FILTER_CHIPS.find((chip) => chip.id === chipId);
  const idle = def?.idleLabel ?? chipId;

  switch (chipId) {
    case "hasBidet":
    case "communityVerified":
      return idle;
    case "accessCost":
      if (state.accessCost === "free") return "Free";
      if (state.accessCost === "paid") return "Paid";
      return idle;
    case "accessScope":
      if (state.accessScope === "public") return "Public";
      if (state.accessScope === "needs_patronage") return "Needs patronage";
      return idle;
  }
}

/**
 * Maps Explore chip state to `listNearby` filters.
 * Returns undefined when no chips are active.
 */
export function toListNearbyFilters(
  state: ExploreFilterState,
): NearbyFilters | undefined {
  const filters: NearbyFilters = {};

  if (state.hasBidet) {
    filters.hasBidet = true;
  }
  if (state.accessCost !== null) {
    filters.accessCost = state.accessCost;
  }
  if (state.communityVerified) {
    filters.communityVerified = true;
  }
  if (state.accessScope !== null) {
    filters.accessScope = state.accessScope;
  }

  return Object.keys(filters).length > 0 ? filters : undefined;
}
