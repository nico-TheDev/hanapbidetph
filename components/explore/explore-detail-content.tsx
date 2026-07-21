"use client";

import { BadgeCheck, Droplets } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";

import {
  COMMUNITY_VERIFIED_LABEL,
  MAPS_CTA_LABEL,
  PHOTO_PLACEHOLDER_LABEL,
  detectMapsPlatform,
  toDetailContentView,
  type DetailContentView,
  type MapsPlatform,
} from "@/lib/explore/detail-content";
import {
  toReviewsFeedView,
  type ReviewsFeedView,
} from "@/lib/explore/detail-reviews";
import { loadRestroomDetailAction } from "@/lib/explore/load-detail-action";
import type {
  NearbyRestroom,
  RestroomDetail,
  SiblingRestroom,
} from "@/lib/restroom-directory/schemas";
import { cn } from "@/lib/utils";

type ExploreDetailContentProps = {
  listingId: string;
  nearby?: NearbyRestroom;
  distancesAvailable: boolean;
  isSignedIn?: boolean;
  onSelectSibling: (siblingId: string) => void;
  className?: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      detail: RestroomDetail;
      siblings: SiblingRestroom[];
      mapsPlatform: MapsPlatform;
    };

/**
 * Listing detail body: amenities, trust, photos, siblings, Maps handoff,
 * and read-only reviews feed (ticket 31). Verify/rate/report CTAs are later.
 */
export function ExploreDetailContent({
  listingId,
  nearby,
  distancesAvailable,
  isSignedIn = false,
  onSelectSibling,
  className,
}: ExploreDetailContentProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useEffectEvent(async (id: string) => {
    setState({ status: "loading" });
    const result = await loadRestroomDetailAction(id);
    if (!result.ok) {
      setState({
        status: "error",
        message:
          result.error === "not_found"
            ? "This listing is no longer available."
            : "Couldn’t load listing details. Try again.",
      });
      return;
    }

    const mapsPlatform =
      typeof navigator !== "undefined"
        ? detectMapsPlatform(navigator.userAgent)
        : "other";

    setState({
      status: "ready",
      detail: result.detail,
      siblings: result.siblings,
      mapsPlatform,
    });
  });

  useEffect(() => {
    void load(listingId);
  }, [listingId]);

  if (state.status === "loading") {
    return (
      <p
        className={cn("text-muted-foreground text-sm", className)}
        data-explore="detail-loading"
      >
        Loading listing…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className={cn("flex flex-col gap-2", className)}
        data-explore="detail-error"
      >
        <p className="text-destructive text-sm">{state.message}</p>
        <button
          type="button"
          className="text-primary text-sm font-medium underline-offset-2 hover:underline"
          onClick={() => void load(listingId)}
        >
          Retry
        </button>
      </div>
    );
  }

  const view = toDetailContentView({
    detail: state.detail,
    siblings: state.siblings,
    nearby,
    distancesAvailable,
    mapsPlatform: state.mapsPlatform,
  });
  const reviews = toReviewsFeedView({
    reviews: state.detail.reviews,
    listingId: state.detail.id,
    isSignedIn,
  });

  return (
    <DetailContentBody
      view={view}
      reviews={reviews}
      onSelectSibling={onSelectSibling}
      className={className}
    />
  );
}

