import { useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import HomeView from "./components/HomeView.jsx";
import ChaptersView from "./components/ChaptersView.jsx";
import SearchView from "./components/SearchView.jsx";
import ConnectionsView from "./components/ConnectionsView.jsx";
import ChapterModal from "./components/ChapterModal.jsx";
import { parseHouseholdCSV, parseSpotifyCSV } from "./lib/csv.js";
import { generateDemoData } from "./lib/demoData.js";
import { buildModel } from "./lib/model.js";

const initialDemo = generateDemoData();

export default function App() {
  const [view, setView] = useState("home");
  const [household, setHousehold] = useState(initialDemo.household);
  const [spotify, setSpotify] = useState(initialDemo.spotify);
  const [status, setStatus] = useState("Demo data loaded — swap in your own CSVs any time.");
  const [activeMonth, setActiveMonth] = useState(null);

  const months = useMemo(() => buildModel(household, spotify), [household, spotify]);

  function loadDemo() {
    const d = generateDemoData();
    setHousehold(d.household);
    setSpotify(d.spotify);
    setStatus("Demo data reloaded.");
  }

  function buildFromFiles(hFile, sFile) {
    if (!hFile && !sFile) {
      setStatus("Choose at least one CSV file first, or use demo data.");
      return;
    }
    setStatus("Reading files…");

    const readers = [];
    if (hFile) {
      readers.push(
        hFile.text().then((text) => {
          setHousehold(parseHouseholdCSV(text));
        })
      );
    }
    if (sFile) {
      readers.push(
        sFile.text().then((text) => {
          setSpotify(parseSpotifyCSV(text));
        })
      );
    }
    Promise.all(readers).then(() => {
      setStatus("Story rebuilt from your uploaded files.");
    });
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header view={view} setView={setView} />
      <main className="max-w-4xl mx-auto px-5 py-8 pb-20">
        {view === "home" && (
          <HomeView
            months={months}
            flatTxns={household}
            flatSongs={spotify}
            status={status}
            onBuildFromFiles={buildFromFiles}
            onLoadDemo={loadDemo}
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
          Built for the "Your Life, In Receipts" hackathon problem · frontend-only, no backend, runs entirely in your browser.
        </div>
      </footer>

      {activeMonth !== null && (
        <ChapterModal month={months[activeMonth]} onClose={() => setActiveMonth(null)} />
      )}
    </div>
  );
}
