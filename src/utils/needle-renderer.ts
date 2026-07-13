/*****************************************************************************************************************************/
/* Purpose: Pure needle-rendering helpers, extracted from gauge.ts for testability.
/*
/*          The ExtendedGauge component delegates all needle SVG generation to these
/*          functions.  Because they have no Lit decorators or lifecycle dependencies
/*          they can be unit-tested in a Node / Jest environment without a DOM.
/*
/* Needle styles:
/*   "default"  – simple arrow (≈ HA gauge default)
/*   "classic"  – original HA-style blunt needle from ha-gauge.ts
/*   "icon"     – user-supplied MDI / custom-set icon rendered as a native SVG path
/*
/* Icon colour note (BUG-1):
/*   The CSS class `.needle-icon-path` sets `fill: var(--primary-text-color)`.  A CSS
/*   class rule has higher specificity than an SVG presentation attribute (`fill="…"`),
/*   so setting `fill` as a bare attribute is silently ignored when the class is present.
/*   The fix is to pass the colour through the `style` property (via styleMap) so the
/*   inline style always wins over the class rule.
/*
/* History: 13-JUL-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/

import { svg } from "lit";
import { styleMap } from "lit/directives/style-map.js";

/*****************************************************************************************************************************/
/* Purpose: All data the needle renderers need from the gauge component.
/*****************************************************************************************************************************/
export interface NeedleRenderOptions {
  /** Needle style: "default" | "classic" | "icon" */
  needleStyle: string;
  /** Icon name, e.g. "mdi:home" or "hacs:hacs".  Only used when needleStyle="icon". */
  needleIcon?: string;
  /** Resolved SVG path data for the icon.  null while loading or if unavailable. */
  needleIconPath: string | null;
  /** If true, the icon stays upright; otherwise it rotates with the gauge. */
  needleIconKeepVertical: boolean;
  /** Size multiplier: 1 = 7 SVG units (arc radius is 40 units). */
  needleIconSize: number;
  /**
   * Colour for the icon fill.  Must be applied via inline style (not a bare SVG
   * fill="" attribute) so it wins over the `.needle-icon-path` CSS class rule.
   */
  needleIconColor?: string;
  /** Optional background circle colour behind the icon. */
  needleIconBackgroundColor?: string;
  /** Current needle angle in degrees (0° = min/left, 180° = max/right). */
  valueAngle: number;
  /** Whether to apply the transition animation CSS class. */
  animate: boolean;
}

/*****************************************************************************************************************************/
/* Purpose: Render the default arrow needle.
/*          Path: a simple left-pointing triangle centred on the arc tip at (-40, 0) in
/*          gauge coordinates, rotated to the current value angle.
/* History: 13-JUL-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/
export function renderDefaultNeedle(
  opts: Pick<NeedleRenderOptions, "valueAngle" | "animate">
) {
  const animClass = opts.animate ? "animation" : "";
  return svg`
    <path
      class="needle ${animClass}"
      d="M -25 -2.5 L -47.5 0 L -25 2.5 z"
      style=${styleMap({ transform: `rotate(${opts.valueAngle}deg)` })}>
    </path>
  `;
}

/*****************************************************************************************************************************/
/* Purpose: Render the classic HA-style needle (from home-assistant/frontend ha-gauge.ts).
/* History: 13-JUL-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/
export function renderClassicNeedle(
  opts: Pick<NeedleRenderOptions, "valueAngle" | "animate">
) {
  const animClass = opts.animate ? "animation" : "";
  return svg`
    <path
      class="needle needle-classic ${animClass}"
      d="M -34,-3 L -40,-1 A 1,1,0,0,0,-40,1 L -34,3 A 2,2,0,0,0,-34,-3 Z"
      style=${styleMap({ transform: `rotate(${opts.valueAngle}deg)` })}>
    </path>
  `;
}

/*****************************************************************************************************************************/
/* Purpose: Render the icon needle.
/*          All HA icon SVGs use a 0 0 24 24 viewBox.  We scale and translate the path
/*          so the icon is centred on the arc tip, sized to `foSize` SVG units.
/*
/*          BUG-1 fix: the fill colour is applied via `styleMap` (inline style) so it
/*          always overrides the `.needle-icon-path` CSS class rule.
/*
/* History: 13-JUL-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/
export function renderIconNeedle(
  opts: NeedleRenderOptions
): ReturnType<typeof svg> {
  const {
    needleIcon,
    needleIconPath,
    needleIconKeepVertical,
    needleIconSize,
    needleIconColor,
    needleIconBackgroundColor,
    valueAngle,
    animate,
  } = opts;

  // Fall back to default needle when no icon is configured or path not yet loaded.
  if (!needleIcon || !needleIconPath) {
    return renderDefaultNeedle({ valueAngle, animate });
  }

  // foSize = icon size in SVG units.  scale maps the 24×24 viewBox to foSize×foSize.
  const foSize = 7 * needleIconSize;
  const scale = foSize / 24;
  // BUG-1 fix: use inline style so user colour wins over the CSS class fill rule.
  const iconColor = needleIconColor ?? "var(--primary-text-color)";
  const bgRadius = foSize * 0.5;
  const animClass = animate ? "animation" : "";

  if (needleIconKeepVertical) {
    // Position on the arc but keep the icon upright (no gauge rotation).
    const iconAngleRad = (valueAngle * Math.PI) / 180;
    const cx = -40 * Math.cos(iconAngleRad);
    const cy = -40 * Math.sin(iconAngleRad);
    const tx = cx - foSize / 2;
    const ty = cy - foSize / 2;
    return svg`
      <g class="needle needle-icon ${animClass}">
        ${
          needleIconBackgroundColor
            ? svg`<circle cx=${cx} cy=${cy} r=${bgRadius} fill=${needleIconBackgroundColor} class="needle-icon-bg"/>`
            : ``
        }
        <path
          class="needle-icon-path"
          d=${needleIconPath}
          transform="translate(${tx} ${ty}) scale(${scale})"
          style=${styleMap({ fill: iconColor, "pointer-events": "none" })}>
        </path>
      </g>
    `;
  } else {
    // Rotate with the gauge; arc tip is always at (-40, 0) in rotated space.
    const tx = -40 - foSize / 2;
    const ty = -foSize / 2;
    return svg`
      <g
        class="needle needle-icon ${animClass}"
        style=${styleMap({ transform: `rotate(${valueAngle}deg)` })}>
        ${
          needleIconBackgroundColor
            ? svg`<circle cx=${-40} cy=${0} r=${bgRadius} fill=${needleIconBackgroundColor} class="needle-icon-bg"/>`
            : ``
        }
        <path
          class="needle-icon-path"
          d=${needleIconPath}
          transform="translate(${tx} ${ty}) scale(${scale})"
          style=${styleMap({ fill: iconColor, "pointer-events": "none" })}>
        </path>
      </g>
    `;
  }
}

/*****************************************************************************************************************************/
/* Purpose: Main dispatch function – choose the correct needle renderer based on style.
/* History: 13-JUL-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/
export function renderNeedle(
  opts: NeedleRenderOptions
): ReturnType<typeof svg> {
  switch (opts.needleStyle) {
    case "classic":
      return renderClassicNeedle(opts);
    case "icon":
      return renderIconNeedle(opts);
    case "default":
    default:
      return renderDefaultNeedle(opts);
  }
}
