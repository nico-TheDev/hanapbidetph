/** Spec steps: 0.5 / 1 / 2 / 5 km (max 5 km). */
export const RADIUS_STEPS_METERS = [500, 1000, 2000, 5000] as const;

export type RadiusStepMeters = (typeof RADIUS_STEPS_METERS)[number];

/** Default Explore nearby radius (1 km). */
export const DEFAULT_NEARBY_RADIUS_METERS: RadiusStepMeters = 1000;

/** Max Explore nearby radius (5 km) — matches listNearby validation. */
export const MAX_NEARBY_RADIUS_METERS: RadiusStepMeters = 5000;

export type RadiusSelectorOption = {
  valueMeters: RadiusStepMeters;
  label: string;
};

/** Top-bar radius control options (labels shown to the user). */
export const RADIUS_SELECTOR_OPTIONS: readonly RadiusSelectorOption[] =
  RADIUS_STEPS_METERS.map((valueMeters) => ({
    valueMeters,
    label: formatRadiusLabel(valueMeters),
  }));

/** Human label for a radius step (e.g. `0.5 km`, `1 km`). */
export function formatRadiusLabel(meters: number): string {
  const km = meters / 1000;
  return `${km} km`;
}

/**
 * Distance copy for listing rows. Omitted when location is unavailable
 * (Metro Manila fallback / browse) so we do not imply false proximity.
 */
export function formatListingDistance(
  distanceMeters: number,
  distancesAvailable: boolean,
): string | null {
  if (!distancesAvailable) {
    return null;
  }
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  const km = distanceMeters / 1000;
  const rounded = Number.isInteger(km) ? String(km) : km.toFixed(1);
  return `${rounded} km`;
}
