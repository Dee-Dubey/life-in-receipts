import ReceiptCard from "./ReceiptCard.jsx";

export default function ChaptersView({ months, onOpenMonth }) {
  return (
    <section aria-labelledby="chapters-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 mb-4.5">
        <h1 id="chapters-heading" className="font-serif font-normal text-2xl">
          Twelve chapters
        </h1>
        <p className="text-inkSoft text-sm">Select any receipt to open the full month.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {months.map((m) => (
          <ReceiptCard key={m.index} month={m} onOpen={() => onOpenMonth(m.index)} />
        ))}
      </div>
    </section>
  );
}
