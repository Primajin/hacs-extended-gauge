/*****************************************************************************************************************************/
/* Purpose: Resolve the effective needle/dial visibility flags consumed by the gauge component.
/*          Prefers the `display_mode` enum, but falls back to the legacy `show_needle` boolean (the only display option
/*          that ever existed for real-world users, kept for backward compatibility with configs created before
/*          `display_mode` was introduced). When `show_needle` is true, the needle is shown and the single-colour dial
/*          arc is hidden in favour of the segments; when false, the dial arc is shown instead of the needle.
/*          Note: whether coloured segment bands are shown instead of the flat dial fill is NOT decided here - that
/*          additionally depends on min_value and is computed in gauge.ts (see the showSegments logic in render()),
/*          to avoid the flat fill painting one segment's colour across ranges belonging to other segments (e.g.
/*          across the "0" mark when min_value is negative), while preserving the original flat-fill behaviour for
/*          configs where min_value >= 0.
/* History: 14-JUL-2026 D.Geisenhoff   Created
/*          16-JUL-2026 Removed the showSegments flag from this function; segment-band visibility is now computed in
/*                                    gauge.ts directly since it depends on min_value, not just display mode.
/*****************************************************************************************************************************/
import { DisplayMode } from "../config-framework/data/config-data";

export interface ResolvedDisplayMode {
  showNeedle: boolean;
  showDial: boolean;
}

export interface DisplayModeConfig {
  display_mode?: DisplayMode;
  show_needle?: boolean;
}

export function resolveDisplayMode(
  config: DisplayModeConfig | undefined
): ResolvedDisplayMode {
  // Legacy configs (pre display_mode) only had a single show_needle boolean. show_needle: true
  // is equivalent to gauge_and_needle, show_needle: false is equivalent to dial_only.
  const displayMode: DisplayMode | undefined =
    config?.display_mode ??
    (config?.show_needle !== undefined
      ? config.show_needle
        ? "gauge_and_needle"
        : "dial_only"
      : undefined);

  switch (displayMode) {
    case "dial_only":
      return { showNeedle: false, showDial: true };
    case "dial_and_needle":
      return { showNeedle: true, showDial: true };
    case "gauge_and_needle":
    default:
      return { showNeedle: true, showDial: false };
  }
}
