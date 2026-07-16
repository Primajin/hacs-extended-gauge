/*****************************************************************************************************************************/
/* Purpose: Pure helper that fills in missing lower/upper bounds for gauge segments.
/*          When lower is absent (undefined / NaN) it defaults to min; when upper is
/*          absent it defaults to max.  If lower ends up greater than upper the segment
/*          is collapsed to the upper value so it has zero width rather than being
/*          rendered in reverse.
/* History: 16-JUL-2025 Extracted from ExtendedGauge._normalizeSegments for testability
/*****************************************************************************************************************************/
import { GaugeSegment } from "../components/gauge";

export function normalizeSegments(
  segments: GaugeSegment[],
  min: number,
  max: number
): void {
  for (const segment of segments) {
    if (isNaN(segment.lower!)) segment.lower = min;
    if (isNaN(segment.upper!)) segment.upper = max;
    if (segment.lower! > segment.upper!) segment.lower = segment.upper;
  }
}

/*****************************************************************************************************************************/
/* Purpose: Determine whether segment colour bands (and, mutually exclusively, the flat proportional dial fill) should be
/*          shown. Segments are shown whenever at least one is configured: the flat single-colour fill would otherwise paint
/*          one segment's colour across ranges belonging to other segments (e.g. across the "0" mark when min_value is
/*          negative), so it is only used when there are no segments at all.
/* History: 16-JUL-2026 D.Geisenhoff   Created
/*****************************************************************************************************************************/
export function hasVisibleSegments(segments?: GaugeSegment[]): boolean {
  return !!(segments && segments.length);
}
