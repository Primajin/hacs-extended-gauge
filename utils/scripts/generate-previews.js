#!/usr/bin/env node
/**
 * generate-previews.js
 *
 * Generates SVG preview images for all Extended Gauge Card configurations.
 * Run with:  node utils/scripts/generate-previews.js
 * Output:    assets/preview-*.svg
 *
 * Gauge coordinate system (matches ha-gauge.ts and gauge.ts):
 *   - Arc: "M -40 0 A 40 40 0 0 1 40 0"  (left=min, right=max, top=mid)
 *   - Angle 0°  = left  (-40, 0)  = minimum value
 *   - Angle 90° = top   (0, -40)  = midpoint
 *   - Angle 180°= right (+40, 0)  = maximum value
 *   - Point on arc at angle θ: x = -40·cos(θ), y = -40·sin(θ)
 *   - Needle rotation: CSS rotate(θdeg) around (0,0)
 *   - Dial fill arc: draw from (-40,0) to the endpoint at pct*180°
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Canvas / layout constants
// ---------------------------------------------------------------------------
const W   = 240;    // SVG canvas width
const H   = 100;    // SVG canvas height
const CX  = 120;    // Gauge pivot X (horizontally centered)
const CY  = 60;     // Gauge pivot Y (leaves ~8px top padding, ~15px bottom)
const R   = 40;     // Gauge arc radius

const OUT_DIR = path.resolve(__dirname, '../../assets');

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------
function toRad(deg) { return deg * Math.PI / 180; }
function r2(n)      { return Math.round(n * 100) / 100; }

/**
 * Convert a value in [min,max] to an angle in [0,180] degrees.
 * 0° = left (min), 90° = top (mid), 180° = right (max).
 */
function valueToAngle(value, min, max) {
  return ((value - min) / (max - min)) * 180;
}

/**
 * Return the SVG coordinate of the point on the arc at angle θ degrees.
 * x = -R·cos(θ),  y = -R·sin(θ)
 */
function arcPoint(angleDeg) {
  const a = toRad(angleDeg);
  return { x: r2(-R * Math.cos(a)), y: r2(-R * Math.sin(a)) };
}

/**
 * Build an SVG arc path from the start of the gauge (-40,0) to the point
 * at the given angle.  Used for the dial fill arc.
 *
 * @param {number} angleDeg  Angle in [0,180].  0 → nothing drawn, 180 → full arc.
 * @param {string} color     Stroke color.
 * @param {number} sw        Stroke width (default 14.7 to match gauge arc).
 * @returns {string} SVG <path> element string.
 */
function dialArcPath(angleDeg, color, sw) {
  sw = sw || 14.7;
  if (angleDeg <= 0) return '';
  if (angleDeg >= 180) {
    // Full arc  — same as the background arc
    return `<path d="M -40 0 A ${R} ${R} 0 0 1 40 0" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="butt"/>`;
  }
  const p = arcPoint(angleDeg);
  const large = angleDeg > 180 ? 1 : 0;
  return `<path d="M -40 0 A ${R} ${R} 0 ${large} 1 ${p.x} ${p.y}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="butt"/>`;
}

/**
 * Build an SVG arc path for a segment from pctLo to pctHi.
 *
 * @param {number} pctLo  0–100
 * @param {number} pctHi  0–100
 * @param {string} color
 */
function segmentArcPath(pctLo, pctHi, color) {
  const a1 = valueToAngle(pctLo, 0, 100);
  const a2 = valueToAngle(pctHi, 0, 100);
  const p1 = arcPoint(a1);
  const p2 = arcPoint(a2);
  const large = (a2 - a1) > 180 ? 1 : 0;
  return `<path d="M ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}" stroke="${color}" fill="none" stroke-width="15" opacity="0.85"/>`;
}

// ---------------------------------------------------------------------------
// SVG building blocks
// ---------------------------------------------------------------------------

/** Background arc (the gauge track) */
const BG_ARC = `<path d="M -40 0 A 40 40 0 0 1 40 0" fill="none" stroke="#3a3a3c" stroke-width="14.7" stroke-linecap="butt"/>`;

/** Default needle arrow at angle θ (no rotation = pointing to min/left) */
function defaultNeedle(angleDeg) {
  return `<path d="M -25 -2.5 L -47.5 0 L -25 2.5 z" fill="#e0e0e0" transform="rotate(${angleDeg})"/>`;
}

