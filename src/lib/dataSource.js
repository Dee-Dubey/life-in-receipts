import { parseHouseholdCSV, parseSpotifyCSV } from "./csv.js";

// Put the organizer-provided CSVs in /public/data with these exact names and they are
// loaded automatically on start-up (static files — no backend involved).
export const BUNDLED_FILES = {
  household: "data/household.csv",
  spotify: "data/spotify.csv",
};

async function fetchCsvText(path) {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
    if (!res.ok) return null;
    const text = await res.text();
    // Dev servers / SPA hosts answer unknown paths with index.html and a 200 — reject that.
    if ((res.headers.get("content-type") || "").includes("text/html") || /^\s*</.test(text)) {
      return null;
    }
    return text;
  } catch {
    return null;
  }
}

/** Returns { household, spotify } if at least one bundled CSV exists and parses, else null. */
export async function loadBundledData() {
  const [hText, sText] = await Promise.all([
    fetchCsvText(BUNDLED_FILES.household),
    fetchCsvText(BUNDLED_FILES.spotify),
  ]);
  const household = hText ? parseHouseholdCSV(hText) : [];
  const spotify = sText ? parseSpotifyCSV(sText) : [];
  if (!household.length && !spotify.length) return null;
  return { household, spotify };
}
