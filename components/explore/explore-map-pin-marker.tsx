import type { PinAppearance } from "@/lib/explore/map-pins";
import { PIN_UNVERIFIED_STROKE } from "@/lib/explore/map-pins";
import { cn } from "@/lib/utils";

type ExploreMapPinMarkerProps = {
  appearance: PinAppearance;
  selected: boolean;
  name: string;
};

/**
 * Custom HTML pin glyph for AdvancedMarker — teal / charcoal + dashed Soft Aqua
 * overlay when unverified. Selected state scales up when the detail shell is open.
 */
export function ExploreMapPinMarker({
  appearance,
  selected,
  name,
}: ExploreMapPinMarkerProps) {
  const { fill, unverified, hasBidet } = appearance;

  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={selected}
      data-pin-variant={
        unverified
          ? hasBidet
            ? "bidet_unverified"
            : "standard_unverified"
          : hasBidet
            ? "bidet"
            : "standard"
      }
      data-pin-selected={selected ? "true" : "false"}
      data-pin-unverified={unverified ? "true" : "false"}
      className={cn(
        "relative -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0",
        selected && "z-10 scale-125",
      )}
    >
      <svg
        width="36"
        height="44"
        viewBox="0 0 36 44"
        aria-hidden="true"
        className="drop-shadow-sm"
      >
        <path
          d="M18 2C10.268 2 4 8.268 4 16c0 10.5 14 24 14 24s14-13.5 14-24C32 8.268 25.732 2 18 2z"
          fill={fill}
          stroke={selected ? "#ffffff" : "none"}
          strokeWidth={selected ? 2.5 : 0}
        />
        {hasBidet ? (
          <path
            d="M12.5 14.5h11v2.2h-1.4v4.3c0 2.2-1.7 3.9-3.9 3.9h-.4c-2.2 0-3.9-1.7-3.9-3.9v-4.3H12.5v-2.2zm3.6 2.2v4.3c0 .9.7 1.6 1.6 1.6h.4c.9 0 1.6-.7 1.6-1.6v-4.3h-3.6z"
            fill="#ffffff"
          />
        ) : (
          <circle cx="18" cy="16" r="4" fill="#ffffff" />
        )}
        {unverified ? (
          <circle
            cx="18"
            cy="16"
            r="11"
            fill="none"
            stroke={PIN_UNVERIFIED_STROKE}
            strokeWidth="2"
            strokeDasharray="3.5 2.5"
          />
        ) : null}
      </svg>
    </button>
  );
}
