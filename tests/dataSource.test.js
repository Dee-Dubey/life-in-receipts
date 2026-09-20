import { describe, it, expect, afterEach } from "vitest";
import { loadBundledData } from "../src/lib/dataSource.js";

const HOUSEHOLD = "Date,Category,Subcategory,Note,Amount,Income/Expense\n20/09/2018 12:04:08,Food,Lunch,,120,Expense\n";
const SPOTIFY = "ts,track_name,artist_name,ms_played\n7/8/2013 2:44,Song,Artist,200000\n";

function mockFetch(files) {
  globalThis.fetch = (url) => {
    const hit = Object.entries(files).find(([k]) => String(url).endsWith(k));
    if (!hit) return Promise.resolve({ ok: false, headers: new Headers(), text: () => Promise.resolve("") });
    const [, { body, type = "text/csv" }] = hit;
    return Promise.resolve({
      ok: true,
      headers: new Headers({ "content-type": type }),
      text: () => Promise.resolve(body),
    });
  };
}

afterEach(() => {
  delete globalThis.fetch;
});

describe("loadBundledData", () => {
  it("loads and parses both bundled CSVs", async () => {
    mockFetch({ "data/household.csv": { body: HOUSEHOLD }, "data/spotify.csv": { body: SPOTIFY } });
    const data = await loadBundledData();
    expect(data.household).toHaveLength(1);
    expect(data.spotify).toHaveLength(1);
  });

  it("works with only one of the files present", async () => {
    mockFetch({ "data/household.csv": { body: HOUSEHOLD } });
    const data = await loadBundledData();
    expect(data.household).toHaveLength(1);
    expect(data.spotify).toHaveLength(0);
  });

  it("returns null when nothing is bundled", async () => {
    mockFetch({});
    expect(await loadBundledData()).toBeNull();
  });

  it("ignores an index.html fallback served with status 200 (SPA hosts / dev server)", async () => {
    mockFetch({
      "data/household.csv": { body: "<!doctype html><html></html>", type: "text/html" },
      "data/spotify.csv": { body: "<!doctype html><html></html>", type: "text/html" },
    });
    expect(await loadBundledData()).toBeNull();
  });

  it("returns null (does not throw) when fetch itself fails", async () => {
    globalThis.fetch = () => Promise.reject(new Error("offline"));
    expect(await loadBundledData()).toBeNull();
  });
});
