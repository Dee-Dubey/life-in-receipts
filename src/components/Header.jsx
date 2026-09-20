const TABS = [
  { id: "home", label: "Home" },
  { id: "chapters", label: "Chapters" },
  { id: "search", label: "Search" },
  { id: "connections", label: "Connections" },
];

export default function Header({ view, setView }) {
  return (
    <header className="sticky top-0 z-40 bg-canvas border-b border-line">
      <div className="max-w-4xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
        <div className="font-serif italic text-xl">
          <b className="not-italic">Your Life,</b> in Receipts
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                view === t.id
                  ? "bg-ink text-paper"
                  : "text-inkSoft hover:bg-paperDark"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
