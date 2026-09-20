import ReceiptCard from "./ReceiptCard.jsx";

export default function ChaptersView({ months, onOpenMonth }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4.5">
        <h2 className="font-serif font-normal text-2xl">Twelve chapters</h2>
        <p className="text-inkSoft text-sm">Click any receipt to open the full month.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {months.map((m) => (
          <ReceiptCard key={m.index} month={m} onOpen={() => onOpenMonth(m.index)} />
        ))}
      </div>
    </section>
  );
}
