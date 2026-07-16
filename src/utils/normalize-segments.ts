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
/* Purpose: Determine whether at least one segment is configured. This is a prerequisite for showing segment colour bands,
/*          but does not by itself decide whether bands or the flat proportional dial fill are shown - see the showSegments
/*          logic in gauge.ts render(), which additionally considers min_value and showNeedle.
/* History: 16-JUL-2026 D.Geisenhoff   Created
/*****************************************************************************************************************************/
export function hasVisibleSegments(segments?: GaugeSegment[]): boolean {
  return !!(segments && segments.length);
}
