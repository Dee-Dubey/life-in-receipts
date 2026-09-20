import {
  MONTH_NAMES,
  LATE_NIGHT_START_HOUR,
  LATE_NIGHT_END_HOUR,
  MOOD_LATE_NIGHT_SHARE,
  NARRATIVE_LATE_NIGHT_SHARE,
  MOOD_SKIP_RATE,
  DEFINING_DAY_CROSSOVER_BONUS,
} from "./constants.js";

/** @typedef {import("./types.js").Transaction} Transaction */
/** @typedef {import("./types.js").Song} Song */
/** @typedef {import("./types.js").Month} Month */
/** @typedef {import("./types.js").DefiningDay} DefiningDay */

/** ₹ with Indian digit grouping, e.g. 1234567 → "₹12,34,567". */
export function fmtINR(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** 1 → "1st", 22 → "22nd", 13 → "13th". */
export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * The most common item by key. Ties go to whichever key appeared first.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} keyFn
 * @returns {T|null} the first item carrying the winning key, or null for an empty list
 */
export function mostFrequent(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const entry = counts.get(key) || { count: 0, item };
    entry.count += 1;
    counts.set(key, entry);
  }
  let best = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best ? best.item : null;
}

/** The [name, amount] pair with the largest amount; ties go to the first. */
function topEntry(totals) {
  let name = null;
  let amount = 0;
  for (const [key, value] of Object.entries(totals)) {
    if (name === null || value > amount) {
      name = key;
      amount = value;
    }
  }
  return { name, amount };
}

function isLateNight(song) {
  if (!song.ts) return false;
  const hour = song.ts.getHours();
  return hour >= LATE_NIGHT_START_HOUR || hour < LATE_NIGHT_END_HOUR;
}

function share(list, predicate) {
  return list.length ? list.filter(predicate).length / list.length : 0;
}

function hasSpendIn(month, categoryName) {
  return Object.entries(month.categoryTotals).some(
    ([name, amount]) => name.toLowerCase() === categoryName && amount > 0,
  );
}

/**
 * The single-word mood of a month. Rules are checked in priority order:
 * quiet → restless (late nights) → celebratory (festivals) → cozy (subscriptions)
 * → on the move (transport) → distracted (many skips) → steady.
 */
function computeMood(m) {
  if (m.txns.length === 0 && m.songs.length === 0) return "Quiet";
  if (m.lateNightFraction > MOOD_LATE_NIGHT_SHARE) return "Restless";
  if (hasSpendIn(m, "festivals")) return "Celebratory";
  const top = m.topCategory ? m.topCategory.toLowerCase() : "";
  if (top === "subscription") return "Cozy";
  if (top === "transportation") return "On the Move";
  if (m.skipRate > MOOD_SKIP_RATE) return "Distracted";
  return "Steady";
}

/** One human-voiced paragraph per month, assembled from whichever facts are available. */
function generateNarrative(m) {
  if (m.txns.length === 0 && m.songs.length === 0) {
    return `No receipts survive from ${m.name} — a quiet, undocumented stretch.`;
  }
  const bits = [];
  if (m.topCategory) {
    bits.push(
      `In ${m.name}, the biggest chunk of spending went to ${m.topCategory.toLowerCase()} (${fmtINR(m.topCategoryAmt)}).`,
    );
  } else {
    bits.push(`In ${m.name}, spending was scattered with no single category standing out.`);
  }
  if (m.topArtist) {
    const lead = m.topTrack ? `, led by "${m.topTrack}".` : ".";
    bits.push(`${m.topArtist} got the most airtime this month${lead}`);
  }
  if (m.lateNightFraction > NARRATIVE_LATE_NIGHT_SHARE) {
    bits.push("A striking share of that listening happened after 11pm — the late hours carried this chapter.");
  } else if (m.skipRate > MOOD_SKIP_RATE) {
    bits.push("A lot of tracks got skipped early — more searching for a mood than settling into one.");
  }
  if (m.definingDay) {
    bits.push(
      `Everything peaks on the ${ordinal(m.definingDay.day)} — the closest this month comes to one real moment.`,
    );
  }
  return bits.join(" ");
}

/**
 * The busiest day-of-month by combined purchases + tracks, with a bonus when both happened that day.
 * @param {Transaction[]} txns
 * @param {Song[]} songs
 * @returns {DefiningDay|null}
 */
export function findDefiningDay(txns, songs) {
  const byDay = new Map();
  const bucket = (day) => {
    if (!byDay.has(day)) byDay.set(day, { txns: [], songs: [] });
    return byDay.get(day);
  };
  txns.forEach((t) => t.date && bucket(t.date.getDate()).txns.push(t));
  songs.forEach((s) => s.ts && bucket(s.ts.getDate()).songs.push(s));

  let best = null;
  let bestScore = -1;
  for (const [day, v] of byDay) {
    const crossover = v.txns.length && v.songs.length ? DEFINING_DAY_CROSSOVER_BONUS : 0;
    const score = v.txns.length + v.songs.length + crossover;
    if (score > bestScore) {
      bestScore = score;
      best = { day, txns: v.txns, songs: v.songs };
    }
  }
  return best;
}

function createEmptyMonths() {
  return MONTH_NAMES.map((name, index) => ({
    index,
    name,
    txns: [],
    songs: [],
    totalSpent: 0,
    totalIncome: 0,
    categoryTotals: {},
  }));
}

/** Sorts each record into its month and totals up money in / out. Records with no date are ignored. */
function assignRecords(months, household, spotify) {
  for (const t of household) {
    if (t.month == null) continue;
    const m = months[t.month];
    m.txns.push(t);
    const type = (t.type || "").toLowerCase();
    if (type === "expense") {
      m.totalSpent += t.amount;
      m.categoryTotals[t.category] = (m.categoryTotals[t.category] || 0) + t.amount;
    } else if (type === "income") {
      m.totalIncome += t.amount;
    }
  }
  for (const s of spotify) {
    if (s.month != null) months[s.month].songs.push(s);
  }
}

/** Fills in every derived field of one month (mutates `m`, which was created by `createEmptyMonths`). */
function summariseMonth(m) {
  const { name, amount } = topEntry(m.categoryTotals);
  m.topCategory = name;
  m.topCategoryAmt = amount;

  m.topArtist = mostFrequent(m.songs, (s) => s.artist)?.artist ?? null;
  m.topTrack = mostFrequent(m.songs, (s) => `${s.track}||${s.artist}`)?.track ?? null;

  m.lateNightFraction = share(m.songs, isLateNight);
  m.skipRate = share(m.songs, (s) => s.skipped);
  m.mood = computeMood(m);
  m.definingDay = findDefiningDay(m.txns, m.songs);
  m.narrative = generateNarrative(m);
}

/**
 * Turns the two flat record lists into twelve month "chapters".
 * Records are grouped by month of the year (not exact date) because two independent datasets rarely overlap.
 * @param {Transaction[]} household
 * @param {Song[]} spotify
 * @returns {Month[]} always exactly 12 entries
 */
export function buildModel(household, spotify) {
  const months = createEmptyMonths();
  assignRecords(months, household, spotify);
  months.forEach(summariseMonth);
  return months;
}

/**
 * Pearson correlation coefficient of two equal-length series (0 when undefined, e.g. a constant series).
 * @param {number[]} xs
 * @param {number[]} ys
 */
export function correlation(xs, ys) {
  const n = xs.length;
  if (!n) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? 0 : num / den;
}
