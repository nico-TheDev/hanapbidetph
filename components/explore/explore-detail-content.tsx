"use client";

import { BadgeCheck, Droplets } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  RATE_ERROR_COPY,
  applyReviewUpsertToDetail,
  shouldOpenRateForm,
  toRateFormView,
  type RateFormValues,
  type RateFormView,
} from "@/lib/explore/detail-rate";
import {
  DISPUTED_WARNING_COPY,
  REPORT_ERROR_COPY,
  applyReportSuccess,
  shouldOpenReportForm,
  toReportFormView,
  toUnavailableView,
  type ReportFormView,
} from "@/lib/explore/detail-report";
import {
  toReviewsFeedView,
  type ReviewsFeedView,
} from "@/lib/explore/detail-reviews";
import {
  VERIFY_ERROR_COPY,
  applyVerifyResult,
  shouldAutoVerify,
  toVerifyCtaView,
  type VerifyCtaView,
} from "@/lib/explore/detail-verify";
import {
  MAX_REVIEW_PHOTOS,
  compressReviewPhotoFile,
  encodePhotoUploads,
  limitReviewPhotos,
} from "@/lib/explore/compress-review-photo";
import { loadRestroomDetailAction } from "@/lib/explore/load-detail-action";
import { reportRestroomAction } from "@/lib/explore/report-restroom-action";
import { upsertReviewAction } from "@/lib/explore/upsert-review-action";
import { verifyRestroomAction } from "@/lib/explore/verify-restroom-action";
import type {
  NearbyRestroom,
  ReportReason,
  RestroomDetail,
  Review,
  SiblingRestroom,
} from "@/lib/restroom-directory/schemas";
import { cn } from "@/lib/utils";

type ExploreDetailContentProps = {
  listingId: string;
  nearby?: NearbyRestroom;
  distancesAvailable: boolean;
  isSignedIn?: boolean;
  /** OAuth / deep-link resume: verify auto-submits; rate/report open forms. */
  resumeAction?: string | null;
  onSelectSibling: (siblingId: string) => void;
  className?: string;
};

type TrustState = {
  verifyCount: number;
  communityVerified: boolean;
  viewerHasVerified: boolean;
};

type RatingState = {
  ratingAvg: number | null;
  ratingCount: number;
  reviews: Review[];
};

type ViewerState = {
  userId: string;
  displayName: string;
} | null;

type LoadState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      detail: RestroomDetail;
      siblings: SiblingRestroom[];
      mapsPlatform: MapsPlatform;
    };

const EMPTY_DRAFT: RateFormValues = {
  stars: null,
  comment: "",
  cleanlinessOk: null,
  amenitiesOk: null,
  accessOk: null,
};

/**
 * Listing detail body: amenities, trust, photos, siblings, Maps handoff,
 * reviews feed (31), Verify CTA (32), Rate form (33), Report + disputed /
 * unavailable states (34).
 */
