import { useEffect, useMemo, useRef, useState } from "react";
import CappedList from "./CappedList.jsx";
import { useDialog } from "../hooks/useDialog.js";
import { CATEGORY_BARS_SHOWN, DEFINING_DAY_LIST_CAP, MONTH_NAMES } from "../lib/constants.js";
import { fmtINR, ordinal } from "../lib/model.js";
import { receiptText } from "../lib/receipt.js";

const SECTION_HEADING = "text-xs uppercase tracking-wide text-inkSoft font-normal mt-5 mb-2.5";
const ACTION_BUTTON =
  "px-3.5 py-2 min-h-[44px] rounded border border-lineStrong bg-paperDark text-sm text-ink hover:border-ink";

const formatTxn = (t) => `${t.category}${t.subcategory ? " — " + t.subcategory : ""} — ${fmtINR(t.amount)}`;
const formatSong = (s) => `${s.track} — ${s.artist}`;

function CategoryBars({ month }) {
  const entries = useMemo(
    () =>
      Object.entries(month.categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, CATEGORY_BARS_SHOWN),
    [month],
  );
  if (!entries.length) return null;
  return (
    <>
      <h3 className={SECTION_HEADING}>Where the money went</h3>
      {entries.map(([cat, amt]) => (
        <div key={cat} className="flex items-center gap-2.5 text-sm font-mono my-1.5">
          <span className="w-[120px] overflow-hidden text-ellipsis whitespace-nowrap" title={cat}>
            {cat}
          </span>
          <span className="flex-1 bg-paperDark rounded h-2" aria-hidden="true">
            <span
              className="block h-full bg-stampBlue rounded"
              style={{ width: `${month.topCategoryAmt ? Math.round((amt / month.topCategoryAmt) * 100) : 0}%` }}
            />
          </span>
          <span className="w-[70px] text-right text-inkSoft">{fmtINR(amt)}</span>
        </div>
      ))}
    </>
  );
}

function DefiningDay({ day }) {
  if (!day || !(day.txns.length || day.songs.length)) return null;
  return (
    <>
      <h3 className={SECTION_HEADING}>Defining day — the {ordinal(day.day)}</h3>
      <div className="bg-paperDark rounded-md p-3.5">
        <p className="font-serif mb-1.5">What survives from that day</p>
        <CappedList
          items={day.txns.slice(0, DEFINING_DAY_LIST_CAP)}
          formatter={(t) => `${t.category}${t.subcategory ? " — " + t.subcategory : ""} · ${fmtINR(t.amount)}`}
        />
        <CappedList items={day.songs.slice(0, DEFINING_DAY_LIST_CAP)} formatter={formatSong} />
      </div>
    </>
  );
}

/**
 * Full view of one month. `onPrev` / `onNext` step through the twelve chapters (buttons or ← → keys);
 * "Copy as text" puts a plain-text receipt on the clipboard.
 */
export default function ChapterModal({ month: m, onClose, onPrev, onNext }) {
  const dialogRef = useDialog(onClose);
  const backdropRef = useRef(null);
  const [copyMessage, setCopyMessage] = useState("");

  const sortedTxns = useMemo(() => m.txns.slice().sort((a, b) => (b.date || 0) - (a.date || 0)), [m]);
  const sortedSongs = useMemo(() => m.songs.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)), [m]);

  // ← / → move between chapters, and each new chapter starts at the top.
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onPrev, onNext]);

  useEffect(() => {
    if (backdropRef.current) backdropRef.current.scrollTop = 0;
    setCopyMessage("");
  }, [m.index]);

  async function copyReceipt() {
    try {
      await navigator.clipboard.writeText(receiptText(m));
      setCopyMessage(`${m.name} receipt copied to the clipboard.`);
    } catch {
      setCopyMessage("Copying isn't available in this browser.");
    }
  }

  const prevName = MONTH_NAMES[(m.index + 11) % 12];
  const nextName = MONTH_NAMES[(m.index + 1) % 12];

  return (
    // Backdrop click is a mouse convenience only — keyboard users close with Escape or the Close button.
    <div
      ref={backdropRef}
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
          <div className="font-mono text-inkSoft text-sm mb-3">
            {m.txns.length} purchases · {m.songs.length} tracks · mood: {m.mood}
          </div>

          <div className="flex flex-wrap gap-2 mb-4.5">
            <button type="button" onClick={onPrev} className={ACTION_BUTTON}>
              <span aria-hidden="true">← </span>
              {prevName}
            </button>
            <button type="button" onClick={onNext} className={ACTION_BUTTON}>
              {nextName}
              <span aria-hidden="true"> →</span>
            </button>
            <button type="button" onClick={copyReceipt} className={ACTION_BUTTON}>
              Copy as text
            </button>
          </div>
          <p role="status" className="sr-only">
            {copyMessage || `Showing ${m.name}`}
          </p>
          {copyMessage && <p className="text-xs text-inkSoft -mt-2.5 mb-3">{copyMessage}</p>}

          <div className="font-serif text-[1.05rem] leading-relaxed bg-paperDark border-l-[3px] border-stampBlue px-4.5 py-3.5 rounded-r-md mb-5">
            {m.narrative}
          </div>

          <CategoryBars month={m} />
          <DefiningDay day={m.definingDay} />

          <h3 className={SECTION_HEADING}>All purchases</h3>
          <CappedList items={sortedTxns} formatter={formatTxn} />

          <h3 className={SECTION_HEADING}>All tracks</h3>
          <CappedList items={sortedSongs} formatter={formatSong} />
        </div>
      </div>
    </div>
  );
}