function DetailContentBody({
  view,
  reviews,
  onSelectSibling,
  className,
}: {
  view: DetailContentView;
  reviews: ReviewsFeedView;
  onSelectSibling: (siblingId: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}
      data-explore="detail-content"
      data-listing-id={view.listingId}
    >
      {view.showPhotoPlaceholder ? (
        <div
          data-explore="detail-photo-placeholder"
          className="bg-secondary text-muted-foreground flex h-36 items-center justify-center rounded-xl text-sm"
        >
          {PHOTO_PLACEHOLDER_LABEL}
        </div>
      ) : (
        <ul
          data-explore="detail-photo-gallery"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {view.photos.map((photo) => (
            <li
              key={photo.id}
              className="bg-secondary relative h-36 w-44 shrink-0 overflow-hidden rounded-xl"
            >
              {/* Seed photos are remote Supabase URLs; unoptimized avoids remotePatterns setup. */}
              <Image
                src={photo.publicUrl}
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="176px"
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold tracking-tight">
          {view.establishmentName}
        </h2>
        {view.formattedAddress ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {view.formattedAddress}
          </p>
        ) : null}
        {view.locationLine ? (
          <p
            className="text-foreground text-sm font-medium"
            data-explore="detail-location-line"
          >
            {view.locationLine}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {view.distanceLabel ? (
          <span
            data-explore="detail-distance"
            className="text-muted-foreground font-medium tabular-nums"
          >
            {view.distanceLabel}
          </span>
        ) : null}
        {view.communityVerified ? (
          <span
            data-explore="detail-verified-badge"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium"
          >
            <BadgeCheck className="size-4 shrink-0" aria-hidden />
            {COMMUNITY_VERIFIED_LABEL}
          </span>
        ) : (
          <span
            data-explore="detail-unverified"
            className="text-muted-foreground text-sm"
          >
            {view.trustLabel}
          </span>
        )}
        {view.ratingLabel ? (
          <span
            data-explore="detail-rating"
            className="text-foreground text-sm font-medium tabular-nums"
          >
            {view.ratingLabel}
          </span>
        ) : null}
      </div>

      <ul
        data-explore="detail-amenities"
        className="flex flex-wrap gap-2"
        aria-label="Amenities"
      >
        {view.amenityChips.map((chip) => (
          <li
            key={chip.id}
            data-amenity={chip.id}
            className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium"
          >
            {chip.label}
          </li>
        ))}
      </ul>

      <a
        href={view.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-explore="detail-maps-cta"
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#006767] to-[#008282] text-sm font-semibold text-white shadow-[0_1px_2px_rgb(45_49_50/0.08)] transition-opacity hover:opacity-95"
      >
        {MAPS_CTA_LABEL}
      </a>

      {view.siblings.length > 0 ? (
        <section data-explore="detail-siblings" className="flex flex-col gap-2">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Other restrooms here
          </h3>
          <ul className="flex flex-col gap-1">
            {view.siblings.map((sibling) => (
              <li key={sibling.id}>
                <button
                  type="button"
                  data-explore="detail-sibling"
                  data-sibling-id={sibling.id}
                  className="hover:bg-secondary/70 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors"
                  onClick={() => onSelectSibling(sibling.id)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-heading block text-sm font-semibold">
                      {sibling.title}
                    </span>
                    {sibling.ratingLabel ? (
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {sibling.ratingLabel}
                      </span>
                    ) : null}
                  </span>
                  {sibling.hasBidet ? (
                    <Droplets
                      className="text-primary size-3.5 shrink-0"
                      aria-label="Has bidet"
                    />
                  ) : null}
                  {sibling.communityVerified ? (
                    <BadgeCheck
                      className="text-primary size-3.5 shrink-0"
                      aria-label="Community verified"
                    />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DetailReviewsFeed reviews={reviews} />
    </div>
  );
}

function DetailReviewsFeed({ reviews }: { reviews: ReviewsFeedView }) {
  return (
    <section
      data-explore="detail-reviews"
      className="flex flex-col gap-3"
      aria-label={reviews.title}
    >
      <h3 className="font-heading text-sm font-semibold tracking-tight">
        {reviews.title}
      </h3>

      {reviews.isEmpty ? (
        <div
          data-explore="detail-reviews-empty"
          className="bg-secondary/60 flex flex-col gap-2 rounded-xl px-3.5 py-3"
          role="status"
        >
          <p className="text-foreground text-sm font-medium leading-relaxed">
            {reviews.emptyCopy}
          </p>
          {reviews.showSignInHint && reviews.signInHref ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {reviews.signInHint}{" "}
              <Link
                href={reviews.signInHref}
                data-explore="detail-reviews-sign-in"
                className="text-primary font-medium underline-offset-2 hover:underline"
              >
                {reviews.signInCta}
              </Link>
            </p>
          ) : null}
        </div>
      ) : (
        <ul
          data-explore="detail-reviews-list"
          className="flex flex-col gap-3"
        >
          {reviews.items.map((item) => (
            <li
              key={item.id}
              data-explore="detail-review"
              data-review-id={item.id}
              className="border-border/60 flex flex-col gap-2 border-t pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span
                  data-explore="detail-review-author"
                  className="text-foreground text-sm font-medium"
                >
                  {item.authorDisplayName}
                </span>
                <span
                  data-explore="detail-review-stars"
                  className="text-primary text-sm tracking-wide tabular-nums"
                  aria-label={`${item.stars} out of 5 stars`}
                >
                  {item.starLabels}
                </span>
              </div>

              {item.checkboxChips.length > 0 ? (
                <ul
                  data-explore="detail-review-checkboxes"
                  className="flex flex-wrap gap-1.5"
                  aria-label="Review checkboxes"
                >
                  {item.checkboxChips.map((chip) => (
                    <li
                      key={chip.id}
                      data-checkbox={chip.id}
                      data-ok={chip.ok ? "true" : "false"}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        chip.ok
                          ? "bg-[#d0e7e9] text-[#006767]"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {chip.label}
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.comment ? (
                <p
                  data-explore="detail-review-comment"
                  className="text-foreground/90 text-sm leading-relaxed"
                >
                  {item.comment}
                </p>
              ) : null}

              {item.photos.length > 0 ? (
                <ul
                  data-explore="detail-review-photos"
                  className="flex gap-2 overflow-x-auto pb-0.5"
                >
                  {item.photos.map((photo) => (
                    <li
                      key={photo.id}
                      className="bg-secondary relative h-20 w-24 shrink-0 overflow-hidden rounded-lg"
                    >
                      <Image
                        src={photo.publicUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="96px"
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
