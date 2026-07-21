/**
 * Listing detail shell contract (ticket 29).
 * Mobile: bottom sheet peek → half → expanded. Desktop: sidebar panel.
 * Full listing content lands in ticket 30.
 */

export type DetailSheetSnap = "peek" | "half" | "expanded";

export const DETAIL_SHEET_PEEK_PX = 240;
export const DETAIL_SHEET_HALF_RATIO = 0.5;
export const DETAIL_SHEET_EXPANDED_RATIO = 0.95;

/** Drag handle size from UI_DESIGN / DESIGN.md. */
export const DETAIL_SHEET_HANDLE = { widthPx: 40, heightPx: 4 } as const;

export type DetailShellState =
  | { open: false }
  | { open: true; listingId: string; snap: DetailSheetSnap };

export type DetailShellView = {
  open: boolean;
  listingId: string | null;
  /** Mobile bottom sheet over the map. */
  mobileSheet: boolean;
  /** Desktop detail panel in the left sidebar (map stays visible). */
  desktopPanel: boolean;
  snap: DetailSheetSnap;
};

/** Pin tap or sidebar row opens the shell at peek height. */
export function openDetailShell(listingId: string): DetailShellState {
  return { open: true, listingId, snap: "peek" };
}

/** Back/close returns to map-only Explore (no selection). */
export function closeDetailShell(): DetailShellState {
  return { open: false };
}

export function isDetailShellOpen(selectedId: string | null): boolean {
  return selectedId !== null;
}

/** Expand CTA: peek → half → expanded. */
export function expandDetailSheet(snap: DetailSheetSnap): DetailSheetSnap {
  if (snap === "peek") {
    return "half";
  }
  if (snap === "half") {
    return "expanded";
  }
  return "expanded";
}

/**
 * Collapse one step. Null from peek means close the shell.
 */
export function collapseDetailSheet(
  snap: DetailSheetSnap,
): DetailSheetSnap | null {
  if (snap === "expanded") {
    return "half";
  }
  if (snap === "half") {
    return "peek";
  }
  return null;
}

export function sheetHeightForSnap(snap: DetailSheetSnap): string {
  switch (snap) {
    case "peek":
      return `${DETAIL_SHEET_PEEK_PX}px`;
    case "half":
      return `${DETAIL_SHEET_HALF_RATIO * 100}%`;
    case "expanded":
      return `${DETAIL_SHEET_EXPANDED_RATIO * 100}%`;
  }
}

/**
 * Map a drag height ratio (0–1 of viewport) to the nearest snap.
 * Thresholds sit midway between peek (~0.28 of a typical phone), half, and expanded.
 */
export function snapFromDragHeightRatio(ratio: number): DetailSheetSnap {
  const clamped = Math.min(1, Math.max(0, ratio));
  if (clamped < 0.35) {
    return "peek";
  }
  if (clamped < 0.725) {
    return "half";
  }
  return "expanded";
}

/** Shared view model for mobile sheet + desktop panel from `selectedId`. */
export function resolveDetailShellView(
  selectedId: string | null,
  snap: DetailSheetSnap,
): DetailShellView {
  if (!selectedId) {
    return {
      open: false,
      listingId: null,
      mobileSheet: false,
      desktopPanel: false,
      snap,
    };
  }
  return {
    open: true,
    listingId: selectedId,
    mobileSheet: true,
    desktopPanel: true,
    snap,
  };
}
