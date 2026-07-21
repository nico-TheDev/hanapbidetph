"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { ExploreDetailContent } from "@/components/explore/explore-detail-content";
import { useExploreSession } from "@/lib/explore/explore-session";
import {
  DETAIL_SHEET_HANDLE,
  DETAIL_SHEET_PEEK_PX,
  collapseDetailSheet,
  expandDetailSheet,
  resolveDetailShellView,
  sheetHeightForSnap,
  snapFromDragHeightRatio,
  type DetailSheetSnap,
} from "@/lib/explore/detail-shell";
import { cn } from "@/lib/utils";

type ExploreDetailShellProps = {
  /** Mobile sheet overlays the map; desktop panel fills the sidebar. */
  variant: "mobile" | "desktop";
  className?: string;
};

/**
 * Listing detail shell (ticket 29) with content from getRestroom (ticket 30).
 * Mobile: peek → half → expanded bottom sheet. Desktop: sidebar panel.
 */
export function ExploreDetailShell({
  variant,
  className,
}: ExploreDetailShellProps) {
  const {
    selectedId,
    setSelectedId,
    listings,
    distancesAvailable,
    isSignedIn,
  } = useExploreSession();
  const [snap, setSnap] = useState<DetailSheetSnap>("peek");
  const view = resolveDetailShellView(selectedId, snap);
  const nearby = listings.find((row) => row.id === selectedId);

  const onSelectedIdChange = useEffectEvent((id: string | null) => {
    if (id) {
      setSnap("peek");
    }
  });

  useEffect(() => {
    onSelectedIdChange(selectedId);
  }, [selectedId]);

  const close = () => {
    setSelectedId(null);
    setSnap("peek");
  };

  if (!view.open || !selectedId) {
    return null;
  }

  if (variant === "desktop" && !view.desktopPanel) {
    return null;
  }
  if (variant === "mobile" && !view.mobileSheet) {
    return null;
  }

  const body = (
    <DetailShellFrame
      onClose={close}
      expandControl={
        variant === "mobile" ? (
          <MobileExpandControls
            snap={snap}
            onExpand={() => setSnap(expandDetailSheet(snap))}
            onCollapse={() => {
              const next = collapseDetailSheet(snap);
              if (next === null) {
                close();
                return;
              }
              setSnap(next);
            }}
          />
        ) : null
      }
    >
      <ExploreDetailContent
        listingId={selectedId}
        nearby={nearby}
        distancesAvailable={distancesAvailable}
        isSignedIn={isSignedIn}
        onSelectSibling={(siblingId) => setSelectedId(siblingId)}
      />
    </DetailShellFrame>
  );

  if (variant === "desktop") {
    return (
      <section
        aria-label="Listing detail"
        data-explore="detail-shell"
        data-variant="desktop"
        data-listing-id={selectedId}
        className={cn("flex min-h-0 flex-1 flex-col", className)}
      >
        {body}
      </section>
    );
  }

  return (
    <MobileDetailSheet
      listingId={selectedId}
      snap={snap}
      onSnapChange={setSnap}
      onClose={close}
      className={className}
    >
      {body}
    </MobileDetailSheet>
  );
}

function DetailShellFrame({
  onClose,
  expandControl,
  children,
}: {
  onClose: () => void;
  expandControl: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-4 pt-1">
      <div className="flex items-start justify-end gap-3">
        {expandControl}
        <button
          type="button"
          data-explore="detail-close"
          aria-label="Close detail"
          className="text-muted-foreground hover:bg-secondary/80 hover:text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      {children}
    </div>
  );
}

function MobileExpandControls({
  snap,
  onExpand,
  onCollapse,
}: {
  snap: DetailSheetSnap;
  onExpand: () => void;
  onCollapse: () => void;
}) {
  return (
    <div className="mr-auto flex gap-2">
      {snap !== "expanded" ? (
        <button
          type="button"
          data-explore="detail-expand"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          onClick={onExpand}
        >
          <ChevronUp className="size-4" aria-hidden />
          Expand
        </button>
      ) : null}
      <button
        type="button"
        data-explore="detail-collapse"
        className="text-muted-foreground hover:bg-secondary/70 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        onClick={onCollapse}
      >
        <ChevronDown className="size-4" aria-hidden />
        {snap === "peek" ? "Close" : "Collapse"}
      </button>
    </div>
  );
}

function MobileDetailSheet({
  listingId,
  snap,
  onSnapChange,
  onClose,
  children,
  className,
}: {
  listingId: string;
  snap: DetailSheetSnap;
  onSnapChange: (snap: DetailSheetSnap) => void;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const [dragHeightPx, setDragHeightPx] = useState<number | null>(null);
  const dragging = dragHeightPx !== null;

  const height = dragging
    ? `${dragHeightPx}px`
    : sheetHeightForSnap(snap);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const sheet = sheetRef.current;
    if (!sheet) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartY.current = event.clientY;
    dragStartHeight.current = sheet.getBoundingClientRect().height;
    setDragHeightPx(dragStartHeight.current);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragHeightPx === null) {
      return;
    }
    const viewport = window.innerHeight;
    const delta = dragStartY.current - event.clientY;
    const next = Math.min(
      viewport * 0.95,
      Math.max(DETAIL_SHEET_PEEK_PX * 0.5, dragStartHeight.current + delta),
    );
    setDragHeightPx(next);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragHeightPx === null) {
      return;
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore if already released
    }
    const ratio = dragHeightPx / window.innerHeight;
    if (ratio < 0.18) {
      setDragHeightPx(null);
      onClose();
      return;
    }
    onSnapChange(snapFromDragHeightRatio(ratio));
    setDragHeightPx(null);
  };

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="false"
      aria-label="Listing detail"
      data-explore="detail-shell"
      data-variant="mobile"
      data-snap={snap}
      data-listing-id={listingId}
      data-dragging={dragging ? "true" : "false"}
      className={cn(
        "border-border bg-background/90 absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-2xl border-t shadow-[0_-8px_24px_rgba(24,28,29,0.1)] backdrop-blur-md transition-[height] duration-200 ease-out md:hidden",
        dragging && "transition-none",
        className,
      )}
      style={{ height }}
    >
      <div
        data-explore="detail-drag-handle"
        className="flex cursor-grab touch-none items-center justify-center py-3 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span
          aria-hidden
          className="bg-muted-foreground/40 rounded-full"
          style={{
            width: DETAIL_SHEET_HANDLE.widthPx,
            height: DETAIL_SHEET_HANDLE.heightPx,
          }}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
