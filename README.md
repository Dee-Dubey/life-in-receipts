# Your Life, In Receipts

A year of household spending and a year of Spotify listening, read side by side and turned into
**twelve monthly receipts** — what was bought, what was played, and the one day the two lined up.

Frontend-only (React + Vite + Tailwind). No backend, no database, no API calls: everything is
parsed and computed in the browser.

- **Live demo:** https://life-in-receipts-ten.vercel.app/
- **Repository:** https://github.com/dee-dubey/life-in-receipts

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run check      # lint + tests + production build in one go
npm run build      # static output in dist/ — deploy that folder as-is
```

Requires Node 18+ (`.nvmrc` pins 20).

## Using the challenge dataset

Copy the organizer-provided CSVs into `public/data/` with these names:

```
public/data/household.csv   # Daily Household Transactions
public/data/spotify.csv     # Spotify listening history
```

They are fetched as static files on start-up. If neither file exists the app falls back to
clearly-labelled generated sample data (the Home screen states which source is active). Visitors can
also upload their own CSVs at any time from the Home tab.

Expected columns (case-insensitive; extra or missing columns are tolerated):

| File      | Columns |
|-----------|---------|
| Household | `Date` (`DD/MM/YYYY [HH:MM:SS]`), `Category`, `Subcategory`, `Note`, `Amount`, `Income/Expense` |
| Spotify   | `ts` (`M/D/YYYY H:MM` **or** ISO `YYYY-MM-DD HH:MM:SS`), `track_name`, `artist_name`, `album_name`, `ms_played`, `skipped` |

A UTF-8 BOM, quoted fields and embedded commas are handled.

## Features

- **Home** — load data, see totals, understand how the grouping works.
- **Chapters** — twelve receipt cards (spend, top category / track / artist, mood).
- **Chapter dialog** — narrative sentence, category breakdown, "defining day", full purchase and track lists.
- **Search** — one box across purchases and tracks, with type and month filters.
- **Connections** — monthly spend vs. late-night listening (Pearson *r*) and jump links to each defining day.

## How the two datasets are joined

Two independent datasets rarely share real calendar dates, so records are grouped by **month of the
year**. Within each month the busiest day-of-month (by combined purchase + track count) becomes that
chapter's "defining day".

## Accessibility

- Semantic landmarks, skip link, one `h1` per view, `aria-current` on the active tab.
- Chapter dialog: `role="dialog"`, focus moves in, Tab is trapped, Escape closes, focus returns to the trigger, page scroll locked.
- Every control is a real `<button>` / labelled form control; toggle chips use `aria-pressed`.
- Status messages and search result counts are announced (`role="status"`).
- The spend / late-night chart has an equivalent data table for screen readers.
- Text colours meet WCAG AA (`inkSoft` on the canvas background is 5.0 : 1; form-control borders ≥ 3 : 1).
- Visible focus ring, 44 px touch targets, `prefers-reduced-motion` respected.
- Automated: `axe-core` runs against every view and the dialog in `npm test`; `eslint-plugin-jsx-a11y` runs in `npm run lint`.

## Performance

- Plain-loop parsing; the search index (lower-cased text + sort key) is built once per dataset and
  typing uses `useDeferredValue`, so filtering stays responsive on very large files.
- Rendered lists are capped (40 rows per list in the dialog, 150 in search) with a "+N more" note;
  totals always reflect the full dataset.
- No web fonts, no images, no third-party runtime requests. Production JS ≈ 56 kB gzipped.

## Project structure

```
public/data/          challenge CSVs go here (household.csv, spotify.csv)
src/
  App.jsx             state, data loading, tab switching
  lib/csv.js          CSV + date parsing for both formats
  lib/dataSource.js   loads the bundled CSVs from public/data
  lib/demoData.js     seeded, deterministic sample-data generator
  lib/model.js        month grouping, mood, narrative, correlation, defining day
  components/         Header, HomeView, ChaptersView, ReceiptCard, ChapterModal,
                      SearchView, ConnectionsView, ErrorBoundary
tests/                Vitest unit tests + axe accessibility tests
.github/workflows/    CI: lint, test, build
```

## Deploying

`vite.config.js` sets `base: "./"`, so the `dist/` folder works on Netlify, Vercel and GitHub Pages
(including sub-paths) with no extra configuration. Build command: `npm run build`, output
directory: `dist`. The live demo above is deployed on Vercel.