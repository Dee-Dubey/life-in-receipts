import { MONTH_NAMES } from "./csv.js";

export function fmtINR(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function computeMood(m) {
  if (m.txns.length === 0 && m.songs.length === 0) return "Quiet";
  if (m.lateNightFraction > 0.35) return "Restless";
  if (m.categoryTotals["Festivals"]) return "Celebratory";
  if (m.topCategory && m.topCategory.toLowerCase() === "subscription") return "Cozy";
  if (m.topCategory && m.topCategory.toLowerCase() === "transportation") return "On the Move";
  if (m.skipRate > 0.4) return "Distracted";
  return "Steady";
}

function generateNarrative(m) {
  if (m.txns.length === 0 && m.songs.length === 0) {
    return `No receipts survive from ${m.name} — a quiet, undocumented stretch.`;
  }
  const bits = [];
  if (m.topCategory) {
    bits.push(
      `In ${m.name}, the biggest chunk of spending went to ${m.topCategory.toLowerCase()} (${fmtINR(
        m.topCategoryAmt
      )}).`
    );
  } else {
    bits.push(`In ${m.name}, spending was scattered with no single category standing out.`);
  }
  if (m.topArtist) {
    bits.push(
      `${m.topArtist} got the most airtime this month${
        m.topTrack ? `, led by "${m.topTrack}".` : "."
      }`
    );
  }
  if (m.lateNightFraction > 0.3) {
    bits.push("A striking share of that listening happened after 11pm — the late hours carried this chapter.");
  } else if (m.skipRate > 0.4) {
    bits.push("A lot of tracks got skipped early — more searching for a mood than settling into one.");
  }
  if (m.definingDay) {
    bits.push(`Everything peaks on the ${ordinal(m.definingDay.day)} — the closest this month comes to one real moment.`);
  }
  return bits.join(" ");
}

export function buildModel(household, spotify) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    index: i,
    name: MONTH_NAMES[i],
    txns: [],
    songs: [],
    totalSpent: 0,
    totalIncome: 0,
    categoryTotals: {},
  }));

  household.forEach((t) => {
    if (t.month == null) return;
    const m = months[t.month];
    m.txns.push(t);
    if (t.type && t.type.toLowerCase() === "expense") {
      m.totalSpent += t.amount;
      m.categoryTotals[t.category] = (m.categoryTotals[t.category] || 0) + t.amount;
    } else if (t.type && t.type.toLowerCase() === "income") {
      m.totalIncome += t.amount;
    }
  });

  spotify.forEach((s) => {
    if (s.month == null) return;
    months[s.month].songs.push(s);
  });

  months.forEach((m) => {
    let topCategory = null, topCategoryAmt = -1;
    Object.keys(m.categoryTotals).forEach((c) => {
      if (m.categoryTotals[c] > topCategoryAmt) {
        topCategoryAmt = m.categoryTotals[c];
        topCategory = c;
      }
    });
    m.topCategory = topCategory;
    m.topCategoryAmt = topCategoryAmt < 0 ? 0 : topCategoryAmt;

    const artistPlay = {};
    m.songs.forEach((s) => (artistPlay[s.artist] = (artistPlay[s.artist] || 0) + 1));
    let topArtist = null, topArtistCount = -1;
    Object.keys(artistPlay).forEach((a) => {
      if (artistPlay[a] > topArtistCount) {
        topArtistCount = artistPlay[a];
        topArtist = a;
      }
    });
    m.topArtist = topArtist;

    const trackPlay = {};
    m.songs.forEach((s) => {
      const key = s.track + "||" + s.artist;
      trackPlay[key] = (trackPlay[key] || 0) + 1;
    });
    let topTrackKey = null, topTrackCount = -1;
    Object.keys(trackPlay).forEach((k) => {
      if (trackPlay[k] > topTrackCount) {
        topTrackCount = trackPlay[k];
        topTrackKey = k;
      }
    });
    m.topTrack = topTrackKey ? topTrackKey.split("||")[0] : null;

    const lateNight = m.songs.filter((s) => s.ts && (s.ts.getHours() >= 23 || s.ts.getHours() < 5)).length;
    m.lateNightFraction = m.songs.length ? lateNight / m.songs.length : 0;

    const skipped = m.songs.filter((s) => s.skipped).length;
    m.skipRate = m.songs.length ? skipped / m.songs.length : 0;

    m.mood = computeMood(m);

    const dayMap = {};
    m.txns.forEach((t) => {
      if (!t.date) return;
      const d = t.date.getDate();
      dayMap[d] = dayMap[d] || { txns: [], songs: [] };
      dayMap[d].txns.push(t);
    });
    m.songs.forEach((s) => {
      if (!s.ts) return;
      const d = s.ts.getDate();
      dayMap[d] = dayMap[d] || { txns: [], songs: [] };
      dayMap[d].songs.push(s);
    });
    let bestDay = null, bestScore = -1;
    Object.keys(dayMap).forEach((d) => {
      const v = dayMap[d];
      const score = v.txns.length + v.songs.length + (v.txns.length && v.songs.length ? 2 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestDay = { day: Number(d), txns: v.txns, songs: v.songs };
      }
    });
    m.definingDay = bestDay;
    m.narrative = generateNarrative(m);
  });

  return months;
}

export function correlation(xs, ys) {
  const n = xs.length;
  if (!n) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? 0 : num / den;
}
