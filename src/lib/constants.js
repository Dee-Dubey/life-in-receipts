/**
 * Every tunable number and label in one place, so the rules behind the "mood" and "narrative"
 * of each month are easy to find, explain and change.
 */

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** A track played from 23:00 up to (but not including) 05:00 counts as "late-night". */
export const LATE_NIGHT_START_HOUR = 23;
export const LATE_NIGHT_END_HOUR = 5;

/** Without an explicit `skipped` column, a play shorter than this counts as skipped. */
export const SKIP_THRESHOLD_MS = 30_000;

/** Above this share of late-night plays a month is "Restless". */
export const MOOD_LATE_NIGHT_SHARE = 0.35;
/** Above this share the narrative calls out late-night listening. */
export const NARRATIVE_LATE_NIGHT_SHARE = 0.3;
/** Above this share of skipped tracks a month is "Distracted". */
export const MOOD_SKIP_RATE = 0.4;

/** A day with both a purchase and a track is a real "crossover" — it gets this many bonus points. */
export const DEFINING_DAY_CROSSOVER_BONUS = 2;

/** Rendering caps: totals always use the full dataset, only the visible rows are limited. */
export const CHAPTER_LIST_CAP = 40;
export const DEFINING_DAY_LIST_CAP = 6;
export const SEARCH_RESULT_CAP = 150;
export const CATEGORY_BARS_SHOWN = 6;
