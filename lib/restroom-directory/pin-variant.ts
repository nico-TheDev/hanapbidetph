import type { BidetType, PinVariant } from "./schemas";

/** `has_bidet` = `bidet_type != 'none'` (DATA_ARCHITECTURE). */
export function hasBidetFromType(bidetType: BidetType): boolean {
  return bidetType !== "none";
}

/** `community_verified` = `verify_count >= 3`. */
export function isCommunityVerified(verifyCount: number): boolean {
  return verifyCount >= 3;
}

/**
 * Pin variant: bidet / standard + unverified overlay when
 * `verify_count < 3` (active listings only in listNearby).
 */
export function classifyPinVariant(
  bidetType: BidetType,
  verifyCount: number,
): PinVariant {
  const unverified = verifyCount < 3;
  if (hasBidetFromType(bidetType)) {
    return unverified ? "bidet_unverified" : "bidet";
  }
  return unverified ? "standard_unverified" : "standard";
}
