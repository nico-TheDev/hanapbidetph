import { loginHref } from "@/lib/auth/return-path";

/** Ticket 32 — Verify this CR on listing detail. */
export const VERIFY_CTA_LABEL = "Verify this CR" as const;
export const VERIFIED_CTA_LABEL = "Verified" as const;

export const VERIFY_ERROR_COPY =
  "Couldn’t verify this restroom. Try again." as const;

export type VerifyCtaMode = "gated" | "ready" | "verified";

export type VerifyCtaView = {
  listingId: string;
  mode: VerifyCtaMode;
  label: typeof VERIFY_CTA_LABEL | typeof VERIFIED_CTA_LABEL;
  disabled: boolean;
  viewerHasVerified: boolean;
  /** Anonymous → `/login?next=/restrooms/{id}?action=verify`. */
  loginHref: string | null;
  verifyCount: number;
  verifyCountLabel: string;
  communityVerified: boolean;
  errorMessage: string | null;
  showRetry: boolean;
};

/** Interrupted-flow return path for auth-gate (ticket 09). */
export function verifyReturnPath(listingId: string): string {
  return `/restrooms/${listingId}?action=verify`;
}

export function formatVerifyCountLabel(verifyCount: number): string {
  const n = Math.max(0, Math.floor(verifyCount));
  return n === 1 ? "1 verify" : `${n} verifies`;
}

/**
 * View model for the Verify CTA (ticket 32).
 * Auth-gated guests get a login link; signed-in users verify once.
 */
export function toVerifyCtaView(input: {
  listingId: string;
  isSignedIn: boolean;
  viewerHasVerified: boolean;
  verifyCount: number;
  communityVerified: boolean;
  errorMessage?: string | null;
  pending?: boolean;
}): VerifyCtaView {
  const viewerHasVerified = input.viewerHasVerified;
  const pending = Boolean(input.pending);
  const errorMessage = input.errorMessage ?? null;

  if (!input.isSignedIn) {
    return {
      listingId: input.listingId,
      mode: "gated",
      label: VERIFY_CTA_LABEL,
      disabled: false,
      viewerHasVerified: false,
      loginHref: loginHref(verifyReturnPath(input.listingId)),
      verifyCount: input.verifyCount,
      verifyCountLabel: formatVerifyCountLabel(input.verifyCount),
      communityVerified: input.communityVerified,
      errorMessage,
      showRetry: Boolean(errorMessage),
    };
  }

  if (viewerHasVerified) {
    return {
      listingId: input.listingId,
      mode: "verified",
      label: VERIFIED_CTA_LABEL,
      disabled: true,
      viewerHasVerified: true,
      loginHref: null,
      verifyCount: input.verifyCount,
      verifyCountLabel: formatVerifyCountLabel(input.verifyCount),
      communityVerified: input.communityVerified,
      errorMessage: null,
      showRetry: false,
    };
  }

  return {
    listingId: input.listingId,
    mode: "ready",
    label: VERIFY_CTA_LABEL,
    disabled: pending,
    viewerHasVerified: false,
    loginHref: null,
    verifyCount: input.verifyCount,
    verifyCountLabel: formatVerifyCountLabel(input.verifyCount),
    communityVerified: input.communityVerified,
    errorMessage,
    showRetry: Boolean(errorMessage),
  };
}

/** Apply a successful or already-verified verify result onto local trust state. */
export function applyVerifyResult(
  result: {
    verifyCount: number;
    communityVerified: boolean;
  },
): {
  verifyCount: number;
  communityVerified: boolean;
  viewerHasVerified: true;
} {
  return {
    verifyCount: result.verifyCount,
    communityVerified: result.communityVerified,
    viewerHasVerified: true,
  };
}

/** True when deep-link / OAuth return should resume verify. */
export function shouldAutoVerify(action: string | null | undefined): boolean {
  return action === "verify";
}
