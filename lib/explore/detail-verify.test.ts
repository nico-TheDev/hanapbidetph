import { describe, expect, it } from "vitest";

import {
  VERIFY_CTA_LABEL,
  VERIFIED_CTA_LABEL,
  VERIFY_ERROR_COPY,
  applyVerifyResult,
  formatVerifyCountLabel,
  shouldAutoVerify,
  toVerifyCtaView,
  verifyReturnPath,
} from "./detail-verify";

const LISTING_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("32 — Verify CTA on listing detail", () => {
  it("gates anonymous users through auth-gate to login and back to verify", () => {
    const view = toVerifyCtaView({
      listingId: LISTING_ID,
      isSignedIn: false,
      viewerHasVerified: false,
      verifyCount: 1,
      communityVerified: false,
    });

    expect(view.mode).toBe("gated");
    expect(view.label).toBe(VERIFY_CTA_LABEL);
    expect(view.loginHref).toBe(
      `/login?next=${encodeURIComponent(verifyReturnPath(LISTING_ID))}`,
    );
    expect(verifyReturnPath(LISTING_ID)).toBe(
      `/restrooms/${LISTING_ID}?action=verify`,
    );
    expect(shouldAutoVerify("verify")).toBe(true);
    expect(shouldAutoVerify(null)).toBe(false);
  });

  it("lets a signed-in user verify once; second attempt is already-verified", () => {
    const ready = toVerifyCtaView({
      listingId: LISTING_ID,
      isSignedIn: true,
      viewerHasVerified: false,
      verifyCount: 1,
      communityVerified: false,
    });
    expect(ready.mode).toBe("ready");
    expect(ready.label).toBe(VERIFY_CTA_LABEL);
    expect(ready.disabled).toBe(false);
    expect(ready.loginHref).toBeNull();

    const after = applyVerifyResult({
      verifyCount: 2,
      communityVerified: false,
    });
    const verified = toVerifyCtaView({
      listingId: LISTING_ID,
      isSignedIn: true,
      ...after,
    });
    expect(verified.mode).toBe("verified");
    expect(verified.label).toBe(VERIFIED_CTA_LABEL);
    expect(verified.disabled).toBe(true);
    expect(verified.verifyCount).toBe(2);
  });

  it("updates verify count and Community verified at ≥3", () => {
    expect(formatVerifyCountLabel(0)).toBe("0 verifies");
    expect(formatVerifyCountLabel(1)).toBe("1 verify");
    expect(formatVerifyCountLabel(2)).toBe("2 verifies");

    const atTwo = toVerifyCtaView({
      listingId: LISTING_ID,
      isSignedIn: true,
      viewerHasVerified: false,
      verifyCount: 2,
      communityVerified: false,
    });
    expect(atTwo.communityVerified).toBe(false);
    expect(atTwo.verifyCountLabel).toBe("2 verifies");

    const crossed = applyVerifyResult({
      verifyCount: 3,
      communityVerified: true,
    });
    const view = toVerifyCtaView({
      listingId: LISTING_ID,
      isSignedIn: true,
      ...crossed,
    });
    expect(view.communityVerified).toBe(true);
    expect(view.verifyCount).toBe(3);
    expect(view.verifyCountLabel).toBe("3 verifies");
    expect(view.mode).toBe("verified");
  });

  it("preserves detail with retry when verify fails", () => {
    const view = toVerifyCtaView({
      listingId: LISTING_ID,
      isSignedIn: true,
      viewerHasVerified: false,
      verifyCount: 1,
      communityVerified: false,
      errorMessage: VERIFY_ERROR_COPY,
    });

    expect(view.mode).toBe("ready");
    expect(view.errorMessage).toBe(VERIFY_ERROR_COPY);
    expect(view.showRetry).toBe(true);
    expect(view.label).toBe(VERIFY_CTA_LABEL);
    expect(view.disabled).toBe(false);
  });
});
