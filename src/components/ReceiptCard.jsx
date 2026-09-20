import { fmtINR } from "../lib/model.js";

export default function ReceiptCard({ month, onOpen }) {
  const m = month;
  return (
    <button
      onClick={onOpen}
      className="text-left w-full font-mono text-[0.82rem] bg-paper transition-transform hover:-translate-y-0.5"
    >
      <div className="receipt-edge" />
      <div className="px-[18px] pt-4 pb-[18px]">
        <div className="text-center uppercase tracking-wide text-[0.72rem] text-inkSoft mb-0.5">
          A Life, Itemised
        </div>
        <div className="text-center font-serif text-[1.15rem] mb-2.5">{m.name}</div>
        <div className="border-t border-dashed border-line my-2.5" />

        <Line label="SPENT" value={fmtINR(m.totalSpent)} />
        {m.topCategory && <Line label="TOP CATEGORY" value={m.topCategory} />}
        {m.topTrack && <Line label="TOP TRACK" value={m.topTrack} />}
        {m.topArtist && <Line label="TOP ARTIST" value={m.topArtist} />}
        <Line label="RECEIPTS" value={`${m.txns.length + m.songs.length} items`} />

        <div className="border-t border-dashed border-line my-2.5" />
        <div className="text-center">
          <span className="inline-block px-2.5 py-1 rounded-full text-[0.68rem] bg-paperDark border border-line">
            {m.mood}
          </span>
        </div>
        <div className="text-center text-[0.68rem] text-inkSoft mt-3">TAP FOR FULL MONTH</div>
      </div>
      <div className="receipt-edge-bottom" />
    </button>
  );
}

function Line({ label, value }) {
  return (
    <div className="line-item">
      <span className="whitespace-nowrap text-inkSoft">{label}</span>
      <span className="filler" />
      <span className="whitespace-nowrap text-right max-w-[56%] overflow-hidden text-ellipsis">
        {value}
      </span>
    </div>
  );
}
