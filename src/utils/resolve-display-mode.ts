/*****************************************************************************************************************************/
/* Purpose: Resolve the effective needle/dial/segments visibility flags consumed by the gauge component.
/*          Prefers the `display_mode` enum, but falls back to the legacy `show_needle` boolean (the only display option
/*          that ever existed for real-world users, kept for backward compatibility with configs created before
/*          `display_mode` was introduced). When `show_needle` is true, the needle and coloured segments are shown; when
/*          false, only the single-colour dial arc is shown, matching the original behaviour.
/* History: 14-JUL-2026 D.Geisenhoff   Created
/*****************************************************************************************************************************/
import { DisplayMode } from "../config-framework/data/config-data";

export interface ResolvedDisplayMode {
  showNeedle: boolean;
  showDial: boolean;
  showSegments: boolean;
}

export interface DisplayModeConfig {
  display_mode?: DisplayMode;
  show_needle?: boolean;
}

export function resolveDisplayMode(
  config: DisplayModeConfig | undefined
): ResolvedDisplayMode {
  if (config?.display_mode) {
    switch (config.display_mode) {
      case "dial_only":
        return { showNeedle: false, showDial: true, showSegments: false };
      case "dial_and_needle":
        return { showNeedle: true, showDial: true, showSegments: false };
      case "gauge_and_needle":
      default:
        return { showNeedle: true, showDial: false, showSegments: true };
    }
  }

  // Legacy configs (pre display_mode) only had a single show_needle boolean. The dial arc
  // was shown whenever the needle was hidden, and segments were shown whenever it was visible.
  if (config?.show_needle !== undefined) {
    const showNeedle = config.show_needle;
    return { showNeedle, showDial: !showNeedle, showSegments: showNeedle };
  }

  return { showNeedle: true, showDial: false, showSegments: true };
}
