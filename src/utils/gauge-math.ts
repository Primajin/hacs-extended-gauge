/*****************************************************************************************************************************/
/* Purpose: Pure gauge math helpers, separated for testability (no browser/decorator dependencies).
/* History: 12-JUL-2026 J.Hell   Created
/*****************************************************************************************************************************/

/*****************************************************************************************************************************/
/* Purpose: Keep a numeric value within [min, max]. Returns 0 when any argument is NaN.
/* History: 12-JUL-2026 J.Hell   Created
/*****************************************************************************************************************************/
export function normalizeValue(
  value: number,
  min: number,
  max: number
): number {
  if (isNaN(value) || isNaN(min) || isNaN(max)) return 0;
  if (value > max) return max;
  if (value < min) return min;
  return value;
}

/*****************************************************************************************************************************/
/* Purpose: Return the value expressed as a percentage of [min, max].
/* History: 12-JUL-2026 J.Hell   Created
/*****************************************************************************************************************************/
export function getValueInPercentage(
  value: number,
  min: number,
  max: number
): number {
  return (100 * (value - min)) / (max - min);
}

/*****************************************************************************************************************************/
/* Purpose: Map a value to a needle angle in degrees (0° = min = left, 180° = max = right).
/* History: 12-JUL-2026 J.Hell   Created
/*****************************************************************************************************************************/
export function getAngle(value: number, min: number, max: number): number {
  const pct = getValueInPercentage(normalizeValue(value, min, max), min, max);
  return (pct * 180) / 100;
}
