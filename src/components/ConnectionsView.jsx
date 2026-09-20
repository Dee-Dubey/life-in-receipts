import { useMemo } from "react";
import { correlation, fmtINR, ordinal } from "../lib/model.js";

export default function ConnectionsView({ months, flatTxns, flatSongs, onOpenMonth }) {
  // useMemo now depends on `months` (stable) — the old code rebuilt these arrays every render,
  // which made its useMemo useless.
  const xs = useMemo(() => months.map((m) => m.totalSpent), [months]);
  const ys = useMemo(() => months.map((m) => m.lateNightFraction), [months]);
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
    <section aria-labelledby="connections-heading">
      <div className="mb-4.5">
        <h1 id="connections-heading" className="font-serif font-normal text-2xl">
          Where the patterns show up
        </h1>
      </div>

      <div className="bg-paper border border-line rounded-md p-5 mb-5">
        <h2 className="font-serif text-lg mb-2">Spending vs. late-night listening</h2>
        <p className="text-inkSoft text-sm">{corrText}</p>

        {/* Visual bars are decorative for assistive tech; the same numbers are in the table below. */}
        <div className="mt-3.5 space-y-2" aria-hidden="true">
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

        <table className="sr-only">
          <caption>Monthly spend and share of late-night listening</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Spent</th>
              <th scope="col">Late-night listening share</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.index}>
                <th scope="row">{m.name}</th>
                <td>{fmtINR(m.totalSpent)}</td>
                <td>{Math.round(m.lateNightFraction * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-wrap gap-x-4.5 gap-y-1 text-xs text-inkSoft mt-2.5">
          <span className="inline-flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full inline-block bg-stampBlue" aria-hidden="true" /> monthly spend (left bar)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full inline-block bg-stampRed" aria-hidden="true" /> late-night listening
            share (right bar)
          </span>
        </div>
      </div>

      <div className="mb-4.5 mt-8">
        <h2 className="font-serif font-normal text-2xl">Defining days</h2>
        <p className="text-inkSoft text-sm">The busiest crossover day in each chapter — jump straight in.</p>
      </div>
      <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {definingDays.map((m) => (
          <li key={m.index}>
            {/* was a <div onClick>: not reachable by keyboard. A real button fixes that. */}
            <button
              type="button"
              onClick={() => onOpenMonth(m.index)}
              className="block w-full text-left bg-paper border border-lineStrong rounded-md p-3.5 hover:border-ink"
            >
              <span className="block font-serif text-base mb-1">
                {m.name} {ordinal(m.definingDay.day)}
              </span>
              <span className="block text-inkSoft text-sm">
                {m.definingDay.txns.length} purchases · {m.definingDay.songs.length} tracks
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
