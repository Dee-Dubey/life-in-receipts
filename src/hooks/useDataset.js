import { useCallback, useEffect, useState } from "react";
import { parseHouseholdCSV, parseSpotifyCSV } from "../lib/csv.js";
import { generateDemoData } from "../lib/demoData.js";
import { loadBundledData } from "../lib/dataSource.js";

const n = (value) => value.toLocaleString("en-IN");

/**
 * Owns everything about where the data comes from: the bundled challenge CSVs, generated sample data,
 * or files the visitor uploads. Views only receive plain arrays plus a status message.
 *
 * @returns {{
 *   household: import("../lib/types.js").Transaction[],
 *   spotify: import("../lib/types.js").Song[],
 *   source: "bundled" | "upload" | "demo",
 *   loading: boolean,
 *   status: string,
 *   loadSample: () => void,
 *   loadFiles: (householdFile: File|null, spotifyFile: File|null) => Promise<void>,
 * }}
 */
export function useDataset() {
  const [household, setHousehold] = useState([]);
  const [spotify, setSpotify] = useState([]);
  const [source, setSource] = useState("demo");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading data…");

  // On start-up: prefer the organizer CSVs in /public/data, otherwise fall back to sample data.
  useEffect(() => {
    let cancelled = false;
    loadBundledData().then((bundled) => {
      if (cancelled) return;
      if (bundled) {
        setHousehold(bundled.household);
        setSpotify(bundled.spotify);
        setSource("bundled");
        setStatus(
          `Loaded ${n(bundled.household.length)} purchases and ${n(bundled.spotify.length)} tracks from the challenge dataset.`,
        );
      } else {
        const sample = generateDemoData();
        setHousehold(sample.household);
        setSpotify(sample.spotify);
        setSource("demo");
        setStatus("No dataset found in /public/data — showing generated sample data. Upload your CSVs any time.");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSample = useCallback(() => {
    const sample = generateDemoData();
    setHousehold(sample.household);
    setSpotify(sample.spotify);
    setSource("demo");
    setStatus("Sample data loaded.");
  }, []);

  const loadFiles = useCallback(
    async (householdFile, spotifyFile) => {
      if (!householdFile && !spotifyFile) {
        setStatus("Choose at least one CSV file first, or use sample data.");
        return;
      }
      setLoading(true);
      setStatus("Reading files…");
      try {
        const [hText, sText] = await Promise.all([
          householdFile ? householdFile.text() : null,
          spotifyFile ? spotifyFile.text() : null,
        ]);
        const h = hText !== null ? parseHouseholdCSV(hText) : null;
        const s = sText !== null ? parseSpotifyCSV(sText) : null;

        // Never wipe the current data because one chosen file had no usable rows.
        if ((h && !h.length) || (s && !s.length)) {
          const bad = h && !h.length ? "household file" : "Spotify file";
          setStatus(`No usable rows found in the ${bad}. Check the header row and column names (see README).`);
          return;
        }
        if (h) setHousehold(h);
        if (s) setSpotify(s);
        setSource("upload");
        setStatus(
          `Story rebuilt from your files: ${n(h ? h.length : household.length)} purchases, ${n(s ? s.length : spotify.length)} tracks.`,
        );
      } catch {
        setStatus("Could not read that file. Make sure it is a plain .csv and try again.");
      } finally {
        setLoading(false);
      }
    },
    [household.length, spotify.length],
  );

  return { household, spotify, source, loading, status, loadSample, loadFiles };
}