export function ExploreDetailContent({
  listingId,
  nearby,
  distancesAvailable,
  isSignedIn = false,
  resumeAction = null,
  onSelectSibling,
  className,
}: ExploreDetailContentProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [trust, setTrust] = useState<TrustState | null>(null);
  const [rating, setRating] = useState<RatingState | null>(null);
  const [viewer, setViewer] = useState<ViewerState>(null);
  const [isDisputed, setIsDisputed] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyPending, setVerifyPending] = useState(false);
  const [autoVerifyDone, setAutoVerifyDone] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [ratePending, setRatePending] = useState(false);
  const [rateDraft, setRateDraft] = useState<RateFormValues>(EMPTY_DRAFT);
  const [ratePhotoFiles, setRatePhotoFiles] = useState<File[]>([]);
  const [rateOpenedFromResume, setRateOpenedFromResume] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportPending, setReportPending] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [reportOpenedFromResume, setReportOpenedFromResume] = useState(false);

  const load = useEffectEvent(async (id: string) => {
    setState({ status: "loading" });
    setTrust(null);
    setRating(null);
    setViewer(null);
    setIsDisputed(false);
    setVerifyError(null);
    setVerifyPending(false);
    setAutoVerifyDone(false);
    setRateOpen(false);
    setRateError(null);
    setRatePending(false);
    setRateDraft(EMPTY_DRAFT);
    setRatePhotoFiles([]);
    setRateOpenedFromResume(false);
    setReportOpen(false);
    setReportSubmitted(false);
    setReportError(null);
    setReportPending(false);
    setReportReason(null);
    setReportDetails("");
    setReportOpenedFromResume(false);
    const result = await loadRestroomDetailAction(id);
    if (!result.ok) {
      if (result.error === "not_found") {
        setState({ status: "unavailable" });
        return;
      }
      setState({
        status: "error",
        message: "Couldn’t load listing details. Try again.",
      });
      return;
    }

    const mapsPlatform =
      typeof navigator !== "undefined"
        ? detectMapsPlatform(navigator.userAgent)
        : "other";

    setTrust({
      verifyCount: result.detail.verifyCount,
      communityVerified: result.detail.communityVerified,
      viewerHasVerified: false,
    });
    setRating({
      ratingAvg: result.detail.ratingAvg,
      ratingCount: result.detail.ratingCount,
      reviews: result.detail.reviews,
    });
    setViewer(result.viewer);
    setIsDisputed(result.detail.isDisputed);
    setState({
      status: "ready",
      detail: result.detail,
      siblings: result.siblings,
      mapsPlatform,
    });
  });

  const runVerify = useEffectEvent(async (id: string, clearResume: boolean) => {
    setVerifyPending(true);
    setVerifyError(null);
    const result = await verifyRestroomAction(id);
    setVerifyPending(false);

    if (!result.ok) {
      if (result.error === "unauthenticated" && result.loginHref) {
        router.push(result.loginHref);
        return;
      }
      setVerifyError(result.message || VERIFY_ERROR_COPY);
      return;
    }

    setTrust(applyVerifyResult(result));
    if (clearResume) {
      router.replace(`/restrooms/${id}`);
    }
  });

  const openRateForm = useEffectEvent((seed: RateFormValues) => {
    setRateDraft(seed);
    setRatePhotoFiles([]);
    setRateError(null);
    setRateOpen(true);
  });

  const runRateSubmit = useEffectEvent(async (id: string) => {
    if (rateDraft.stars === null) {
      setRateError("Choose a star rating from 1 to 5.");
      return;
    }

    setRatePending(true);
    setRateError(null);

    let photos: Array<{ base64: string; contentType: string }> = [];
    try {
      const limited = limitReviewPhotos(ratePhotoFiles);
      const compressed = await Promise.all(
        limited.map((file) => compressReviewPhotoFile(file)),
      );
      photos = encodePhotoUploads(compressed);
    } catch {
      setRatePending(false);
      setRateError(RATE_ERROR_COPY);
      return;
    }

    const result = await upsertReviewAction({
      restroomId: id,
      stars: rateDraft.stars,
      comment: rateDraft.comment.trim() ? rateDraft.comment.trim() : null,
      cleanlinessOk: rateDraft.cleanlinessOk,
      amenitiesOk: rateDraft.amenitiesOk,
      accessOk: rateDraft.accessOk,
      photos,
    });
    setRatePending(false);

    if (!result.ok) {
      if (result.error === "unauthenticated" && result.loginHref) {
        router.push(result.loginHref);
        return;
      }
      setRateError(result.message || RATE_ERROR_COPY);
      return;
    }

    setRating((current) => {
      const base = current ?? {
        ratingAvg: null,
        ratingCount: 0,
        reviews: [],
      };
      return applyReviewUpsertToDetail({
        reviews: base.reviews,
        ratingAvg: base.ratingAvg,
        ratingCount: base.ratingCount,
        review: result.review,
        ratingAvgAfter: result.ratingAvg,
        ratingCountAfter: result.ratingCount,
      });
    });
    setRateOpen(false);
    setRatePhotoFiles([]);
    if (shouldOpenRateForm(resumeAction)) {
      router.replace(`/restrooms/${id}`);
    }
  });

  const openReportForm = useEffectEvent(() => {
    setReportOpen(true);
    setReportError(null);
    setReportSubmitted(false);
  });

  const runReportSubmit = useEffectEvent(async (id: string) => {
    if (reportReason === null) {
      setReportError("Choose a reason for this report.");
      return;
    }

    setReportPending(true);
    setReportError(null);

    const result = await reportRestroomAction({
      restroomId: id,
      reason: reportReason,
      details: reportDetails.trim() ? reportDetails.trim() : null,
    });
    setReportPending(false);

    if (!result.ok) {
      if (result.error === "unauthenticated" && result.loginHref) {
        router.push(result.loginHref);
        return;
      }
      if (result.error === "not_found") {
        setState({ status: "unavailable" });
        return;
      }
      setReportError(result.message || REPORT_ERROR_COPY);
      return;
    }

    const disputed = applyReportSuccess({ isDisputed: result.isDisputed });
    setIsDisputed(disputed.isDisputed);
    setReportSubmitted(true);
    setReportOpen(false);
    if (shouldOpenReportForm(resumeAction)) {
      router.replace(`/restrooms/${id}`);
    }
  });

  useEffect(() => {
    void load(listingId);
  }, [listingId]);

  useEffect(() => {
    if (state.status !== "ready" || !trust) {
      return;
    }
    if (!isSignedIn || !shouldAutoVerify(resumeAction) || autoVerifyDone) {
      return;
    }
    if (trust.viewerHasVerified) {
      setAutoVerifyDone(true);
      return;
    }
    setAutoVerifyDone(true);
    void runVerify(listingId, true);
  }, [
    state.status,
    trust,
    isSignedIn,
    resumeAction,
    autoVerifyDone,
    listingId,
  ]);

  useEffect(() => {
    if (state.status !== "ready" || !rating) {
      return;
    }
    if (!isSignedIn || !shouldOpenRateForm(resumeAction) || rateOpenedFromResume) {
      return;
    }
    const rateView = toRateFormView({
      listingId,
      isSignedIn,
      viewerUserId: viewer?.userId ?? null,
      reviews: rating.reviews,
      open: false,
    });
    setRateOpenedFromResume(true);
    openRateForm(rateView.values);
  }, [
    state.status,
    rating,
    isSignedIn,
    resumeAction,
    rateOpenedFromResume,
    listingId,
    viewer,
  ]);

  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }
    if (
      !isSignedIn ||
      !shouldOpenReportForm(resumeAction) ||
      reportOpenedFromResume ||
      reportSubmitted
    ) {
      return;
    }
    setReportOpenedFromResume(true);
    openReportForm();
  }, [
    state.status,
    isSignedIn,
    resumeAction,
    reportOpenedFromResume,
    reportSubmitted,
  ]);

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

  if (state.status === "unavailable") {
    const unavailable = toUnavailableView();
    return (
      <div
        className={cn("flex flex-col gap-3", className)}
        data-explore="detail-unavailable"
      >
        <p className="text-foreground text-sm font-medium">
          {unavailable.message}
        </p>
        <Link
          href={unavailable.ctaHref}
          data-explore="detail-unavailable-cta"
          className="text-primary inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold transition-colors hover:bg-secondary/70"
        >
          {unavailable.ctaLabel}
        </Link>
      </div>
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

  const trustState = trust ?? {
    verifyCount: state.detail.verifyCount,
    communityVerified: state.detail.communityVerified,
    viewerHasVerified: false,
  };
  const ratingState = rating ?? {
    ratingAvg: state.detail.ratingAvg,
    ratingCount: state.detail.ratingCount,
    reviews: state.detail.reviews,
  };

  const view = toDetailContentView({
    detail: {
      ...state.detail,
      verifyCount: trustState.verifyCount,
      communityVerified: trustState.communityVerified,
      ratingAvg: ratingState.ratingAvg,
      ratingCount: ratingState.ratingCount,
      reviews: ratingState.reviews,
    },
    siblings: state.siblings,
    nearby,
    distancesAvailable,
    mapsPlatform: state.mapsPlatform,
  });
  const reviews = toReviewsFeedView({
    reviews: ratingState.reviews,
    listingId: state.detail.id,
    isSignedIn,
  });
  const verify = toVerifyCtaView({
    listingId: state.detail.id,
    isSignedIn,
    viewerHasVerified: trustState.viewerHasVerified,
    verifyCount: trustState.verifyCount,
    communityVerified: trustState.communityVerified,
    errorMessage: verifyError,
    pending: verifyPending,
  });
  const rate = toRateFormView({
    listingId: state.detail.id,
    isSignedIn,
    viewerUserId: viewer?.userId ?? null,
    reviews: ratingState.reviews,
    open: rateOpen,
    attributionDisplayName: viewer?.displayName ?? null,
    errorMessage: rateError,
    pending: ratePending,
  });
  const report = toReportFormView({
    listingId: state.detail.id,
    isSignedIn,
    open: reportOpen,
    reason: reportReason,
    details: reportDetails,
    submitted: reportSubmitted,
    errorMessage: reportError,
    pending: reportPending,
  });

  return (
    <DetailContentBody
      view={view}
      reviews={reviews}
      verify={verify}
      rate={rate}
      report={report}
      isDisputed={isDisputed}
      rateDraft={rateDraft}
      ratePhotoCount={ratePhotoFiles.length}
      onSelectSibling={onSelectSibling}
      onVerify={() => void runVerify(listingId, false)}
      onOpenRate={() => openRateForm(rate.values)}
      onCloseRate={() => {
        setRateOpen(false);
        setRateError(null);
      }}
      onRateDraftChange={setRateDraft}
      onRatePhotosChange={setRatePhotoFiles}
      onRateSubmit={() => void runRateSubmit(listingId)}
      onOpenReport={openReportForm}
      onCloseReport={() => {
        setReportOpen(false);
        setReportError(null);
      }}
      onReportReasonChange={setReportReason}
      onReportDetailsChange={setReportDetails}
      onReportSubmit={() => void runReportSubmit(listingId)}
      className={className}
    />
  );
}

function DetailContentBody({
  view,
  reviews,
  verify,
  rate,
  report,
  isDisputed,
  rateDraft,
  ratePhotoCount,
  onSelectSibling,
  onVerify,
  onOpenRate,
  onCloseRate,
  onRateDraftChange,
  onRatePhotosChange,
  onRateSubmit,
  onOpenReport,
  onCloseReport,
  onReportReasonChange,
  onReportDetailsChange,
  onReportSubmit,
  className,
}: {
  view: DetailContentView;
  reviews: ReviewsFeedView;
  verify: VerifyCtaView;
  rate: RateFormView;
  report: ReportFormView;
  isDisputed: boolean;
  rateDraft: RateFormValues;
  ratePhotoCount: number;
  onSelectSibling: (siblingId: string) => void;
  onVerify: () => void;
  onOpenRate: () => void;
  onCloseRate: () => void;
  onRateDraftChange: (next: RateFormValues) => void;
  onRatePhotosChange: (files: File[]) => void;
  onRateSubmit: () => void;
  onOpenReport: () => void;
  onCloseReport: () => void;
  onReportReasonChange: (reason: ReportReason | null) => void;
  onReportDetailsChange: (details: string) => void;
  onReportSubmit: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}
      data-explore="detail-content"
      data-listing-id={view.listingId}
    >
      {isDisputed ? (
        <div
          role="status"
          data-explore="detail-disputed-banner"
          className="rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
        >
          {DISPUTED_WARNING_COPY}
        </div>
      ) : null}

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

      <DetailVerifyCta verify={verify} onVerify={onVerify} />

      <DetailRateForm
        rate={rate}
        draft={rateDraft}
        photoCount={ratePhotoCount}
        onOpen={onOpenRate}
        onClose={onCloseRate}
        onDraftChange={onRateDraftChange}
        onPhotosChange={onRatePhotosChange}
        onSubmit={onRateSubmit}
      />

      <DetailReportForm
        report={report}
        onOpen={onOpenReport}
        onClose={onCloseReport}
        onReasonChange={onReportReasonChange}
        onDetailsChange={onReportDetailsChange}
        onSubmit={onReportSubmit}
      />

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

function DetailVerifyCta({
  verify,
  onVerify,
}: {
  verify: VerifyCtaView;
  onVerify: () => void;
}) {
  const buttonClass = cn(
    "inline-flex h-11 w-full items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
    verify.mode === "verified"
      ? "border-primary/30 bg-[#d0e7e9] text-[#006767]"
      : "border-border bg-background text-foreground hover:bg-secondary/70",
    verify.disabled && "cursor-not-allowed opacity-70",
  );

  return (
    <div data-explore="detail-verify" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span
          data-explore="detail-verify-count"
          className="text-muted-foreground text-sm tabular-nums"
        >
          {verify.verifyCountLabel}
        </span>
        {verify.communityVerified ? (
          <span
            data-explore="detail-verify-community"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium"
          >
            <BadgeCheck className="size-4 shrink-0" aria-hidden />
            {COMMUNITY_VERIFIED_LABEL}
          </span>
        ) : null}
      </div>

      {verify.mode === "gated" && verify.loginHref ? (
        <Link
          href={verify.loginHref}
          data-explore="detail-verify-cta"
          data-verify-mode="gated"
          className={buttonClass}
        >
          {verify.label}
        </Link>
      ) : (
        <button
          type="button"
          data-explore="detail-verify-cta"
          data-verify-mode={verify.mode}
          className={buttonClass}
          disabled={verify.disabled}
          onClick={onVerify}
        >
          {verify.label}
        </button>
      )}

      {verify.showRetry && verify.errorMessage ? (
        <div
          data-explore="detail-verify-error"
          className="flex flex-col gap-1"
          role="alert"
        >
          <p className="text-destructive text-sm">{verify.errorMessage}</p>
          <button
            type="button"
            data-explore="detail-verify-retry"
            className="text-primary self-start text-sm font-medium underline-offset-2 hover:underline"
            onClick={onVerify}
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}

function cycleTriState(value: boolean | null): boolean | null {
  if (value === null) return true;
  if (value === true) return false;
  return null;
}

function triStateLabel(value: boolean | null, okLabel: string): string {
  if (value === true) return okLabel;
  if (value === false) return `${okLabel} needs work`;
  return `${okLabel}: skip`;
}

function DetailRateForm({
  rate,
  draft,
  photoCount,
  onOpen,
  onClose,
  onDraftChange,
  onPhotosChange,
  onSubmit,
}: {
  rate: RateFormView;
  draft: RateFormValues;
  photoCount: number;
  onOpen: () => void;
  onClose: () => void;
  onDraftChange: (next: RateFormValues) => void;
  onPhotosChange: (files: File[]) => void;
  onSubmit: () => void;
}) {
  const buttonClass = cn(
    "inline-flex h-11 w-full items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
    "border-border bg-background text-foreground hover:bg-secondary/70",
  );

  return (
    <div data-explore="detail-rate" className="flex flex-col gap-2">
      {rate.mode === "gated" && rate.loginHref ? (
        <Link
          href={rate.loginHref}
          data-explore="detail-rate-cta"
          data-rate-mode="gated"
          className={buttonClass}
        >
          {rate.ctaLabel}
        </Link>
      ) : !rate.formVisible ? (
        <button
          type="button"
          data-explore="detail-rate-cta"
          data-rate-mode={rate.mode}
          className={buttonClass}
          onClick={onOpen}
        >
          {rate.ctaLabel}
        </button>
      ) : null}

      {rate.formVisible ? (
        <form
          data-explore="detail-rate-form"
          data-rate-mode={rate.mode}
          className="border-border/70 bg-secondary/40 flex flex-col gap-3 rounded-xl border p-3.5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              {rate.formTitle}
            </h3>
            <button
              type="button"
              data-explore="detail-rate-cancel"
              className="text-muted-foreground text-sm font-medium underline-offset-2 hover:underline"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>

          {rate.attributionPreview ? (
            <p
              data-explore="detail-rate-attribution"
              className="text-muted-foreground text-sm"
            >
              {rate.attributionPreview}
            </p>
          ) : null}

          <fieldset className="flex flex-col gap-2">
            <legend className="text-foreground text-sm font-medium">
              Stars
            </legend>
            <div
              data-explore="detail-rate-stars"
              className="flex flex-wrap gap-1.5"
              role="radiogroup"
              aria-label="Star rating"
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const selected = draft.stars === star;
                return (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-star={star}
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                      selected
                        ? "bg-[#006767] text-white"
                        : "bg-background text-foreground border-border border",
                    )}
                    onClick={() =>
                      onDraftChange({ ...draft, stars: star })
                    }
                  >
                    {star}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["cleanlinessOk", "Cleanliness"],
                ["amenitiesOk", "Amenities"],
                ["accessOk", "Access"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                data-explore="detail-rate-checkbox"
                data-checkbox={key}
                data-value={
                  draft[key] === null
                    ? "skip"
                    : draft[key]
                      ? "ok"
                      : "needs_work"
                }
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  draft[key] === true
                    ? "bg-[#d0e7e9] text-[#006767]"
                    : draft[key] === false
                      ? "bg-secondary text-muted-foreground"
                      : "border-border bg-background text-muted-foreground border",
                )}
                onClick={() =>
                  onDraftChange({
                    ...draft,
                    [key]: cycleTriState(draft[key]),
                  })
                }
              >
                {triStateLabel(draft[key], label)}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-foreground text-sm font-medium">
              Comment (optional)
            </span>
            <textarea
              data-explore="detail-rate-comment"
              value={draft.comment}
              rows={3}
              className="border-border bg-background text-foreground rounded-xl border px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-[#006767]/35"
              onChange={(event) =>
                onDraftChange({ ...draft, comment: event.target.value })
              }
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-foreground text-sm font-medium">
              Photos (optional, max {MAX_REVIEW_PHOTOS})
            </span>
            {rate.existingPhotos.length > 0 && photoCount === 0 ? (
              <ul
                data-explore="detail-rate-existing-photos"
                className="flex gap-2 overflow-x-auto pb-0.5"
              >
                {rate.existingPhotos.map((photo) => (
                  <li
                    key={photo.id}
                    className="bg-secondary relative h-16 w-20 shrink-0 overflow-hidden rounded-lg"
                  >
                    <Image
                      src={photo.publicUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="80px"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
            <input
              data-explore="detail-rate-photos"
              type="file"
              accept="image/*"
              multiple
              className="text-muted-foreground text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#d0e7e9] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#006767]"
              onChange={(event) => {
                const files = limitReviewPhotos(
                  Array.from(event.target.files ?? []),
                );
                onPhotosChange(files);
              }}
            />
            {photoCount > 0 ? (
              <span className="text-muted-foreground text-xs tabular-nums">
                {photoCount} selected (compressed on submit)
              </span>
            ) : null}
          </label>

          <button
            type="submit"
            data-explore="detail-rate-submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#006767] to-[#008282] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!rate.canSubmit}
          >
            {rate.submitLabel}
          </button>

          {rate.showRetry && rate.errorMessage ? (
            <div
              data-explore="detail-rate-error"
              className="flex flex-col gap-1"
              role="alert"
            >
              <p className="text-destructive text-sm">{rate.errorMessage}</p>
              <button
                type="button"
                data-explore="detail-rate-retry"
                className="text-primary self-start text-sm font-medium underline-offset-2 hover:underline"
                onClick={onSubmit}
              >
                Retry
              </button>
            </div>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

function DetailReportForm({
  report,
  onOpen,
  onClose,
  onReasonChange,
  onDetailsChange,
  onSubmit,
}: {
  report: ReportFormView;
  onOpen: () => void;
  onClose: () => void;
  onReasonChange: (reason: ReportReason | null) => void;
  onDetailsChange: (details: string) => void;
  onSubmit: () => void;
}) {
  const buttonClass = cn(
    "inline-flex h-11 w-full items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
    "border-border bg-background text-foreground hover:bg-secondary/70",
  );

  return (
    <div data-explore="detail-report" className="flex flex-col gap-2">
      {report.mode === "submitted" && report.confirmationMessage ? (
        <p
          data-explore="detail-report-confirmation"
          className="bg-secondary/60 text-foreground rounded-xl px-3.5 py-3 text-sm font-medium"
          role="status"
        >
          {report.confirmationMessage}
        </p>
      ) : null}

      {report.mode === "gated" && report.loginHref ? (
        <Link
          href={report.loginHref}
          data-explore="detail-report-cta"
          data-report-mode="gated"
          className={buttonClass}
        >
          {report.ctaLabel}
        </Link>
      ) : report.mode === "ready" && !report.formVisible ? (
        <button
          type="button"
          data-explore="detail-report-cta"
          data-report-mode={report.mode}
          className={buttonClass}
          onClick={onOpen}
        >
          {report.ctaLabel}
        </button>
      ) : null}

      {report.formVisible ? (
        <form
          data-explore="detail-report-form"
          className="border-border/70 bg-secondary/40 flex flex-col gap-3 rounded-xl border p-3.5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              {report.formTitle}
            </h3>
            <button
              type="button"
              data-explore="detail-report-cancel"
              className="text-muted-foreground text-sm font-medium underline-offset-2 hover:underline"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>

          <fieldset
            data-explore="detail-report-reasons"
            className="flex flex-col gap-2"
          >
            <legend className="text-foreground mb-1 text-sm font-medium">
              Reason
            </legend>
            {report.reasonOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={option.value}
                  checked={report.reason === option.value}
                  onChange={() => onReasonChange(option.value)}
                  data-explore="detail-report-reason"
                  data-reason={option.value}
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <span className="text-foreground text-sm font-medium">
              Details (optional)
            </span>
            <textarea
              data-explore="detail-report-details"
              rows={3}
              value={report.details}
              onChange={(event) => onDetailsChange(event.target.value)}
              className="border-border bg-background min-h-20 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#006767]/40"
              placeholder="Anything that helps moderators"
            />
          </label>

          <button
            type="submit"
            data-explore="detail-report-submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#006767] to-[#008282] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!report.canSubmit}
          >
            {report.submitLabel}
          </button>

          {report.showRetry && report.errorMessage ? (
            <div
              data-explore="detail-report-error"
              className="flex flex-col gap-1"
              role="alert"
            >
              <p className="text-destructive text-sm">{report.errorMessage}</p>
              <button
                type="button"
                data-explore="detail-report-retry"
                className="text-primary self-start text-sm font-medium underline-offset-2 hover:underline"
                onClick={onSubmit}
              >
                Retry
              </button>
            </div>
          ) : null}
        </form>
      ) : null}
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
