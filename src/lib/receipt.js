import { fmtINR } from "./model.js";

/** @typedef {import("./types.js").Month} Month */

const WIDTH = 34;

/** "LABEL ........ value" padded to a fixed width, like a thermal-printer line item. */
function lineItem(label, value) {
  const dots = Math.max(2, WIDTH - label.length - String(value).length - 2);
  return `${label} ${".".repeat(dots)} ${value}`;
}

/** Greedy word-wrap to the receipt width. */
function wrap(text, width = WIDTH) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + " " + word).length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * A month as plain monospace text — something a person can paste into a chat or a note.
 * @param {Month} month
 * @returns {string}
 */
export function receiptText(month) {
  const rule = "-".repeat(WIDTH);
  const lines = ["YOUR LIFE, IN RECEIPTS", "=".repeat(WIDTH), month.name.toUpperCase(), rule];
  lines.push(lineItem("SPENT", fmtINR(month.totalSpent)));
  if (month.topCategory) lines.push(lineItem("TOP CATEGORY", month.topCategory));
  if (month.topTrack) lines.push(lineItem("TOP TRACK", month.topTrack));
  if (month.topArtist) lines.push(lineItem("TOP ARTIST", month.topArtist));
  lines.push(lineItem("RECEIPTS", `${month.txns.length + month.songs.length} items`));
  lines.push(rule, `MOOD: ${month.mood.toUpperCase()}`, "", ...wrap(month.narrative), "", "=".repeat(WIDTH));
  return lines.join("\n");
}
