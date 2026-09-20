import { useMemo } from "react";
import { correlation, ordinal } from "../lib/model.js";

export default function ConnectionsView({ months, flatTxns, flatSongs, onOpenMonth }) {
  const xs = months.map((m) => m.totalSpent);
  const ys = months.map((m) => m.lateNightFraction);
  const r = useMemo(() => correlation(xs, ys), [xs, ys]);
  const maxSpend = Math.max(...xs, 1);

  let corrText;
  if (flatSongs.length < 3 || flatTxns.length < 3) {
    corrText = "Load more data to compute a meaningful correlation.";
  } else if (r > 0.35) {
    corrText = `Months with higher spending also tend to have more late-night listening (r = ${r.toFixed(
      2
    )}). Money and midnight seem to move together.`;
  } else if (r < -0.35) {
    corrText = `Months with higher spending tend to have less late-night listening (r = ${r.toFixed(
      2
    )}) — the busy, high-spend months look like early-to-bed months.`;
  } else {
    corrText = `No strong link between monthly spend and late-night listening this year (r = ${r.toFixed(
      2
    )}) — the two rhythms move mostly on their own.`;
  }

  const definingDays = months.filter((m) => m.definingDay);

  return (
    <section>
      <div className="mb-4.5">
        <h2 className="font-serif font-normal text-2xl">Where the patterns show up</h2>
      </div>

      <div className="bg-paper border border-line rounded-md p-5 mb-5">
        <h3 className="font-serif text-lg mb-2">Spending vs. late-night listening</h3>
        <p className="text-inkSoft text-sm">{corrText}</p>

        <div className="mt-3.5 space-y-2">
          {months.map((m) => {
            const spendPct = maxSpend ? Math.round((m.totalSpent / maxSpend) * 100) : 0;
            const nightPct = Math.round(m.lateNightFraction * 100);
            return (
              <div key={m.index} className="flex items-center gap-2.5 text-sm">
                <span className="w-9 font-mono text-inkSoft">{m.name.slice(0, 3)}</span>
                <span className="flex-1 bg-paperDark rounded h-2.5 overflow-hidden">
                  <span className="block h-full bg-stampBlue rounded" style={{ width: `${spendPct}%` }} />
                </span>
                <span className="flex-1 bg-paperDark rounded h-2.5 overflow-hidden">
                  <span className="block h-full bg-stampRed rounded" style={{ width: `${nightPct}%` }} />
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4.5 text-xs text-inkSoft mt-2.5">
          <span className="inline-flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full inline-block bg-stampBlue" /> monthly spend
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full inline-block bg-stampRed" /> late-night listening share
          </span>
        </div>
      </div>

      <div className="mb-4.5 mt-8">
        <h2 className="font-serif font-normal text-2xl">Defining days</h2>
        <p className="text-inkSoft text-sm">The busiest crossover day in each chapter — jump straight in.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {definingDays.map((m) => (
          <div
            key={m.index}
            onClick={() => onOpenMonth(m.index)}
            className="bg-paper border border-line rounded-md p-3.5 cursor-pointer hover:border-ink"
          >
            <div className="font-serif text-base mb-1">
              {m.name} {ordinal(m.definingDay.day)}
            </div>
            <div className="text-inkSoft text-sm">
              {m.definingDay.txns.length} purchases · {m.definingDay.songs.length} tracks
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
