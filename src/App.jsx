import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import HomeView from "./components/HomeView.jsx";
import ChaptersView from "./components/ChaptersView.jsx";
import SearchView from "./components/SearchView.jsx";
import ConnectionsView from "./components/ConnectionsView.jsx";
import ChapterModal from "./components/ChapterModal.jsx";
import { parseHouseholdCSV, parseSpotifyCSV } from "./lib/csv.js";
import { generateDemoData } from "./lib/demoData.js";
import { loadBundledData } from "./lib/dataSource.js";
import { buildModel } from "./lib/model.js";

const VIEW_TITLES = {
  home: "Your Life, In Receipts",
  chapters: "Chapters — Your Life, In Receipts",
  search: "Search — Your Life, In Receipts",
  connections: "Connections — Your Life, In Receipts",
};

export default function App() {
  const [view, setView] = useState("home");
  const [household, setHousehold] = useState([]);
  const [spotify, setSpotify] = useState([]);
  const [source, setSource] = useState("demo"); // "bundled" | "upload" | "demo"
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading data…");
  const [activeMonth, setActiveMonth] = useState(null);

  const months = useMemo(() => buildModel(household, spotify), [household, spotify]);

  // On start-up: use the organizer CSVs from /public/data if they exist, otherwise fall back to sample data.
  useEffect(() => {
    let cancelled = false;
    loadBundledData().then((bundled) => {
      if (cancelled) return;
      if (bundled) {
        setHousehold(bundled.household);
        setSpotify(bundled.spotify);
        setSource("bundled");
        setStatus(
          `Loaded ${bundled.household.length.toLocaleString("en-IN")} purchases and ${bundled.spotify.length.toLocaleString(
            "en-IN"
          )} tracks from the challenge dataset.`
        );
      } else {
        const d = generateDemoData();
        setHousehold(d.household);
        setSpotify(d.spotify);
        setSource("demo");
        setStatus("No dataset found in /public/data — showing generated sample data. Upload your CSVs any time.");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.title = VIEW_TITLES[view] || VIEW_TITLES.home;
  }, [view]);

  const closeModal = useCallback(() => setActiveMonth(null), []);

  function loadDemo() {
    const d = generateDemoData();
    setHousehold(d.household);
    setSpotify(d.spotify);
    setSource("demo");
    setStatus("Sample data loaded.");
  }

  async function buildFromFiles(hFile, sFile) {
    if (!hFile && !sFile) {
      setStatus("Choose at least one CSV file first, or use sample data.");
      return;
    }
    setLoading(true);
    setStatus("Reading files…");
    try {
      const [hText, sText] = await Promise.all([hFile ? hFile.text() : null, sFile ? sFile.text() : null]);
      const h = hText !== null ? parseHouseholdCSV(hText) : null;
      const s = sText !== null ? parseSpotifyCSV(sText) : null;

      // Refuse to wipe the current data if a chosen file produced no usable rows.
      if ((h && !h.length) || (s && !s.length)) {
        const bad = h && !h.length ? "household file" : "Spotify file";
        setStatus(`No usable rows found in the ${bad}. Check the header row and column names (see README).`);
        return;
      }
      if (h) setHousehold(h);
      if (s) setSpotify(s);
      setSource("upload");
      setStatus(
        `Story rebuilt from your files: ${(h ? h.length : household.length).toLocaleString("en-IN")} purchases, ${(s
          ? s.length
          : spotify.length
        ).toLocaleString("en-IN")} tracks.`
      );
    } catch {
      setStatus("Could not read that file. Make sure it is a plain .csv and try again.");
    } finally {
      setLoading(false);
    }
  }

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
          Built for the &ldquo;Your Life, In Receipts&rdquo; hackathon problem · frontend-only, no backend, runs entirely in your
          browser.
        </div>
      </footer>

      {activeMonth !== null && <ChapterModal month={months[activeMonth]} onClose={closeModal} />}
    </div>
  );
}
