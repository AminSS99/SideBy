import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export interface SideByIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
}

function normalizeStrokeWidth(strokeWidth?: number | string): number {
  const parsed = typeof strokeWidth === "number" ? strokeWidth : Number(strokeWidth);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1.65;
}

/**
 * Editorial twin-facet calibration prism (replaces generic AI sparkle clusters).
 */
export function Sparkles({
  size = 18,
  strokeWidth,
  className,
  ...props
}: SideByIconProps) {
  const sw = normalizeStrokeWidth(strokeWidth);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 sb-icon sb-icon-sparkles", className)}
      {...props}
    >
      <g className="sb-prism-main">
        <path
          d="M9.5 3.5L15 9L9.5 14.5L4 9L9.5 3.5Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <path
          d="M9.5 3.5V14.5M4 9H15"
          stroke="currentColor"
          strokeWidth={Math.max(1.1, sw - 0.35)}
          strokeOpacity="0.5"
        />
      </g>
      <g className="sb-prism-sub">
        <path
          d="M16.5 12.5L20 16L16.5 19.5L13 16L16.5 12.5Z"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/**
 * Precision editorial calibration aperture (replaces generic magic-wand star).
 */
export function WandSparkles({
  size = 18,
  strokeWidth,
  className,
  ...props
}: SideByIconProps) {
  const sw = normalizeStrokeWidth(strokeWidth);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 sb-icon sb-icon-wand", className)}
      {...props}
    >
      <path
        d="M4.5 19.5L13.5 10.5"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <g className="sb-wand-head">
        <path
          d="M12.5 5.5H18.5V11.5H12.5Z"
          transform="rotate(45 15.5 8.5)"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <path
          d="M15.5 2.5V4M21.5 8.5H20M15.5 13V14.5M10 8.5H11.5"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * SideBy twin-column balanced comparison mark.
 */
export function GitCompare({
  size = 18,
  strokeWidth,
  className,
  ...props
}: SideByIconProps) {
  const sw = normalizeStrokeWidth(strokeWidth);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 sb-icon sb-icon-compare", className)}
      {...props}
    >
      <rect
        className="sb-col-left"
        x="3.5"
        y="4.5"
        width="6.25"
        height="15"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth={sw}
      />
      <rect
        className="sb-col-right"
        x="14.25"
        y="4.5"
        width="6.25"
        height="15"
        rx="1.5"
        stroke="currentColor"
        strokeWidth={sw}
      />
      <path
        d="M10 9.5H14M10 14.5H14"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Side-by-side split folio mark with clean directional bridge.
 */
export function GitCompareArrows({
  size = 18,
  strokeWidth,
  className,
  ...props
}: SideByIconProps) {
  const sw = normalizeStrokeWidth(strokeWidth);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 sb-icon sb-icon-compare-arrows", className)}
      {...props}
    >
      <rect
        className="sb-col-left"
        x="3"
        y="4.5"
        width="5.5"
        height="15"
        rx="1.4"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth={sw}
      />
      <rect
        className="sb-col-right"
        x="15.5"
        y="4.5"
        width="5.5"
        height="15"
        rx="1.4"
        stroke="currentColor"
        strokeWidth={sw}
      />
      <path
        className="sb-arrow-top"
        d="M10.25 9.25H13.75M12.35 7.65L13.95 9.25L12.35 10.85"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="sb-arrow-bottom"
        d="M13.75 14.75H10.25M11.65 13.15L10.05 14.75L11.65 16.35"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Architectural weighted balance beam with fulcrum diamond.
 */
export function Scale({
  size = 18,
  strokeWidth,
  className,
  ...props
}: SideByIconProps) {
  const sw = normalizeStrokeWidth(strokeWidth);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 sb-icon sb-icon-scale", className)}
      {...props}
    >
      <path
        d="M12 4V19.5M7.5 19.5H16.5"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <polygon
        points="12,6.5 13.5,8.5 12,10.5 10.5,8.5"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <g className="sb-scale-beam">
        <path
          d="M4.5 8.5H19.5"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
        />
        <path
          d="M6.25 8.5L3.75 14.5H8.75L6.25 8.5Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <path
          d="M17.75 8.5L15.25 14.5H20.25L17.75 8.5Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/**
 * Editorial research lens core with reticle ticks (replaces cartoonish Bot face).
 */
export function Bot({
  size = 18,
  strokeWidth,
  className,
  ...props
}: SideByIconProps) {
  const sw = normalizeStrokeWidth(strokeWidth);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 sb-icon sb-icon-bot", className)}
      {...props}
    >
      <polygon
        points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <g className="sb-bot-reticle">
        <circle
          cx="12"
          cy="12"
          r="2.75"
          fill="currentColor"
          fillOpacity="0.35"
          stroke="currentColor"
          strokeWidth={sw}
        />
        <path
          d="M12 6.2V8.1M12 15.9V17.8M6.9 12H8.6M15.4 12H17.1"
          stroke="currentColor"
          strokeWidth={Math.max(1.2, sw - 0.2)}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * Source-backed search verification lens.
 */
export function SearchCheck({
  size = 18,
  strokeWidth,
  className,
  ...props
}: SideByIconProps) {
  const sw = normalizeStrokeWidth(strokeWidth);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 sb-icon sb-icon-search-check", className)}
      {...props}
    >
      <g className="sb-lens-sweep">
        <circle
          cx="10.5"
          cy="10.5"
          r="6.5"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth={sw}
        />
        <path
          d="M15.4 15.4L20 20"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
        />
      </g>
      <path
        className="sb-check-draw"
        d="M8 10.7L9.8 12.5L13.2 8.8"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Cited claim folio with corner fold and verification tick.
 */
export function FileCheck2({
  size = 18,
  strokeWidth,
  className,
  ...props
}: SideByIconProps) {
  const sw = normalizeStrokeWidth(strokeWidth);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 sb-icon sb-icon-file-check", className)}
      {...props}
    >
      <path
        d="M6.5 3.5H14.2L18.5 7.8V19.5C18.5 20.05 18.05 20.5 17.5 20.5H6.5C5.95 20.5 5.5 20.05 5.5 19.5V4.5C5.5 3.95 5.95 3.5 6.5 3.5Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <path
        d="M14.2 3.5V7.8H18.5"
        stroke="currentColor"
        strokeWidth={Math.max(1.2, sw - 0.2)}
        strokeLinejoin="round"
      />
      <path
        className="sb-check-draw"
        d="M9 14.2L11 16.2L15 11.8"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Open book with embedded evidence check.
 */
export function BookOpenCheck({
  size = 18,
  strokeWidth,
  className,
  ...props
}: SideByIconProps) {
  const sw = normalizeStrokeWidth(strokeWidth);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 sb-icon sb-icon-book-check", className)}
      {...props}
    >
      <path
        d="M3.5 5.5C6.5 4.8 9.5 5.4 12 7C14.5 5.4 17.5 4.8 20.5 5.5V17.5C17.5 16.8 14.5 17.4 12 19C9.5 17.4 6.5 16.8 3.5 17.5V5.5Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <path
        d="M12 7V18.8"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <path
        className="sb-check-draw"
        d="M6.5 10.5L8.2 12.2L10.4 9.5"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="sb-book-lines"
        d="M14.5 10.2H18M14.5 13.3H17.2"
        stroke="currentColor"
        strokeWidth={Math.max(1.15, sw - 0.25)}
        strokeLinecap="round"
        strokeOpacity="0.65"
      />
    </svg>
  );
}

/**
 * Combined comparative scoring trajectory mark (clear separation between trendline & bars).
 */
export function ChartNoAxesCombined({
  size = 18,
  strokeWidth,
  className,
  ...props
}: SideByIconProps) {
  const sw = normalizeStrokeWidth(strokeWidth);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 sb-icon sb-icon-chart", className)}
      {...props}
    >
      <path
        className="sb-chart-line"
        d="M4 11.5L9 7.2L13.2 10L19.5 4.5"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect className="sb-chart-bar-1" x="4.25" y="15.5" width="3.2" height="4.5" rx="0.8" fill="currentColor" fillOpacity="0.45" />
      <rect className="sb-chart-bar-2" x="10.4" y="13.5" width="3.2" height="6.5" rx="0.8" fill="currentColor" fillOpacity="0.7" />
      <rect
        className="sb-chart-bar-3"
        x="16.55"
        y="10.5"
        width="3.2"
        height="9.5"
        rx="0.8"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth={sw}
      />
    </svg>
  );
}
