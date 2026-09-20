import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import HomeView from "./components/HomeView.jsx";
import ChaptersView from "./components/ChaptersView.jsx";
import SearchView from "./components/SearchView.jsx";
import ConnectionsView from "./components/ConnectionsView.jsx";
import ChapterModal from "./components/ChapterModal.jsx";
import { useDataset } from "./hooks/useDataset.js";
import { buildModel } from "./lib/model.js";

const VIEW_TITLES = {
  home: "Your Life, In Receipts",
  chapters: "Chapters — Your Life, In Receipts",
  search: "Search — Your Life, In Receipts",
  connections: "Connections — Your Life, In Receipts",
};

export default function App() {
  const [view, setView] = useState("home");
  const [activeMonth, setActiveMonth] = useState(null);
  const { household, spotify, source, loading, status, loadSample, loadFiles } = useDataset();

  const months = useMemo(() => buildModel(household, spotify), [household, spotify]);

  useEffect(() => {
    document.title = VIEW_TITLES[view] || VIEW_TITLES.home;
  }, [view]);

  const closeModal = useCallback(() => setActiveMonth(null), []);
  const showPrevMonth = useCallback(() => setActiveMonth((i) => (i + 11) % 12), []);
  const showNextMonth = useCallback(() => setActiveMonth((i) => (i + 1) % 12), []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-ink focus:text-paper focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to content
      </a>
      <Header view={view} setView={setView} />
      <main id="main" tabIndex={-1} className="max-w-4xl mx-auto px-5 py-8 pb-20 focus:outline-none">
        {view === "home" && (
          <HomeView
            months={months}
            flatTxns={household}
            flatSongs={spotify}
            status={status}
            source={source}
            loading={loading}
            onBuildFromFiles={loadFiles}
            onLoadDemo={loadSample}
          />
        )}
        {view === "chapters" && <ChaptersView months={months} onOpenMonth={setActiveMonth} />}
        {view === "search" && <SearchView flatTxns={household} flatSongs={spotify} />}
        {view === "connections" && (
          <ConnectionsView months={months} flatTxns={household} flatSongs={spotify} onOpenMonth={setActiveMonth} />
        )}
      </main>
      <footer className="border-t border-line py-6 text-inkSoft text-sm">
        <div className="max-w-4xl mx-auto px-5">
          Built for the &ldquo;Your Life, In Receipts&rdquo; hackathon problem · frontend-only, no backend, runs
          entirely in your browser.
        </div>
      </footer>

      {activeMonth !== null && (
        <ChapterModal month={months[activeMonth]} onClose={closeModal} onPrev={showPrevMonth} onNext={showNextMonth} />
      )}
    </div>
  );
}
