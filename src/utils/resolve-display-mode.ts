/*****************************************************************************************************************************/
/* Purpose: Resolve the effective needle/dial visibility flags consumed by the gauge component.
/*          Prefers the `display_mode` enum, but falls back to the legacy `show_needle` boolean (the only display option
/*          that ever existed for real-world users, kept for backward compatibility with configs created before
/*          `display_mode` was introduced). When `show_needle` is true, the needle is shown and the single-colour dial
/*          arc is hidden in favour of the segments; when false, the dial arc is shown instead of the needle.
/*          Coloured segment bands are always shown whenever segments are configured, regardless of display mode: the
/*          single-colour dial fill only makes sense when there are no segments, since it would otherwise paint one
/*          segment's colour across ranges belonging to other segments (e.g. across the "0" mark when min_value is
/*          negative). See hasVisibleSegments() in normalize-segments.ts for that check.
/* History: 14-JUL-2026 D.Geisenhoff   Created
/*          16-JUL-2026 Segments are now always shown when configured, independent of display mode; removed the
/*                                    showSegments flag from this function since it no longer varies by display mode.
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