/** Original HA-style needle at angle θ — path from ha-gauge.ts */
function oldNeedle(angleDeg) {
  return `<path d="M -34,-3 L -40,-1 A 1,1,0,0,0,-40,1 L -34,3 A 2,2,0,0,0,-34,-3 Z" fill="#e0e0e0" stroke="#1c1c1e" stroke-width="1" stroke-linecap="round" opacity="0.8" transform="rotate(${angleDeg})"/>`;
}

/**
 * Value label and min/max axis labels (rendered inside the gauge group).
 * valueLabel: text shown in the centre (e.g. "25%")
 */
function gaugeLabels(valueLabel) {
  return [
    `<text x="0" y="-5" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#e0e0e0" font-weight="bold">${valueLabel}</text>`,
    `<text x="-38" y="8" text-anchor="middle" font-family="sans-serif" font-size="5" fill="#e0e0e0" opacity="0.5">0</text>`,
    `<text x="38" y="8" text-anchor="middle" font-family="sans-serif" font-size="5" fill="#e0e0e0" opacity="0.5">100</text>`,
  ].join('\n    ');
}

function gaugeLabelsCustom(valueLabel, minLabel, maxLabel) {
  return [
    `<text x="0" y="-5" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#e0e0e0" font-weight="bold">${valueLabel}</text>`,
    `<text x="-38" y="8" text-anchor="middle" font-family="sans-serif" font-size="5" fill="#e0e0e0" opacity="0.5">${minLabel}</text>`,
    `<text x="38" y="8" text-anchor="middle" font-family="sans-serif" font-size="5" fill="#e0e0e0" opacity="0.5">${maxLabel}</text>`,
  ].join('\n    ');
}

/**
 * Wrap gauge content in the standard SVG shell (background rect + centered group).
 */
