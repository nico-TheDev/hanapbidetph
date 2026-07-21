import { loginHref } from "@/lib/auth/return-path";
import type { ReportReason } from "@/lib/restroom-directory/schemas";

/** Ticket 34 — Report flow + disputed / unavailable detail states. */
export const REPORT_CTA_LABEL = "Report this CR" as const;
export const REPORT_FORM_TITLE = "Report this listing" as const;
export const REPORT_SUBMIT_LABEL = "Submit report" as const;
export const REPORT_ERROR_COPY =
  "Couldn’t submit your report. Try again." as const;
export const REPORT_CONFIRMATION_COPY =
  "Thanks — we received your report." as const;

export const DISPUTED_WARNING_COPY =
  "This listing is disputed and under review. Details may be unreliable." as const;

export const UNAVAILABLE_COPY = "This restroom isn't available" as const;
export const UNAVAILABLE_CTA_LABEL = "Back to Explore" as const;

export const REPORT_REASON_OPTIONS: ReadonlyArray<{
  value: ReportReason;
  label: string;
}> = [
  { value: "doesnt_exist", label: "Doesn't exist" },
  { value: "wrong_location", label: "Wrong location" },
  { value: "permanently_closed", label: "Permanently closed" },
  { value: "inappropriate_photos", label: "Inappropriate photos" },
] as const;

export type ReportFormMode = "gated" | "ready" | "submitted";

export type ReportFormView = {
  listingId: string;
  mode: ReportFormMode;
  ctaLabel: typeof REPORT_CTA_LABEL;
  formTitle: typeof REPORT_FORM_TITLE;
  submitLabel: typeof REPORT_SUBMIT_LABEL;
  formVisible: boolean;
  canSubmit: boolean;
  loginHref: string | null;
  reason: ReportReason | null;
  details: string;
  reasonOptions: typeof REPORT_REASON_OPTIONS;
  confirmationMessage: string | null;
  errorMessage: string | null;
  showRetry: boolean;
  pending: boolean;
};

export type UnavailableView = {
  message: typeof UNAVAILABLE_COPY;
  ctaLabel: typeof UNAVAILABLE_CTA_LABEL;
  ctaHref: "/";
};

export type DisputedBannerState = {
  isDisputed: true;
  showDisputedBanner: true;
  disputedWarning: typeof DISPUTED_WARNING_COPY;
};

/** Interrupted-flow return path for auth-gate (ticket 09). */
export function reportReturnPath(listingId: string): string {
  return `/restrooms/${listingId}?action=report`;
}

/** True when deep-link / OAuth return should open the report form. */
export function shouldOpenReportForm(action: string | null | undefined): boolean {
  return action === "report";
}

/**
 * View model for the Report CTA + reason picker (ticket 34).
 * Guests are auth-gated; signed-in users pick a reason + optional details.
 */
export function toReportFormView(input: {
  listingId: string;
  isSignedIn: boolean;
  open: boolean;
  reason?: ReportReason | null;
  details?: string;
  submitted?: boolean;
  errorMessage?: string | null;
  pending?: boolean;
}): ReportFormView {
  const errorMessage = input.errorMessage ?? null;
  const pending = Boolean(input.pending);
  const reason = input.reason ?? null;
  const details = input.details ?? "";

  if (!input.isSignedIn) {
    return {
      listingId: input.listingId,
      mode: "gated",
      ctaLabel: REPORT_CTA_LABEL,
      formTitle: REPORT_FORM_TITLE,
      submitLabel: REPORT_SUBMIT_LABEL,
      formVisible: false,
      canSubmit: false,
      loginHref: loginHref(reportReturnPath(input.listingId)),
      reason: null,
      details: "",
      reasonOptions: REPORT_REASON_OPTIONS,
      confirmationMessage: null,
      errorMessage,
      showRetry: Boolean(errorMessage),
      pending: false,
    };
  }

  if (input.submitted) {
    return {
      listingId: input.listingId,
      mode: "submitted",
      ctaLabel: REPORT_CTA_LABEL,
      formTitle: REPORT_FORM_TITLE,
      submitLabel: REPORT_SUBMIT_LABEL,
      formVisible: false,
      canSubmit: false,
      loginHref: null,
      reason,
      details,
      reasonOptions: REPORT_REASON_OPTIONS,
      confirmationMessage: REPORT_CONFIRMATION_COPY,
      errorMessage: null,
      showRetry: false,
      pending: false,
    };
  }

  return {
    listingId: input.listingId,
    mode: "ready",
    ctaLabel: REPORT_CTA_LABEL,
    formTitle: REPORT_FORM_TITLE,
    submitLabel: REPORT_SUBMIT_LABEL,
    formVisible: input.open,
    canSubmit: reason !== null && !pending,
    loginHref: null,
    reason,
    details,
    reasonOptions: REPORT_REASON_OPTIONS,
    confirmationMessage: null,
    errorMessage,
    showRetry: Boolean(errorMessage),
    pending,
  };
}

/** After a successful report, listing becomes disputed and shows the banner. */
export function applyReportSuccess(_input?: {
  isDisputed?: boolean;
}): DisputedBannerState {
  return {
    isDisputed: true,
    showDisputedBanner: true,
    disputedWarning: DISPUTED_WARNING_COPY,
  };
}

/** Archived / missing listing empty state (ticket 34). */
export function toUnavailableView(): UnavailableView {
  return {
    message: UNAVAILABLE_COPY,
    ctaLabel: UNAVAILABLE_CTA_LABEL,
    ctaHref: "/",
  };
}
