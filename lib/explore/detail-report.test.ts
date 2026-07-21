import { describe, expect, it } from "vitest";

import {
  DISPUTED_WARNING_COPY,
  REPORT_CONFIRMATION_COPY,
  REPORT_CTA_LABEL,
  REPORT_ERROR_COPY,
  REPORT_FORM_TITLE,
  REPORT_REASON_OPTIONS,
  REPORT_SUBMIT_LABEL,
  UNAVAILABLE_CTA_LABEL,
  UNAVAILABLE_COPY,
  applyReportSuccess,
  reportReturnPath,
  shouldOpenReportForm,
  toReportFormView,
  toUnavailableView,
} from "./detail-report";

const LISTING_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("34 — Report flow and disputed/unavailable states", () => {
  it("gates anonymous users through auth-gate before showing report form", () => {
    const view = toReportFormView({
      listingId: LISTING_ID,
      isSignedIn: false,
      open: false,
    });

    expect(view.mode).toBe("gated");
    expect(view.ctaLabel).toBe(REPORT_CTA_LABEL);
    expect(view.formVisible).toBe(false);
    expect(view.canSubmit).toBe(false);
    expect(view.loginHref).toBe(
      `/login?next=${encodeURIComponent(reportReturnPath(LISTING_ID))}`,
    );
    expect(reportReturnPath(LISTING_ID)).toBe(
      `/restrooms/${LISTING_ID}?action=report`,
    );
    expect(shouldOpenReportForm("report")).toBe(true);
    expect(shouldOpenReportForm("verify")).toBe(false);
  });

  it("opens reason picker with optional details for signed-in users", () => {
    const view = toReportFormView({
      listingId: LISTING_ID,
      isSignedIn: true,
      open: true,
      reason: "wrong_location",
      details: "Pin is across the street",
    });

    expect(view.mode).toBe("ready");
    expect(view.formVisible).toBe(true);
    expect(view.formTitle).toBe(REPORT_FORM_TITLE);
    expect(view.submitLabel).toBe(REPORT_SUBMIT_LABEL);
    expect(view.canSubmit).toBe(true);
    expect(view.reason).toBe("wrong_location");
    expect(view.details).toBe("Pin is across the street");
    expect(REPORT_REASON_OPTIONS.map((o) => o.value)).toEqual([
      "doesnt_exist",
      "wrong_location",
      "permanently_closed",
      "inappropriate_photos",
    ]);
    expect(REPORT_REASON_OPTIONS.map((o) => o.label)).toEqual([
      "Doesn't exist",
      "Wrong location",
      "Permanently closed",
      "Inappropriate photos",
    ]);
  });

  it("requires a reason before submit; keeps detail with retry on failure", () => {
    const missingReason = toReportFormView({
      listingId: LISTING_ID,
      isSignedIn: true,
      open: true,
      reason: null,
    });
    expect(missingReason.canSubmit).toBe(false);

    const failed = toReportFormView({
      listingId: LISTING_ID,
      isSignedIn: true,
      open: true,
      reason: "doesnt_exist",
      errorMessage: REPORT_ERROR_COPY,
    });
    expect(failed.errorMessage).toBe(REPORT_ERROR_COPY);
    expect(failed.showRetry).toBe(true);
    expect(failed.formVisible).toBe(true);
  });

  it("shows confirmation after success and marks listing disputed", () => {
    const confirmed = toReportFormView({
      listingId: LISTING_ID,
      isSignedIn: true,
      open: false,
      submitted: true,
    });
    expect(confirmed.mode).toBe("submitted");
    expect(confirmed.confirmationMessage).toBe(REPORT_CONFIRMATION_COPY);
    expect(confirmed.formVisible).toBe(false);

    const after = applyReportSuccess({ isDisputed: false });
    expect(after.isDisputed).toBe(true);
    expect(after.showDisputedBanner).toBe(true);
    expect(DISPUTED_WARNING_COPY.length).toBeGreaterThan(0);
  });

  it("shows disputed warning banner when listing is disputed", () => {
    const after = applyReportSuccess({ isDisputed: true });
    expect(after).toEqual({
      isDisputed: true,
      showDisputedBanner: true,
      disputedWarning: DISPUTED_WARNING_COPY,
    });
  });

  it("shows unavailable copy with home CTA for archived/missing listings", () => {
    const view = toUnavailableView();
    expect(view.message).toBe(UNAVAILABLE_COPY);
    expect(view.ctaLabel).toBe(UNAVAILABLE_CTA_LABEL);
    expect(view.ctaHref).toBe("/");
    expect(UNAVAILABLE_COPY).toBe("This restroom isn't available");
  });
});
