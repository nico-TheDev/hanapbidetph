"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  ADD_CR_CTA,
  ADD_CR_HINT,
  ADD_CR_HREF,
  CLEAR_FILTERS_CTA,
  WIDEN_RADIUS_CTA,
  nextWiderRadius,
  type ExploreEmptyState as EmptyModel,
} from "@/lib/explore/empty-state";
import type { RadiusStepMeters } from "@/lib/explore/radius";
import { EXPLORE_TOP_BAR_GLASS_CLASS } from "@/lib/explore/top-bar";
import { cn } from "@/lib/utils";

type ExploreEmptyStateProps = {
  empty: EmptyModel;
  radiusMeters: RadiusStepMeters;
  onWidenRadius?: (meters: RadiusStepMeters) => void;
  onClearFilters?: () => void;
  /** `overlay` = map glass card; `inline` = sidebar. */
  variant?: "overlay" | "inline";
  className?: string;
};

/**
 * Empty Explore UX: zero pins / filters hide all (APPFLOW).
 * Outside coverage stays on the coming-soon banner from ticket 23.
 */
export function ExploreEmptyStateView({
  empty,
  radiusMeters,
  onWidenRadius,
  onClearFilters,
  variant = "inline",
  className,
}: ExploreEmptyStateProps) {
  if (empty.kind === "none" || !empty.title) {
    return null;
  }

  const nextRadius = nextWiderRadius(radiusMeters);

  return (
    <div
      className={cn(
        variant === "overlay" &&
          cn(
            "pointer-events-auto flex max-w-sm flex-col gap-3 rounded-2xl px-4 py-3.5",
            EXPLORE_TOP_BAR_GLASS_CLASS,
          ),
        variant === "inline" && "flex flex-col gap-3",
        className,
      )}
      data-explore="empty-state"
      data-empty-kind={empty.kind}
      data-emphasize-clear={empty.emphasizeClearFilters ? "true" : "false"}
      role="status"
    >
      <div className="flex flex-col gap-1.5">
        <p
          className={cn(
            "font-heading text-foreground text-sm font-semibold tracking-tight",
            empty.emphasizeClearFilters && "text-primary",
          )}
        >
          {empty.title}
        </p>
        {empty.body ? (
          <p
            className={cn(
              "text-muted-foreground text-sm leading-relaxed",
              empty.emphasizeClearFilters && "text-foreground/80 font-medium",
            )}
          >
            {empty.body}
          </p>
        ) : null}
      </div>

      {empty.showClearFilters || empty.showWidenRadius || empty.showAddCrHint ? (
        <div className="flex flex-wrap items-center gap-2">
          {empty.showClearFilters && onClearFilters ? (
            <Button
              type="button"
              size="sm"
              variant={empty.emphasizeClearFilters ? "default" : "secondary"}
              data-explore="clear-filters"
              onClick={onClearFilters}
            >
              {CLEAR_FILTERS_CTA}
            </Button>
          ) : null}
          {empty.showWidenRadius && nextRadius && onWidenRadius ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              data-explore="widen-radius"
              onClick={() => onWidenRadius(nextRadius)}
            >
              {WIDEN_RADIUS_CTA}
            </Button>
          ) : null}
          {empty.showAddCrHint ? (
            <Link
              href={ADD_CR_HREF}
              data-explore="add-cr"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {ADD_CR_CTA}
            </Link>
          ) : null}
        </div>
      ) : null}

      {empty.showAddCrHint ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {ADD_CR_HINT}
        </p>
      ) : null}
    </div>
  );
}
