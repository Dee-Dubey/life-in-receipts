import { useMemo, useState } from "react";
import { MONTH_NAMES } from "../lib/csv.js";
import { fmtINR } from "../lib/model.js";

const CAP = 150;

export default function SearchView({ flatTxns, flatSongs }) {
  const [query, setQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [showTxns, setShowTxns] = useState(true);
  const [showSongs, setShowSongs] = useState(true);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = [];
    if (showTxns) {
      flatTxns.forEach((t) => {
        if (monthFilter !== "" && String(t.month) !== monthFilter) return;
        const hay = `${t.category} ${t.subcategory} ${t.note}`.toLowerCase();
        if (q && hay.indexOf(q) === -1) return;
        out.push({ kind: "txn", data: t, sortKey: t.date ? t.date.getTime() : 0 });
      });
    }
    if (showSongs) {
      flatSongs.forEach((s) => {
        if (monthFilter !== "" && String(s.month) !== monthFilter) return;
        const hay = `${s.track} ${s.artist} ${s.album}`.toLowerCase();
        if (q && hay.indexOf(q) === -1) return;
        out.push({ kind: "song", data: s, sortKey: s.ts ? s.ts.getTime() : 0 });
      });
    }
    out.sort((a, b) => b.sortKey - a.sortKey);
    return out;
  }, [query, monthFilter, showTxns, showSongs, flatTxns, flatSongs]);

  return (
    <section>
      <div className="mb-4.5">
        <h2 className="font-serif font-normal text-2xl">Search every receipt</h2>
      </div>

      <div className="flex flex-wrap gap-2.5 items-center bg-paper border border-line rounded-md p-3.5 mb-4.5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, tracks, artists, categories…"
          className="flex-1 min-w-[220px] px-3 py-2 border border-line rounded bg-paperDark text-sm"
        />
        <div className="flex gap-1.5">
          <Chip on={showTxns} onClick={() => setShowTxns((v) => !v)}>
            Purchases
          </Chip>
          <Chip on={showSongs} onClick={() => setShowSongs((v) => !v)}>
            Music
          </Chip>
        </div>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-2.5 py-2 border border-line rounded bg-paperDark text-sm"
        >
          <option value="">All months</option>
          {MONTH_NAMES.map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-line rounded-md bg-paper overflow-hidden">
        {results.length === 0 ? (
          <div className="p-6 text-center text-inkSoft text-sm">
            No receipts match — try a different word or clear the filters.
          </div>
        ) : (
          <>
            {results.slice(0, CAP).map((r, i) => (
              <div key={i} className="flex gap-3 items-baseline px-4 py-2.5 border-b border-line text-sm last:border-b-0">
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
              </div>
            ))}
            {results.length > CAP && (
              <div className="p-4 text-center text-inkSoft text-xs bg-paperDark">
                Showing {CAP} of {results.length} matches — refine your search to narrow it down.
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
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-sm ${
        on ? "bg-ink text-paper border-ink" : "bg-paperDark text-inkSoft border-line"
      }`}
    >
      {children}
    </button>
  );
}
