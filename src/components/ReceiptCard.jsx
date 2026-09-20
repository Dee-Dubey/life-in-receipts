import { fmtINR } from "../lib/model.js";

export default function ReceiptCard({ month, onOpen }) {
  const m = month;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${m.name}: ${fmtINR(m.totalSpent)} spent, ${m.txns.length} purchases, ${m.songs.length} tracks, mood ${m.mood}`}
      className="block text-left w-full font-mono text-[0.82rem] bg-paper transition-transform hover:-translate-y-0.5"
    >
      {/* only phrasing content is valid inside <button>, so spans (display:block) instead of divs */}
      <span className="receipt-edge block" aria-hidden="true" />
      <span className="block px-[18px] pt-4 pb-[18px]">
        <span className="block text-center uppercase tracking-wide text-[0.72rem] text-inkSoft mb-0.5">
          A Life, Itemised
        </span>
        <span className="block text-center font-serif text-[1.15rem] mb-2.5">{m.name}</span>
        <span className="block border-t border-dashed border-line my-2.5" aria-hidden="true" />

        <Line label="SPENT" value={fmtINR(m.totalSpent)} />
        {m.topCategory && <Line label="TOP CATEGORY" value={m.topCategory} />}
        {m.topTrack && <Line label="TOP TRACK" value={m.topTrack} />}
        {m.topArtist && <Line label="TOP ARTIST" value={m.topArtist} />}
        <Line label="RECEIPTS" value={`${m.txns.length + m.songs.length} items`} />

        <span className="block border-t border-dashed border-line my-2.5" aria-hidden="true" />
        <span className="block text-center">
          <span className="inline-block px-2.5 py-1 rounded-full text-[0.68rem] bg-paperDark border border-line">
            {m.mood}
          </span>
        </span>
        <span className="block text-center text-[0.68rem] text-inkSoft mt-3">TAP FOR FULL MONTH</span>
      </span>
      <span className="receipt-edge-bottom block" aria-hidden="true" />
    </button>
  );
}

function Line({ label, value }) {
  return (
    <span className="line-item">
      <span className="whitespace-nowrap text-inkSoft">{label}</span>
      <span className="filler" aria-hidden="true" />
      <span className="whitespace-nowrap text-right max-w-[56%] overflow-hidden text-ellipsis">{value}</span>
    </span>
  );
}
