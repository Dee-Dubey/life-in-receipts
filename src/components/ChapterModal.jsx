import { useEffect, useMemo, useRef } from "react";
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
      {items.length > cap && <p className="text-inkSoft text-xs mt-1.5">+ {items.length - cap} more not shown here.</p>}
    </>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function ChapterModal({ month, onClose }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Dialog behaviour: move focus in, trap Tab, close on Escape, lock page scroll, restore focus on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function onKey(e) {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll(FOCUSABLE);
      if (!focusable.length) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === "function") previouslyFocused.focus();
    };
  }, []);

  const m = month;
  const catEntries = useMemo(
    () =>
      m
        ? Object.entries(m.categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
        : [],
    [m]
  );
  const sortedTxns = useMemo(() => (m ? m.txns.slice().sort((a, b) => (b.date || 0) - (a.date || 0)) : []), [m]);
  const sortedSongs = useMemo(() => (m ? m.songs.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)) : []), [m]);

  if (!m) return null;
  const hasDefiningDay = m.definingDay && (m.definingDay.txns.length || m.definingDay.songs.length);

  return (
    // Backdrop click is a mouse convenience only — keyboard users close with Escape or the Close button.
    <div
      role="presentation"
      className="fixed inset-0 bg-black/55 flex items-start justify-center p-4 py-10 z-[100] overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chapter-title"
        tabIndex={-1}
        className="bg-paper max-w-xl w-full rounded-lg relative focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chapter"
          className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center text-inkSoft text-3xl leading-none hover:text-ink"
        >
          <span aria-hidden="true">&times;</span>
        </button>
        <div className="p-7 pt-8">
          <h2 id="chapter-title" className="font-serif font-normal text-3xl mb-1 pr-10">
            {m.name}
          </h2>
          <div className="font-mono text-inkSoft text-sm mb-4.5">
            {m.txns.length} purchases · {m.songs.length} tracks · mood: {m.mood}
          </div>

          <div className="font-serif text-[1.05rem] leading-relaxed bg-paperDark border-l-[3px] border-stampBlue px-4.5 py-3.5 rounded-r-md mb-5">
            {m.narrative}
          </div>

          {catEntries.length > 0 && (
            <>
              <h3 className="text-xs uppercase tracking-wide text-inkSoft font-normal mt-5 mb-2.5">Where the money went</h3>
              {catEntries.map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-2.5 text-sm font-mono my-1.5">
                  <span className="w-[120px] overflow-hidden text-ellipsis whitespace-nowrap" title={cat}>
                    {cat}
                  </span>
                  <span className="flex-1 bg-paperDark rounded h-2" aria-hidden="true">
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
              <h3 className="text-xs uppercase tracking-wide text-inkSoft font-normal mt-5 mb-2.5">
                Defining day — the {ordinal(m.definingDay.day)}
              </h3>
              <div className="bg-paperDark rounded-md p-3.5">
                <p className="font-serif mb-1.5">What survives from that day</p>
                <CappedList
                  items={m.definingDay.txns.slice(0, 6)}
                  formatter={(t) => `${t.category}${t.subcategory ? " — " + t.subcategory : ""} · ${fmtINR(t.amount)}`}
                />
                <CappedList items={m.definingDay.songs.slice(0, 6)} formatter={(s) => `${s.track} — ${s.artist}`} />
              </div>
            </>
          )}

          <h3 className="text-xs uppercase tracking-wide text-inkSoft font-normal mt-5 mb-2.5">All purchases</h3>
          <CappedList
            items={sortedTxns}
            formatter={(t) => `${t.category}${t.subcategory ? " — " + t.subcategory : ""} — ${fmtINR(t.amount)}`}
          />

          <h3 className="text-xs uppercase tracking-wide text-inkSoft font-normal mt-5 mb-2.5">All tracks</h3>
          <CappedList items={sortedSongs} formatter={(s) => `${s.track} — ${s.artist}`} />
        </div>
      </div>
    </div>
  );
}
