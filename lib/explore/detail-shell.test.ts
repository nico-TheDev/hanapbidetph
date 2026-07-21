import { describe, expect, it } from "vitest";

import {
  DETAIL_SHEET_EXPANDED_RATIO,
  DETAIL_SHEET_HANDLE,
  DETAIL_SHEET_HALF_RATIO,
  DETAIL_SHEET_PEEK_PX,
  closeDetailShell,
  collapseDetailSheet,
  expandDetailSheet,
  isDetailShellOpen,
  openDetailShell,
  resolveDetailShellView,
  sheetHeightForSnap,
  snapFromDragHeightRatio,
} from "./detail-shell";

const LISTING_ID = "11111111-1111-4111-8111-111111111111";

describe("29 — Listing detail shell", () => {
  it("opens at peek height when a pin or sidebar row selects a listing", () => {
    const shell = openDetailShell(LISTING_ID);

    expect(shell).toEqual({
      open: true,
      listingId: LISTING_ID,
      snap: "peek",
    });
    expect(isDetailShellOpen(LISTING_ID)).toBe(true);
    expect(DETAIL_SHEET_PEEK_PX).toBe(240);
    expect(sheetHeightForSnap("peek")).toBe("240px");
  });

  it("expands peek → half → expanded via CTA steps", () => {
    expect(expandDetailSheet("peek")).toBe("half");
    expect(expandDetailSheet("half")).toBe("expanded");
    expect(expandDetailSheet("expanded")).toBe("expanded");

    expect(sheetHeightForSnap("half")).toBe("50%");
    expect(sheetHeightForSnap("expanded")).toBe("95%");
    expect(DETAIL_SHEET_HALF_RATIO).toBe(0.5);
    expect(DETAIL_SHEET_EXPANDED_RATIO).toBe(0.95);
  });

  it("collapses expanded → half → peek, then close clears selection", () => {
    expect(collapseDetailSheet("expanded")).toBe("half");
    expect(collapseDetailSheet("half")).toBe("peek");
    expect(collapseDetailSheet("peek")).toBeNull();
    expect(closeDetailShell()).toEqual({ open: false });
    expect(isDetailShellOpen(null)).toBe(false);
  });

  it("snaps drag height to peek, half, or expanded", () => {
    expect(snapFromDragHeightRatio(0.2)).toBe("peek");
    expect(snapFromDragHeightRatio(0.5)).toBe("half");
    expect(snapFromDragHeightRatio(0.9)).toBe("expanded");
  });

  it("uses a 40×4px drag handle", () => {
    expect(DETAIL_SHEET_HANDLE).toEqual({ widthPx: 40, heightPx: 4 });
  });

  it("mobile shows bottom sheet and desktop shows sidebar panel for the same selection", () => {
    const closed = resolveDetailShellView(null, "peek");
    expect(closed).toEqual({
      open: false,
      listingId: null,
      mobileSheet: false,
      desktopPanel: false,
      snap: "peek",
    });

    const open = resolveDetailShellView(LISTING_ID, "half");
    expect(open).toEqual({
      open: true,
      listingId: LISTING_ID,
      mobileSheet: true,
      desktopPanel: true,
      snap: "half",
    });
  });

  it("back/close returns to map-only Explore (no shell)", () => {
    const afterClose = resolveDetailShellView(null, "expanded");
    expect(afterClose.open).toBe(false);
    expect(afterClose.mobileSheet).toBe(false);
    expect(afterClose.desktopPanel).toBe(false);
    expect(closeDetailShell().open).toBe(false);
  });
});
