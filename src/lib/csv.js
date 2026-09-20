import { SKIP_THRESHOLD_MS } from "./constants.js";

/** @typedef {import("./types.js").Transaction} Transaction */
/** @typedef {import("./types.js").Song} Song */

/**
 * Minimal RFC 4180-style CSV parser: quoted fields, embedded commas/newlines, escaped quotes, CRLF and a
 * leading UTF-8 BOM (which Excel/Kaggle exports often add and which would otherwise corrupt the first header).
 * @param {string} input raw file text
 * @returns {string[][]} rows of cells; blank lines are dropped
 */
export function parseCSV(input) {
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
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ""));
}

/** Index of the first header that matches any of `names`, or -1. */
function colIndex(header, names) {
  for (const n of names) {
    const idx = header.indexOf(n);
    if (idx >= 0) return idx;
  }
  return -1;
}

/** Trimmed cell value, or `fallback` when the column is absent or empty. */
function cell(row, index, fallback = "") {
  return index >= 0 ? (row[index] || fallback).trim() : fallback;
}

/** Lower-cased, trimmed header row. */
function readHeader(rows) {
  return rows[0].map((h) => h.trim().toLowerCase());
}

/**
 * Parses "A/B/YYYY [HH:MM[:SS]]". `dayFirst` says whether A is the day (DD/MM) or the month (MM/DD).
 * @returns {Date|null} null when the text is not a usable date
 */
function parseSlashDate(str, dayFirst) {
  if (!str) return null;
  const [datePart, timePart] = str.trim().split(" ");
  const parts = datePart.split("/");
  if (parts.length < 3) return null;
  const [first, second, year] = parts.map((p) => parseInt(p, 10));
  const day = dayFirst ? first : second;
  const month = dayFirst ? second : first;
  if (!day || !month || !year) return null;
  const [hh = 0, mm = 0, ss = 0] = timePart ? timePart.split(":").map((p) => parseInt(p, 10) || 0) : [];
  return new Date(year, month - 1, day, hh, mm, ss);
}

/** "20/09/2018 12:04:08" — day-month-year, as in the household dataset. */
export const parseDMY = (str) => parseSlashDate(str, true);

/** "7/8/2013 2:44" — month-day-year, as in the Spotify dataset. */
export const parseMDY = (str) => parseSlashDate(str, false);

/** "2013-07-08 02:44:34" or "2013-07-08T02:44:34Z" — ISO-like, used by some Spotify exports. */
export function parseISO(str) {
  if (!str) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(str.trim());
  if (!m) return null;
  const [, yr, mon, day, hh = "0", mm = "0", ss = "0"] = m;
  if (!Number(mon) || !Number(day)) return null;
  return new Date(Number(yr), Number(mon) - 1, Number(day), Number(hh), Number(mm), Number(ss));
}

/** Spotify timestamps can be "M/D/YYYY H:MM" or ISO — accept both. */
export function parseSpotifyDate(str) {
  if (!str) return null;
  return /^\d{4}-/.test(str.trim()) ? parseISO(str) : parseMDY(str);
}

/**
 * Household transactions → normalised records. Rows without a numeric amount are skipped.
 * Column names are matched case-insensitively; missing optional columns are tolerated.
 * @param {string} text raw CSV text
 * @returns {Transaction[]}
 */
export function parseHouseholdCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const header = readHeader(rows);
  const iDate = colIndex(header, ["date"]);
  const iCategory = colIndex(header, ["category"]);
  const iSub = colIndex(header, ["subcategory"]);
  const iNote = colIndex(header, ["note"]);
  const iAmount = colIndex(header, ["amount"]);
  const iType = colIndex(header, ["income/expense", "type"]);

  const out = [];
  for (const row of rows.slice(1)) {
    if (row.length < 2) continue;
    const amount = iAmount >= 0 ? parseFloat(row[iAmount]) : NaN;
    if (Number.isNaN(amount)) continue;
    const date = iDate >= 0 ? parseDMY(row[iDate]) : null;
    out.push({
      date,
      month: date ? date.getMonth() : null,
      category: cell(row, iCategory, "Other") || "Other",
      subcategory: cell(row, iSub),
      note: cell(row, iNote),
      amount: Math.abs(amount),
      type: cell(row, iType, "Expense"),
    });
  }
  return out;
}

/**
 * Spotify history → normalised records. Rows without a track name are skipped.
 * `skipped` comes from the CSV when present, otherwise it is inferred from how long the track played.
 * @param {string} text raw CSV text
 * @returns {Song[]}
 */
export function parseSpotifyCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const header = readHeader(rows);
  const iTs = colIndex(header, ["ts"]);
  const iTrack = colIndex(header, ["track_name", "track"]);
  const iArtist = colIndex(header, ["artist_name", "artist"]);
  const iAlbum = colIndex(header, ["album_name", "album"]);
  const iMs = colIndex(header, ["ms_played"]);
  const iSkip = colIndex(header, ["skipped"]);

  const out = [];
  for (const row of rows.slice(1)) {
    if (row.length < 2) continue;
    const track = cell(row, iTrack);
    if (!track) continue;
    const ts = iTs >= 0 ? parseSpotifyDate(row[iTs]) : null;
    const ms = iMs >= 0 ? parseFloat(row[iMs]) : 0;
    const msPlayed = Number.isNaN(ms) ? 0 : ms;
    out.push({
      ts,
      month: ts ? ts.getMonth() : null,
      track,
      artist: cell(row, iArtist, "Unknown Artist"),
      album: cell(row, iAlbum),
      msPlayed,
      skipped: iSkip >= 0 ? /true/i.test(row[iSkip]) : msPlayed < SKIP_THRESHOLD_MS,
    });
  }
  return out;
}
