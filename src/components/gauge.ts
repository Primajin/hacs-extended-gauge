/*****************************************************************************************************************************/
/* Purpose: Gauge component, based on HA-Gauge
/* History: 10-MAR-2025 D. Geisenhoff   Created
/*****************************************************************************************************************************/
import { styleMap } from "lit/directives/style-map.js";
import { formatNumber, NumberFormatOptions } from "../utils/format";
import { FrontendLocaleData } from "custom-card-helpers";
import { css, html, LitElement, svg, PropertyValues } from "lit";
import { customElement, property, query, state } from "lit-element";
import { NeedleStyle } from "../config-framework/data/config-data";
import {
  normalizeValue,
  getValueInPercentage,
  getAngle,
} from "../utils/gauge-math";

// Re-export for consumers that import directly from this file.
export { normalizeValue, getValueInPercentage, getAngle };

/*****************************************************************************************************************************/
/* Purpose: Interface for demo timer management
/* History: 26-JUN-2025 D. Geisenhoff   Created
/*****************************************************************************************************************************/
interface DemoTimerManager {
  timerId: number | null;
  demoValue: number;
  callbacks: Set<() => void>;
  startTimer: () => void;
  stopTimer: () => void;
  registerCallback: (callback: () => void) => void;
  unregisterCallback: (callback: () => void) => void;
}

/*****************************************************************************************************************************/
/* Purpose: Singleton for demo timer management
/* History: 26-JUN-2025 D. Geisenhoff   Created
/*****************************************************************************************************************************/
export const DemoTimerManager: DemoTimerManager = {
  timerId: null,
  demoValue: 50,
  callbacks: new Set<() => void>(),
  startTimer() {
    if (this.timerId === null) {
      this.timerId = window.setInterval(() => {
        this.callbacks.forEach((callback) => callback());
      }, 5000);
    }
  },
  stopTimer() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  },
  registerCallback(callback: () => void) {
    if (this.callbacks.has(callback)) {
      return;
    }
    this.callbacks.add(callback);
    this.startTimer();
  },
  unregisterCallback(callback: () => void) {
    if (this.callbacks.has(callback)) {
      this.callbacks.delete(callback);
    }
    // Stop timer, if no more callbacks registered
    if (this.callbacks.size === 0) {
      this.stopTimer();
    }
  },
};

