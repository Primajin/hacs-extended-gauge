/*****************************************************************************************************************************/
/* Purpose: Resolve the effective needle/dial/segments visibility flags consumed by the gauge component.
/*          Prefers the `display_mode` enum, but falls back to the legacy `show_needle` / `show_dial` booleans
/*          (deprecated, kept for backward compatibility with configs created before `display_mode` was introduced).
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
  show_dial?: boolean;
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

  // Legacy configs (pre display_mode) used two independent booleans. show_needle also
  // controlled whether coloured segments were drawn, show_dial defaulted to true.
  if (config?.show_needle !== undefined || config?.show_dial !== undefined) {
    const showNeedle = config?.show_needle ?? true;
    const showDial = config?.show_dial ?? true;
    return { showNeedle, showDial, showSegments: showNeedle };
  }

  return { showNeedle: true, showDial: false, showSegments: true };
}
