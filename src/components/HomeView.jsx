import { useRef } from "react";
import { fmtINR } from "../lib/model.js";

export default function HomeView({ months, flatTxns, flatSongs, status, onBuildFromFiles, onLoadDemo }) {
  const householdRef = useRef(null);
  const spotifyRef = useRef(null);

  const totalSpent = months.reduce((a, m) => a + m.totalSpent, 0);
  const activeMonths = months.filter((m) => m.txns.length || m.songs.length).length;

  function handleBuild() {
    const hFile = householdRef.current?.files?.[0] || null;
    const sFile = spotifyRef.current?.files?.[0] || null;
    onBuildFromFiles(hFile, sFile);
  }

  return (
    <section>
      <div className="pt-7 pb-2">
        <h1 className="font-serif font-normal text-[clamp(2.1rem,5vw,3.4rem)] leading-[1.05] max-w-[15ch] mb-3.5">
          Two receipts don't tell you much. Twelve months of them do.
        </h1>
        <p className="max-w-[56ch] text-inkSoft text-[1.05rem] mb-6">
          This reads a year of household spending and a year of Spotify streams side by side —
          not as two spreadsheets, but as twelve chapters of one life. Every month gets its own
          receipt: what was bought, what was played, and the one day the two lined up.
        </p>
      </div>

      <div className="bg-paper border border-line rounded-md p-5 mb-9">
        <h2 className="text-[0.78rem] uppercase tracking-wide text-inkSoft font-semibold mb-3">
          Load your data
        </h2>
        <div className="flex flex-wrap gap-3.5 mb-2.5">
          <div className="flex-1 min-w-[220px] flex flex-col gap-1">
            <label className="text-sm text-inkSoft" htmlFor="file-household">
              Household transactions CSV
            </label>
            <input
              id="file-household"
              ref={householdRef}
              type="file"
              accept=".csv"
              className="text-sm bg-paperDark border border-dashed border-line rounded p-2"
            />
          </div>
          <div className="flex-1 min-w-[220px] flex flex-col gap-1">
            <label className="text-sm text-inkSoft" htmlFor="file-spotify">
              Spotify history CSV
            </label>
            <input
              id="file-spotify"
              ref={spotifyRef}
              type="file"
              accept=".csv"
              className="text-sm bg-paperDark border border-dashed border-line rounded p-2"
            />
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleBuild}
            className="px-4.5 py-2.5 rounded border border-ink bg-ink text-paper text-sm hover:bg-black"
          >
            Build my story
          </button>
          <button
            onClick={onLoadDemo}
            className="px-4.5 py-2.5 rounded border border-ink text-ink text-sm hover:bg-paperDark"
          >
            Use demo data instead
          </button>
        </div>
        <div className="font-mono text-xs text-inkSoft mt-2">{status}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line rounded-md overflow-hidden mb-10">
        <Stat num={fmtINR(totalSpent)} label="total spent, all months" />
        <Stat num={flatTxns.length.toLocaleString("en-IN")} label="purchases logged" />
        <Stat num={flatSongs.length.toLocaleString("en-IN")} label="tracks played" />
        <Stat num={`${activeMonths} / 12`} label="months with a story" />
      </div>

      <div className="mb-4">
        <h2 className="font-serif font-normal text-2xl mb-2">How to read this</h2>
        <p className="text-inkSoft max-w-[64ch]">
          Real dates rarely line up across two unrelated datasets, so instead of forcing a false
          day-by-day match, every record here is grouped by <b className="text-ink">month of the
          year</b> — all Septembers together, all Julys together — the way a life actually
          repeats itself. Inside each month, the single busiest day (by combined activity)
          becomes that chapter's "defining day": the closest thing to a moment where a purchase
          and a song actually happened together.
        </p>
      </div>
    </section>
  );
}

function Stat({ num, label }) {
  return (
    <div className="bg-paper px-3.5 py-4">
      <div className="font-serif text-2xl">{num}</div>
      <div className="text-[0.72rem] uppercase tracking-wide text-inkSoft mt-0.5">{label}</div>
    </div>
  );
}