declare global {
  /*****************************************************************************************************************************/
  /* Purpose: Assign HTML tag to this class
  /* History: 24-FEB-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  interface HTMLElementTagNameMap {
    "extended-gauge": ExtendedGauge;
  }
}

/******************************************************************************************************************************************/
/* Purpose:   Interface for segments
/* Properies: lower:            Lower bound of segment range.
/*            upper:            Upper bound of segment range.
/*            color:            Color of segment range (string format i.e. #00ff00)
/*            valueReplacement: A string that replaces the displayed value, when the value is inside the selected range.
/*            valueReplacementOutOfRange: A string that replaces the displayed value, when the value is outside the selected range.
/* History:   04-JUL-2025 D.Geisenhoff   Created
/******************************************************************************************************************************************/
export interface GaugeSegment {
  lower?: number;
  upper?: number;
  color: string;
  valueReplacement?: string;
  valueReplacementOutOfRange?: string;
}

/******************************************************************************************************************************************/
/* Purpose: Gauge HTML element
/* Params:  min:                  The minimum of the gauge.
/*          max:                  The maximum of the gauge.
/*          showMinMax:           If true, the min and max values are shown at the bounds of the gauge dial, otherwise they are hidden.
/*          value:                The value of the gauge.
/*          unitOfMeasure:        The unit of measure to be displayed after the value.
/*          valueLabel:           The label to be displayed below the value.
/*          gaugeBackgroundColor: The color of the gauge dial with no value.
/*          gaugeInfoColor:       The color of the gauge dial if no segments are used or if the value is not in the range of a segment.
/*          formatOptions:        The formatting options for the value (see format.ts)
/*          locale:               The locale to be used for the formatting options (takes locale specific decimal separator, if 
/*                                decimal separator is not defined).
/*          valueText:            Text to be displayed, instead of the value.                           
/*          showNeedle:           If true, the needle is shown, otherwise hidden. If the needle is shown and there are segments, all the
/*                                segments are shown, too. If the needle is hidden, only the gauge dial is shown in the color of the 
/*                                current segment, the value is in.
/*          animation:            If true, the value changes are animated.
/*          segments:             An array of segment objects that will display segments with color, lower bound, upper bound
/*                                and an optional value replacement label, which replaces the value, if it is in the segment 
/*                                range (see GaugeSegment).
/*          showSegmentLabels:    If true, show the labes of the lower and upper bounds of each segment, else hide them.
/* History: 24-FEB-2025 D.Geisenhoff   Created
/******************************************************************************************************************************************/
export class ExtendedGauge extends LitElement {
  @property({ type: Number }) public min = 0;
  @property({ type: Number }) public max = 100;
  @property({ type: Boolean }) public showMinMax = true;
  @property({ type: Number }) public value = 0;
  @property() public unitOfMeasure = "";
  @property({ type: String }) public valueLabel?;
  @property({ type: String }) public gaugeBackgroundColor =
    "var(--primary-background-color)";
  @property({ type: String }) public gaugeInfoColor =
    "var(--secondary-text-color)";
  @property({ attribute: false }) public formatOptions?: NumberFormatOptions;
  @property({ attribute: false, type: String }) public valueText?: string;
  @property({ attribute: false }) public locale!: FrontendLocaleData;
  @property({ type: Boolean }) public showNeedle = false;
  @property({ type: Boolean }) public showDial = false;
  @property({ type: String }) public needleStyle: NeedleStyle = "default";
  @property({ type: String }) public needleIcon?: string;
  @property({ type: Boolean }) public needleIconKeepVertical = false;
  @property({ type: Number }) public needleIconSize = 2;
  @property({ type: String }) public needleIconColor?: string;
  @property({ type: String }) public needleIconBackgroundColor?: string;
  @property({ type: Boolean }) public animation = true;
  @property({ type: Array }) public segments?: GaugeSegment[];
  @property({ type: Boolean }) public showSegmentLabels = true;
  @state() private _valueAngle = 0;
  @state() private _updated = false;
  @state() private _segment_value_replacement? = "";

  /*****************************************************************************************************************************/
  /* Purpose: Constructor
  /* History: 05-APR-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  public connectedCallback() {
    super.connectedCallback();
    this._valueAngle = this._getAngle(this.value, this.min, this.max);
  }

  /*****************************************************************************************************************************/
  /* Purpose: If lower > upper, set lower to upper, if lower is empty, set to min, if upper is empty, set to max.
  /* History: 24-FEB-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  private _normalizeSegments() {
    if (this.segments) {
      for (const segment of this.segments) {
        if (isNaN(segment.lower!)) segment.lower = this.min;
        if (isNaN(segment.upper!)) segment.upper = this.max;
        if (segment.lower! > segment.upper!) segment.lower = segment.upper;
      }
    }
  }

  /*****************************************************************************************************************************/
  /* Purpose: Keep value in range of defined min and max
  /* History: 24-FEB-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  private _normalizeValue = (value: number, min: number, max: number): number =>
    normalizeValue(value, min, max);

  /*****************************************************************************************************************************/
  /* Purpose: Get percentage of value
  /* History: 04-APR-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  private _getValueInPercentage = (
    value: number,
    min: number,
    max: number
  ): number => getValueInPercentage(value, min, max);

  /*****************************************************************************************************************************/
  /* Purpose: Compute angle in a percentage of 180° depending on value
  /* History: 04-APR-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  private _getAngle = (value: number, min: number, max: number) =>
    getAngle(value, min, max);

  /*****************************************************************************************************************************/
  /* Purpose: Compute lower angle 
  /* History: 04-APR-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  private _getLowerAngle = (value: number, min: number, max: number) => {
    if (isNaN(value)) value = min;
    return this._getAngle(value, min, max);
  };

  /*****************************************************************************************************************************/
  /* Purpose: Compute lower angle 
  /* History: 04-APR-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  private _getUpperAngle = (value: number, min: number, max: number) => {
    if (isNaN(value)) value = max;
    return this._getAngle(value, min, max);
  };

  /*****************************************************************************************************************************/
  /* Purpose: LitElement callback. Called after the element has updated its properties and rendered. It runs each time the 
  /*          component updates, unless the update was prevented. Called after the first render (firstUpdated()) and on every 
  /*          subsequent update
  /* History: 18-FEB-2025 D.Geisenhoff  Created
  /*****************************************************************************************************************************/
  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (
      !changedProperties.has("value") &&
      !changedProperties.has("valueText") &&
      !changedProperties.has("unit_of_measure") &&
      !changedProperties.has("_segment_value_replacement")
    ) {
      return;
    }
    this._valueAngle = this._getAngle(this.value, this.min, this.max);
    this._segment_value_replacement = this._getSegmentValueReplacement();
    this._rescaleSvgText("text");
  }

  /*****************************************************************************************************************************/
  /* Purpose: Set the viewbox of the SVG containing the value to perfectly fit the text. That way it will auto-scale correctly
  /* History: 24-FEB-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  private _rescaleSvgText(className: string) {
    const svgRoot = this.shadowRoot!.querySelector(`.${className}`)!;
    const box = svgRoot.querySelector("text")!.getBBox()!;
    svgRoot.setAttribute(
      "viewBox",
      `${box.x} ${box!.y} ${box.width} ${box.height}`
    );
  }

  /*****************************************************************************************************************************/
  /* Purpose: Return the value text of the current segment, to be displayed instead of the effective value
  /* History: 24-FEB-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  private _getSegmentValueReplacement(): string | undefined {
    if (this.segments) {
      for (let i: number = this.segments.length - 1; i >= 0; i--) {
        if (
          this.value >= this.segments[i].lower! &&
          this.value <= this.segments[i].upper! &&
          this.segments[i].valueReplacement != undefined
        ) {
          return this.segments[i].valueReplacement;
        }
        if (
          (this.value < this.segments[i].lower! ||
            this.value > this.segments[i].upper!) &&
          this.segments[i].valueReplacementOutOfRange != undefined
        ) {
          return this.segments[i].valueReplacementOutOfRange;
        }
      }
    }
    return "";
  }

  /*****************************************************************************************************************************/
  /* Purpose: Render the default arrow needle (shared helper used by "default" style and as fallback)
  /* History: 12-JUL-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  private _renderDefaultNeedle(animClass: string) {
    return svg`
      <path
        class="needle ${animClass}"
        d="M -25 -2.5 L -47.5 0 L -25 2.5 z"
        style=${styleMap({ transform: `rotate(${this._valueAngle}deg)` })}>
      </path>
    `;
  }

  /*****************************************************************************************************************************/
  /* Purpose: Render the needle based on the configured needle style.
  /*          The gauge arc spans 0° (left, value=min) to 180° (right, value=max) through the top at 90°.
  /*          CSS rotate(θdeg) applied to a left-pointing element and Math.cos/sin(θ) both use the same
  /*          angular convention for this gauge, so arc positions are consistent between methods.
  /* History: 12-JUL-2025 D.Geisenhoff   Created
  /*****************************************************************************************************************************/
  private _renderNeedle() {
    const animClass = this._updated && this.animation ? `animation` : ``;
    switch (this.needleStyle) {
      case "old":
        // Original HA-style needle path from home-assistant/frontend ha-gauge.ts
        return svg`
          <path
            class="needle needle-old ${animClass}"
            d="M -34,-3 L -40,-1 A 1,1,0,0,0,-40,1 L -34,3 A 2,2,0,0,0,-34,-3 Z"
            style=${styleMap({ transform: `rotate(${this._valueAngle}deg)` })}>
          </path>
        `;
      case "icon":
        if (this.needleIcon) {
          // Use <ha-icon> inside a <foreignObject> for all icon packs (MDI and custom).
          // HA's <ha-icon> element resolves any registered icon set, so no icon-pack-specific
          // parsing is needed here.
          // needleIconSize is a multiplier: 2 = default, 1 = smaller, 3 = larger, etc.
          const scale = 0.12 * this.needleIconSize;
          const iconSize = 24 * scale;
          // foreignObject side length – give a little extra room so the icon isn't clipped.
          const foSize = iconSize * 2;
          const iconColor = this.needleIconColor ?? "var(--primary-text-color)";
          const bgColor = this.needleIconBackgroundColor;
          const bgRadius = foSize * 0.5;

          if (this.needleIconKeepVertical) {
            // Position the icon on the arc but keep it upright (no rotation).
            const iconAngleRad = (this._valueAngle * Math.PI) / 180;
            const cx = -40 * Math.cos(iconAngleRad);
            const cy = -40 * Math.sin(iconAngleRad);
            return svg`
              <g class="needle needle-icon ${animClass}">
                ${
                  bgColor
                    ? svg`<circle cx=${cx} cy=${cy} r=${bgRadius} fill=${bgColor} class="needle-icon-bg"/>`
                    : ``
                }
                <foreignObject
                  x=${cx - foSize / 2}
                  y=${cy - foSize / 2}
                  width=${foSize}
                  height=${foSize}>
                  <ha-icon
                    icon=${this.needleIcon}
                    style="width:${foSize}px;height:${foSize}px;color:${iconColor};display:block;">
                  </ha-icon>
                </foreignObject>
              </g>
            `;
          } else {
            // Rotate the icon with the gauge bearing (icon follows the arc direction).
            const iconX = -40 - foSize / 2;
            return svg`
              <g
                class="needle needle-icon ${animClass}"
                style=${styleMap({
                  transform: `rotate(${this._valueAngle}deg)`,
                })}>
                ${
                  bgColor
                    ? svg`<circle cx=${
                        iconX + foSize / 2
                      } cy=${0} r=${bgRadius} fill=${bgColor} class="needle-icon-bg"/>`
                    : ``
                }
                <foreignObject
                  x=${iconX}
                  y=${-foSize / 2}
                  width=${foSize}
                  height=${foSize}>
                  <ha-icon
                    icon=${this.needleIcon}
                    style="width:${foSize}px;height:${foSize}px;color:${iconColor};display:block;">
                  </ha-icon>
                </foreignObject>
              </g>
            `;
          }
        }
        // Fallback to default needle if no icon is configured.
        return this._renderDefaultNeedle(animClass);
      case "default":
      default:
        return this._renderDefaultNeedle(animClass);
    }
  }

  /*******************************************************************************************************************************/
  /* Purpose: Render this HTML element
  /* History: 04-APR-2025 D.Geisenhoff  Created
  /*                                    Animate needle only after first render and if animation property is true
  /*******************************************************************************************************************************/
  protected render() {
    this._normalizeSegments();
    const labelsFormatOptions = { ...this.formatOptions };
    labelsFormatOptions.thousandSeparator = "";
    let gaugeValueColor = this.gaugeInfoColor;
    if (this.segments && !this.showNeedle) {
      // set color if gauge to color of segment, where the current value is in
      this.segments
        .sort((a, b) => a.lower! - b.lower!)
        .map((segment) => {
          if (this.value >= segment.lower! && this.value <= segment.upper!)
            gaugeValueColor = segment.color;
        });
    }
    const dialVisible = this.showDial;
    return html`
      <div class="gauge-container">
      <svg viewBox="-50 -50 130 55" class="gauge">
      <g transform="translate(15 5)">
        <path
          style =${styleMap({
            stroke: `${
              this.segments && this.showNeedle
                ? this.gaugeInfoColor
                : this.gaugeBackgroundColor
            }`,
          })}
          class="dial"
          d="M -40 0 A 40 40 0 0 1 40 0">
        </path>
        ${
          this.segments && this.showNeedle
            ? this.segments
                .sort((a, b) => a.lower! - b.lower!)
                .map((segment) => {
                  const angle_lower = this._getLowerAngle(
                    segment.lower!,
                    this.min,
                    this.max
                  );
                  const angle_upper = this._getUpperAngle(
                    segment.upper!,
                    this.min,
                    this.max
                  );
                  return svg`
                  <path
                      stroke="${segment.color}"
                      class="segment"
                      d="M
                        ${0 - 40 * Math.cos((angle_lower * Math.PI) / 180)}
                        ${0 - 40 * Math.sin((angle_lower * Math.PI) / 180)}
                       A 40 40 0 0 1
                        ${0 - 40 * Math.cos((angle_upper * Math.PI) / 180)}
                        ${0 - 40 * Math.sin((angle_upper * Math.PI) / 180)}
                       ">
                  </path>
                  `;
                })
            : ``
        }
          ${
            dialVisible
              ? svg`<path
                class="dial ${
                  this._updated && this.animation ? `animation` : ``
                }"
                style =${styleMap({
                  stroke: `${gaugeValueColor}`,
                  transform: `rotate(${this._valueAngle - 180}deg)`,
                })}
                d="M -40 0 A 40 40 0 0 1 40 0">
            </path>
            `
              : ``
          }
          ${this.showNeedle ? this._renderNeedle() : ``}
      ${(this._updated = true)}
      </g>
      </svg>
      <svg class="text">
        <text class="center">
          <tspan class="value-text">
            ${
              this._segment_value_replacement
                ? this._segment_value_replacement
                : this.valueText ||
                  formatNumber(this.value, this.locale, this.formatOptions)
            }
          </tspan>
          <tspan class="unit-text">
          ${this._segment_value_replacement ? "" : ` ${this.unitOfMeasure}`}
          </tspan>
      </svg>
      ${
        this.showMinMax
          ? svg`
          <svg class="min-container">
            <text x="50%" class="center top">
              <tspan class="min-max-text">
                ${formatNumber(this.min, this.locale, labelsFormatOptions)}
                </tapsn>
            </text>
          </svg>
          <svg class="max-container">
            <text x="50%" class="center top">
              <tspan class="min-max-text">
                ${formatNumber(this.max, this.locale, labelsFormatOptions)}
                </tapsn>
            </text>
          </svg>
        `
          : ``
      }
        ${
          this.segments && this.showSegmentLabels
            ? this.segments.map((segment) => {
                const angle_lower = this._getLowerAngle(
                  segment.lower!,
                  this.min,
                  this.max
                );
                const angle_upper = this._getUpperAngle(
                  segment.upper!,
                  this.min,
                  this.max
                );
                return html`
                  ${segment.lower != undefined
                    ? html` <div
                        class="segment-label"
                        style=${styleMap({
                          color: `${segment.color}`,
                          left: `${
                            50 - 39 * Math.cos((angle_lower * Math.PI) / 180)
                          }%`,
                          top: `calc(${
                            100 - 92 * Math.sin((angle_lower * Math.PI) / 180)
                          }% - 0.8rem)`,
                          transform: `translateX(${
                            ((angle_lower - 180) * 100) / 180
                          }%)`,
                        })}
                      >
                        ${formatNumber(
                          segment.lower,
                          this.locale,
                          labelsFormatOptions
                        )}
                      </div>`
                    : ``}
                  ${segment.upper != undefined
                    ? html` <div
                        class="segment-label"
                        style=${styleMap({
                          color: `${segment.color}`,
                          left: `${
                            50 - 39 * Math.cos((angle_upper * Math.PI) / 180)
                          }%`,
                          top: `calc(${
                            100 - 92 * Math.sin((angle_upper * Math.PI) / 180)
                          }% - 0.8rem)`,
                          transform: `translateX(${
                            ((angle_upper - 180) * 100) / 180
                          }%)`,
                        })}
                      >
                        ${formatNumber(
                          segment.upper,
                          this.locale,
                          labelsFormatOptions
                        )}
                      </div>`
                    : ``}
                `;
              })
            : ""
        }
  </div>
  <div class="label-container">
      <div class="label">
            ${this.valueLabel || ""}
      </div>
  </div>
`;
  }

  /*****************************************************************************************************************************/
  /* Purpose: Styles of this HTML element
/* History: 24-FEB-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/
  static styles = css`
    :host {
      position: relative;
    }

    .dial {
      fill: none;
      stroke-width: 14.7;
    }

    .needle {
      fill: var(--primary-text-color);
    }

    .needle-old {
      fill: var(--primary-text-color);
      stroke: var(--card-background-color);
      stroke-width: 1;
      stroke-linecap: round;
    }

    .needle-pivot {
      fill: var(--primary-text-color);
    }

    .needle-icon-path {
      fill: var(--primary-text-color);
    }

    .needle.animation,
    .dial.animation {
      transition: all 1s ease 0s;
    }

    .segment {
      fill: none;
      stroke-width: 15;
      opacity: 0.8;
    }

    .gauge-container {
      position: relative;
    }

    .gauge {
      display: block;
    }

    .text {
      position: absolute;
      max-height: 25%;
      max-width: 55%;
      left: 50%;
      bottom: -6%;
      transform: translate(-50%, 0%);
    }

    .center {
      text-anchor: middle;
      direction: ltr;
    }

    .top {
      dominant-baseline: hanging;
    }

    .text .value-text {
      font-size: 45px;
      fill: var(--primary-text-color);
    }

    .text .unit-text {
      font-size: 30px;
      fill: var(--secondary-text-color);
    }

    .label-container {
      display: flex;
      align-items: center;
      position: relative;
      padding-top: 10px;
    }

    .label {
      font-size: 0.9rem;
      color: var(--primary-text-color);
      margin: auto;
    }

    .min-container {
      position: absolute;
      max-height: 15%;
      max-width: 11%;
      left: 19.5%;
      bottom: -18%;
      transform: translate(-50%, 0%);
      overflow: visible;
    }

    .max-container {
      position: absolute;
      max-height: 15%;
      max-width: 11%;
      right: 19.5%;
      bottom: -18%;
      transform: translate(50%, 0%);
      overflow: visible;
    }

    .min-max-text {
      font-size: 0.8rem;
      fill: var(--primary-text-color);
    }

    .segment-label {
      position: absolute;
      font-size: 0.8rem;
      fill: var(--primary-text-color);
    }
  `;
}

/*****************************************************************************************************************************/
/* Purpose: Assign the HTML tag to this class
/* History: 24-FEB-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/
if (!customElements.get("microteq-extended-gauge")) {
  customElements.define(`microteq-extended-gauge`, ExtendedGauge);
}
