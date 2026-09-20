import { useEffect } from "react";
import { fmtINR, ordinal } from "../lib/model.js";

function CappedList({ items, formatter, cap = 40 }) {
  if (!items.length) {
    return <p className="text-inkSoft text-sm">Nothing recorded.</p>;
  }
  const shown = items.slice(0, cap);
  return (
    <>
      <ul className="list-none m-0 p-0 text-sm">
        {shown.map((it, i) => (
          <li key={i} className="py-1 border-b border-dashed border-line font-mono text-xs last:border-b-0">
            {formatter(it)}
          </li>
        ))}
      </ul>
      {items.length > cap && (
        <p className="text-inkSoft text-xs mt-1.5">
          + {items.length - cap} more not shown here.
        </p>
      )}
    </>
  );
}

export default function ChapterModal({ month, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!month) return null;
  const m = month;

  const catEntries = Object.entries(m.categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const hasDefiningDay = m.definingDay && (m.definingDay.txns.length || m.definingDay.songs.length);

  return (
    <div
      className="fixed inset-0 bg-black/55 flex items-start justify-center p-4 py-10 z-[100] overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-paper max-w-xl w-full rounded-lg relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 text-inkSoft text-2xl leading-none hover:text-ink"
        >
          &times;
        </button>
        <div className="p-7 pt-8">
          <h2 className="font-serif font-normal text-3xl mb-1">{m.name}</h2>
          <div className="font-mono text-inkSoft text-sm mb-4.5">
            {m.txns.length} purchases · {m.songs.length} tracks · mood: {m.mood}
          </div>

          <div className="font-serif text-[1.05rem] leading-relaxed bg-paperDark border-l-[3px] border-stampBlue px-4.5 py-3.5 rounded-r-md mb-5">
            {m.narrative}
          </div>

          {catEntries.length > 0 && (
            <>
              <div className="text-xs uppercase tracking-wide text-inkSoft mt-5 mb-2.5">
                Where the money went
              </div>
              {catEntries.map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-2.5 text-sm font-mono my-1.5">
                  <span className="w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">{cat}</span>
                  <span className="flex-1 bg-paperDark rounded h-2">
                    <span
                      className="block h-full bg-stampBlue rounded"
                      style={{ width: `${m.topCategoryAmt ? Math.round((amt / m.topCategoryAmt) * 100) : 0}%` }}
                    />
                  </span>
                  <span className="w-[70px] text-right text-inkSoft">{fmtINR(amt)}</span>
                </div>
              ))}
            </>
          )}

          {hasDefiningDay && (
            <>
              <div className="text-xs uppercase tracking-wide text-inkSoft mt-5 mb-2.5">
                Defining day — the {ordinal(m.definingDay.day)}
              </div>
              <div className="bg-paperDark rounded-md p-3.5">
                <div className="font-serif mb-1.5">What survives from that day</div>
                <CappedList
                  items={m.definingDay.txns.slice(0, 6)}
                  formatter={(t) => `${t.category}${t.subcategory ? " — " + t.subcategory : ""} · ${fmtINR(t.amount)}`}
                />
                <CappedList
                  items={m.definingDay.songs.slice(0, 6)}
                  formatter={(s) => `${s.track} — ${s.artist}`}
                />
              </div>
            </>
          )}

          <div className="text-xs uppercase tracking-wide text-inkSoft mt-5 mb-2.5">All purchases</div>
          <CappedList
            items={m.txns.slice().sort((a, b) => (b.date || 0) - (a.date || 0))}
            formatter={(t) => `${t.category}${t.subcategory ? " — " + t.subcategory : ""} — ${fmtINR(t.amount)}`}
          />

          <div className="text-xs uppercase tracking-wide text-inkSoft mt-5 mb-2.5">All tracks</div>
          <CappedList
            items={m.songs.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0))}
            formatter={(s) => `${s.track} — ${s.artist}`}
          />
        </div>
      </div>
    </div>
  );
}
