/*****************************************************************************************************************************/
/* Purpose: Pure gauge math helpers, separated for testability (no browser/decorator dependencies).
/* History: 12-JUL-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/
import * as mdiIcons from "@mdi/js";


/*****************************************************************************************************************************/
/* Purpose: Convert an MDI icon name (e.g. "mdi:arrow-up-bold") to its SVG path data string using @mdi/js
/* History: 12-JUL-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/
export function mdiIconToPath(iconName: string): string | undefined
{
  if (!iconName || !iconName.startsWith("mdi:"))
    return undefined;
  const kebab = iconName.slice(4); // strip "mdi:"
  const camel = "mdi" + kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return (mdiIcons as Record<string, string>)[camel];
}


/*****************************************************************************************************************************/
/* Purpose: Keep a numeric value within [min, max]. Returns 0 when any argument is NaN.
/* History: 12-JUL-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/
export function normalizeValue(value: number, min: number, max: number): number
{
  if (isNaN(value) || isNaN(min) || isNaN(max))
    return 0;
  if (value > max) return max;
  if (value < min) return min;
  return value;
}


/*****************************************************************************************************************************/
/* Purpose: Return the value expressed as a percentage of [min, max].
/* History: 12-JUL-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/
export function getValueInPercentage(value: number, min: number, max: number): number
{
  return (100 * (value - min)) / (max - min);
}


/*****************************************************************************************************************************/
/* Purpose: Map a value to a needle angle in degrees (0° = min = left, 180° = max = right).
/* History: 12-JUL-2025 D.Geisenhoff   Created
/*****************************************************************************************************************************/
export function getAngle(value: number, min: number, max: number): number
{
  const pct = getValueInPercentage(normalizeValue(value, min, max), min, max);
  return (pct * 180) / 100;
}
