export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const CATEGORY_MOOD = {
  food: "Comfort",
  transportation: "Motion",
  subscription: "Cozy",
  festivals: "Celebration",
  family: "Connection",
  apparel: "Care",
  fitness_and_medical: "Care",
  entertainment: "Cozy",
  travel: "Motion",
  other: "Routine",
};

// Minimal RFC4180-ish CSV parser: handles quoted fields and embedded commas.
export function parseCSV(input) {
  // Excel / Kaggle exports often start with a BOM, which would corrupt the first header name.
  const text = String(input || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ""));
}

function colIndex(header, names) {
  for (const n of names) {
    const idx = header.indexOf(n);
    if (idx >= 0) return idx;
  }
  return -1;
}

// "20/09/2018 12:04:08" (day-month-year, as used by the household dataset)
export function parseDMY(str) {
  if (!str) return null;
  const [datePart, timePart] = str.trim().split(" ");
  const d = datePart.split("/");
  if (d.length < 3) return null;
  const day = parseInt(d[0], 10);
  const mon = parseInt(d[1], 10);
  const yr = parseInt(d[2], 10);
  if (!day || !mon || !yr) return null;
  let hh = 0, mm = 0, ss = 0;
  if (timePart) {
    const t = timePart.split(":");
    hh = parseInt(t[0], 10) || 0;
    mm = parseInt(t[1], 10) || 0;
    ss = parseInt(t[2], 10) || 0;
  }
  return new Date(yr, mon - 1, day, hh, mm, ss);
}

// "7/8/2013 2:44" (month-day-year, as used by the Spotify dataset)
export function parseMDY(str) {
  if (!str) return null;
  const [datePart, timePart] = str.trim().split(" ");
  const d = datePart.split("/");
  if (d.length < 3) return null;
  const mon = parseInt(d[0], 10);
  const day = parseInt(d[1], 10);
  const yr = parseInt(d[2], 10);
  if (!day || !mon || !yr) return null;
  let hh = 0, mm = 0;
  if (timePart) {
    const t = timePart.split(":");
    hh = parseInt(t[0], 10) || 0;
    mm = parseInt(t[1], 10) || 0;
  }
  return new Date(yr, mon - 1, day, hh, mm, 0);
}

// "2013-07-08 02:44:34" or "2013-07-08T02:44:34Z" (ISO-like, used by some Spotify exports)
export function parseISO(str) {
  if (!str) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(str.trim());
  if (!m) return null;
  const [, yr, mon, day, hh = "0", mm = "0", ss = "0"] = m;
  if (!Number(mon) || !Number(day)) return null;
  return new Date(Number(yr), Number(mon) - 1, Number(day), Number(hh), Number(mm), Number(ss));
}

// Spotify timestamps can be "M/D/YYYY H:MM" or ISO — accept both.
export function parseSpotifyDate(str) {
  if (!str) return null;
  return /^\d{4}-/.test(str.trim()) ? parseISO(str) : parseMDY(str);
}

export function parseHouseholdCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const iDate = colIndex(header, ["date"]);
  const iCategory = colIndex(header, ["category"]);
  const iSub = colIndex(header, ["subcategory"]);
  const iNote = colIndex(header, ["note"]);
  const iAmount = colIndex(header, ["amount"]);
  const iType = colIndex(header, ["income/expense", "type"]);

  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;
    const date = iDate >= 0 ? parseDMY(row[iDate]) : null;
    const amount = iAmount >= 0 ? parseFloat(row[iAmount]) : NaN;
    if (isNaN(amount)) continue;
    let category = (iCategory >= 0 ? row[iCategory] : "Other") || "Other";
    category = category.trim() || "Other";
    out.push({
      date,
      month: date ? date.getMonth() : null,
      category,
      subcategory: iSub >= 0 ? (row[iSub] || "").trim() : "",
      note: iNote >= 0 ? (row[iNote] || "").trim() : "",
      amount: Math.abs(amount),
      type: iType >= 0 ? (row[iType] || "Expense").trim() : "Expense",
      mood: CATEGORY_MOOD[category.toLowerCase()] || "Routine",
    });
  }
  return out;
}

export function parseSpotifyCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const iTs = colIndex(header, ["ts"]);
  const iTrack = colIndex(header, ["track_name", "track"]);
  const iArtist = colIndex(header, ["artist_name", "artist"]);
  const iAlbum = colIndex(header, ["album_name", "album"]);
  const iMs = colIndex(header, ["ms_played"]);
  const iSkip = colIndex(header, ["skipped"]);
  const iReasonEnd = colIndex(header, ["reason_end"]);

  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;
    const ts = iTs >= 0 ? parseSpotifyDate(row[iTs]) : null;
    const track = iTrack >= 0 ? (row[iTrack] || "").trim() : "";
    if (!track) continue;
    const ms = iMs >= 0 ? parseFloat(row[iMs]) : 0;
    out.push({
      ts,
      month: ts ? ts.getMonth() : null,
      track,
      artist: iArtist >= 0 ? (row[iArtist] || "Unknown Artist").trim() : "Unknown Artist",
      album: iAlbum >= 0 ? (row[iAlbum] || "").trim() : "",
      msPlayed: isNaN(ms) ? 0 : ms,
      skipped: iSkip >= 0 ? /true/i.test(row[iSkip]) : (isNaN(ms) ? false : ms < 30000),
      reasonEnd: iReasonEnd >= 0 ? (row[iReasonEnd] || "").trim() : "",
    });
  }
  return out;
}