function svgWrap(innerContent, extraRootContent) {
  extraRootContent = extraRootContent || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="12" fill="#1c1c1e"/>
  <g transform="translate(${CX}, ${CY})">
    ${innerContent}
  </g>
  ${extraRootContent}
</svg>`;
}

// ---------------------------------------------------------------------------
// Individual preview generators
// ---------------------------------------------------------------------------

// value=25, min=0, max=100  →  angle=45°
const ANGLE_25 = valueToAngle(25, 0, 100);   // 45
// value=50, min=0, max=100  →  angle=90°
const ANGLE_50 = valueToAngle(50, 0, 100);   // 90
// value=10, min=-20, max=40  →  angle=90°
const ANGLE_CUSTOM = valueToAngle(10, -20, 40); // 90

function previewNeedleDefault() {
  return svgWrap([
    BG_ARC,
    defaultNeedle(ANGLE_25),
    gaugeLabels('25%'),
  ].join('\n    '));
}

function previewNeedleDefaultMid() {
  return svgWrap([
    BG_ARC,
    defaultNeedle(ANGLE_50),
    gaugeLabels('50%'),
  ].join('\n    '));
}

function previewNeedleOld() {
  return svgWrap([
    BG_ARC,
    oldNeedle(ANGLE_25),
    gaugeLabels('25%'),
  ].join('\n    '));
}

function previewNeedleOldMid() {
  return svgWrap([
    BG_ARC,
    oldNeedle(ANGLE_50),
    gaugeLabels('50%'),
  ].join('\n    '));
}

function previewNeedleIconRotate() {
  // Chevron icon rotated with gauge (size=2× default)
  const scale    = 0.24;          // 0.12 × 2
  const iconSize = 24 * scale;    // 5.76 SVG units
  const iconX    = r2(-43 - iconSize);
  const iconY    = r2(-iconSize / 2);
  const bgR      = r2(iconSize * 0.75);
  const bgCX     = r2(iconX + iconSize / 2);
  // mdi:chevron-down approximate path (24×24 viewBox)
  const chevron  = 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z';
  const content  = `<g transform="rotate(${ANGLE_25})"><circle cx="${bgCX}" cy="0" r="${bgR}" fill="#2a5c8f" opacity="0.9"/><path d="${chevron}" transform="translate(${iconX}, ${iconY}) scale(${scale})" fill="#5bc8ff"/></g>`;
  return svgWrap([BG_ARC, content, gaugeLabels('25%')].join('\n    '));
}

function previewNeedleIconVertical() {
  const scale    = 0.24;
  const iconSize = 24 * scale;
  const bgR      = r2(iconSize * 0.75);
  const a        = toRad(ANGLE_25);
  const cx       = r2(-R * Math.cos(a));
  const cy       = r2(-R * Math.sin(a));
  const ix       = r2(cx - iconSize / 2);
  const iy       = r2(cy - iconSize / 2);
  const chevron  = 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z';
  const content  = `<circle cx="${cx}" cy="${cy}" r="${bgR}" fill="#2a5c8f" opacity="0.9"/><path d="${chevron}" transform="translate(${ix}, ${iy}) scale(${scale})" fill="#5bc8ff"/>`;
  return svgWrap([BG_ARC, content, gaugeLabels('25%')].join('\n    '));
}

function previewSegmentsNeedle() {
  // Segments 0–33 green, 70–85 orange; needle at 25% (angle=45°)
  const seg1    = segmentArcPath(0, 33, '#4caf50');
  const seg2    = segmentArcPath(70, 85, '#ff9800');
  const needle  = defaultNeedle(ANGLE_25);
  return svgWrap([BG_ARC, seg1, seg2, needle, gaugeLabels('25%')].join('\n    '));
}

function previewSegmentsLabels() {
  // Segments without needle; segment threshold labels placed at arc boundary points
  const seg1    = segmentArcPath(0, 33, '#4caf50');
  const seg2    = segmentArcPath(70, 85, '#ff9800');
  const dial    = dialArcPath(ANGLE_25, '#4caf50');

  // Threshold label positions: slightly outside the arc (r+10) so they don't overlap
  function labelAt(pct, color, label, rOffset) {
    rOffset = rOffset || 10;
    const a  = toRad(valueToAngle(pct, 0, 100));
    const lx = r2((R + rOffset) * -Math.cos(a) + CX);
    const ly = r2((R + rOffset) * -Math.sin(a) + CY);
    return `<text x="${lx}" y="${ly}" text-anchor="middle" font-family="sans-serif" font-size="6" fill="${color}">${label}</text>`;
  }

  const extraLabels = [
    labelAt(33, '#4caf50', '33'),
    labelAt(70, '#ff9800', '70'),
    labelAt(85, '#ff9800', '85'),
  ].join('\n  ');

  return svgWrap([BG_ARC, seg1, seg2, dial, gaugeLabels('25%')].join('\n    '), extraLabels);
}

function previewCustomRange() {
  // min=-20, max=40, value=10 → 50% → angle=90° → endpoint=(0,-40)
  const dial   = dialArcPath(ANGLE_CUSTOM, '#4caf50');
  const needle = defaultNeedle(ANGLE_CUSTOM);
  return svgWrap([BG_ARC, dial, needle, gaugeLabelsCustom('10°C', '-20', '40')].join('\n    '));
}

function previewNoNeedle() {
  // Dial mode only: value=25% → angle=45° → fill arc to endpoint
  const dial = dialArcPath(ANGLE_25, '#4caf50');
  return svgWrap([BG_ARC, dial, gaugeLabels('25%')].join('\n    '));
}

// ---------------------------------------------------------------------------
// Write all files
// ---------------------------------------------------------------------------
const FILES = {
  'preview-needle-default.svg':     previewNeedleDefault(),
  'preview-needle-default-mid.svg': previewNeedleDefaultMid(),
  'preview-needle-old.svg':         previewNeedleOld(),
  'preview-needle-old-mid.svg':     previewNeedleOldMid(),
  'preview-needle-icon-rotate.svg': previewNeedleIconRotate(),
  'preview-needle-icon-vertical.svg': previewNeedleIconVertical(),
  'preview-segments-needle.svg':    previewSegmentsNeedle(),
  'preview-segments-labels.svg':    previewSegmentsLabels(),
  'preview-custom-range.svg':       previewCustomRange(),
  'preview-no-needle.svg':          previewNoNeedle(),
};

for (const [name, content] of Object.entries(FILES)) {
  const filePath = path.join(OUT_DIR, name);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Written:', name);
}
console.log(`\nAll ${Object.keys(FILES).length} previews written to assets/`);
