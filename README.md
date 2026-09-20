# Your Life, In Receipts — React + Vite + Tailwind

Same concept as the plain-HTML version, rebuilt as a proper Vite/React/Tailwind project.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

To ship a static build (for Netlify/Vercel/GitHub Pages):

```bash
npm run build
```

Output goes to `dist/` — deploy that folder as-is, no server/backend needed.

## What's real and what's demo

The app loads with **generated placeholder data** (see `src/lib/demoData.js`) purely so the UI
is never empty. It is not your real dataset — go to the Home tab, upload your actual
`Daily Household Transactions` CSV and your actual Spotify history CSV, then click
**Build my story**. Everything (chapters, search, correlation) recomputes from whatever you
uploaded.

Expected columns (case-insensitive, extra/missing columns tolerated):
- **Household CSV**: `Date` (`DD/MM/YYYY`), `Category`, `Subcategory`, `Note`, `Amount`,
  `Income/Expense`
- **Spotify CSV**: `ts` (`M/D/YYYY H:MM`), `track_name`, `artist_name`, `album_name`,
  `ms_played`, `skipped`

## Structure

```
src/
  lib/
    csv.js        — CSV parsing + date parsing for both formats
    demoData.js    — synthetic placeholder generator
    model.js       — groups records into 12 month "chapters", computes mood/narrative/
                     correlation/defining-day
  components/
    Header.jsx
    HomeView.jsx
    ChaptersView.jsx / ReceiptCard.jsx
    ChapterModal.jsx
    SearchView.jsx
    ConnectionsView.jsx
  App.jsx          — state + routing between the four tabs
```

## Design notes

Records are grouped by **month of the year**, not exact calendar date, since two independent
datasets rarely share real overlapping dates. Within each month, the busiest single
day-of-month (by combined purchase + track count) becomes that month's "defining day" — the
closest thing to a real crossover moment between the two datasets.

The whole UI is styled as literal paper receipts — dotted line-item leaders, a torn perforated
edge (CSS gradient trick in `src/index.css`), monospace for "printed" data — because the brief's
own title, *In Receipts*, is the subject matter. The one human-voiced sentence per month (the
narrative) is set in a serif face to separate "what was counted" from "what it means."

Performance: parsing and aggregation are plain loops, fine for tens of thousands of rows.
Rendered lists inside a month and in search are capped (40 / 150 rows) with a "+N more" note so
the DOM stays fast even on very large files — totals and counts always reflect the full dataset.
