import { useDeferredValue, useMemo, useState } from "react";
import { MONTH_NAMES, SEARCH_RESULT_CAP as CAP } from "../lib/constants.js";
import { fmtINR } from "../lib/model.js";

export default function SearchView({ flatTxns, flatSongs }) {
  const [query, setQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [showTxns, setShowTxns] = useState(true);
  const [showSongs, setShowSongs] = useState(true);

  // Keep typing responsive on large files: the list updates from a deferred copy of the query.
  const deferredQuery = useDeferredValue(query);

  // Build the search index ONCE per dataset (lower-cased text + sort key), newest first.
  // Filtering then just walks this array, instead of re-building strings on every keystroke.
  const index = useMemo(() => {
    const all = [];
    flatTxns.forEach((t) =>
      all.push({
        kind: "txn",
        data: t,
        month: t.month,
        hay: `${t.category} ${t.subcategory} ${t.note}`.toLowerCase(),
        sortKey: t.date ? t.date.getTime() : 0,
      }),
    );
    flatSongs.forEach((s) =>
      all.push({
        kind: "song",
        data: s,
        month: s.month,
        hay: `${s.track} ${s.artist} ${s.album}`.toLowerCase(),
        sortKey: s.ts ? s.ts.getTime() : 0,
      }),
    );
    all.sort((a, b) => b.sortKey - a.sortKey);
    return all;
  }, [flatTxns, flatSongs]);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return index.filter((r) => {
      if (r.kind === "txn" && !showTxns) return false;
      if (r.kind === "song" && !showSongs) return false;
      if (monthFilter !== "" && String(r.month) !== monthFilter) return false;
      return !q || r.hay.includes(q);
    });
  }, [index, deferredQuery, monthFilter, showTxns, showSongs]);

  return (
    <section aria-labelledby="search-heading">
      <div className="mb-4.5">
        <h1 id="search-heading" className="font-serif font-normal text-2xl">
          Search every receipt
        </h1>
      </div>

      <div
        role="search"
        className="flex flex-wrap gap-2.5 items-center bg-paper border border-line rounded-md p-3.5 mb-4.5"
      >
        <label htmlFor="search-query" className="sr-only">
          Search notes, tracks, artists and categories
        </label>
        <input
          id="search-query"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, tracks, artists, categories…"
          className="flex-1 min-w-[220px] px-3 py-2.5 border border-lineStrong rounded bg-paperDark text-sm"
        />
        <div className="flex gap-1.5" role="group" aria-label="Show">
          <Chip on={showTxns} onClick={() => setShowTxns((v) => !v)}>
            Purchases
          </Chip>
          <Chip on={showSongs} onClick={() => setShowSongs((v) => !v)}>
            Music
          </Chip>
        </div>
        <label htmlFor="search-month" className="sr-only">
          Filter by month
        </label>
        <select
          id="search-month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-2.5 py-2.5 border border-lineStrong rounded bg-paperDark text-sm"
        >
          <option value="">All months</option>
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <p role="status" className="text-inkSoft text-sm mb-2">
        {results.length.toLocaleString("en-IN")} {results.length === 1 ? "match" : "matches"}
      </p>

      <div className="border border-line rounded-md bg-paper overflow-hidden">
        {results.length === 0 ? (
          <div className="p-6 text-center text-inkSoft text-sm">
            No receipts match — try a different word or clear the filters.
          </div>
        ) : (
          <>
            <ul className="list-none m-0 p-0">
              {results.slice(0, CAP).map((r, i) => (
                <li
                  key={i}
                  className="flex gap-3 items-baseline px-4 py-2.5 border-b border-line text-sm last:border-b-0"
                >
                  {r.kind === "txn" ? (
                    <>
                      <span className="font-mono text-[0.68rem] px-1.5 py-0.5 rounded bg-paperDark text-inkSoft whitespace-nowrap">
                        PURCHASE
                      </span>
                      <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                        {r.data.category}
                        {r.data.subcategory ? ` — ${r.data.subcategory}` : ""}
                        {r.data.note ? ` · ${r.data.note}` : ""}
                      </span>
                      <span className="font-mono text-inkSoft whitespace-nowrap">{fmtINR(r.data.amount)}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-[0.68rem] px-1.5 py-0.5 rounded bg-paperDark text-inkSoft whitespace-nowrap">
                        TRACK
                      </span>
                      <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                        {r.data.track} — {r.data.artist}
                      </span>
                      <span className="font-mono text-inkSoft whitespace-nowrap">
                        {r.data.ts ? MONTH_NAMES[r.data.ts.getMonth()].slice(0, 3) : ""}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {results.length > CAP && (
              <div className="p-4 text-center text-inkSoft text-xs bg-paperDark">
                Showing {CAP} of {results.length.toLocaleString("en-IN")} matches — refine your search to narrow it
                down.
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Chip({ on, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`px-3.5 py-2.5 min-h-[44px] rounded-full border text-sm ${
        on ? "bg-ink text-paper border-ink" : "bg-paperDark text-inkSoft border-lineStrong"
      }`}
    >
      {children}
    </button>
  );
}
