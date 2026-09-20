import { describe, it, expect } from "vitest";
import {
  parseCSV,
  parseDMY,
  parseMDY,
  parseISO,
  parseSpotifyDate,
  parseHouseholdCSV,
  parseSpotifyCSV,
} from "../src/lib/csv.js";

describe("parseCSV", () => {
  it("handles quoted fields, embedded commas, escaped quotes and CRLF", () => {
    const rows = parseCSV('a,b,c\r\n1,"x, y","say ""hi"""\r\n');
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1", "x, y", 'say "hi"'],
    ]);
  });

  it("strips a UTF-8 BOM so the first header still matches", () => {
    const rows = parseCSV("\uFEFFDate,Amount\n01/02/2018,5\n");
    expect(rows[0][0]).toBe("Date");
  });

  it("returns [] for empty input", () => {
    expect(parseCSV("")).toEqual([]);
    expect(parseCSV(undefined)).toEqual([]);
  });
});

describe("date parsing", () => {
  it("parses DD/MM/YYYY HH:MM:SS", () => {
    const d = parseDMY("20/09/2018 12:04:08");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2018, 8, 20, 12]);
  });

  it("parses M/D/YYYY H:MM", () => {
    const d = parseMDY("7/8/2013 2:44");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2013, 6, 8, 2, 44]);
  });

  it("parses ISO timestamps", () => {
    const d = parseISO("2013-07-08 02:44:34");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2013, 6, 8, 2]);
    expect(parseSpotifyDate("2013-07-08T02:44:34Z").getMonth()).toBe(6);
  });

  it("returns null for garbage", () => {
    expect(parseDMY("")).toBeNull();
    expect(parseDMY("nope")).toBeNull();
    expect(parseMDY("1/2")).toBeNull();
    expect(parseISO("hello")).toBeNull();
  });
});

describe("parseHouseholdCSV", () => {
  const csv = [
    "Date,Category,Subcategory,Note,Amount,Income/Expense",
    '20/09/2018 12:04:08,Food,Lunch,"dal, rice",120,Expense',
    "21/09/2018 09:00:00,Transportation,Auto,,-45.5,Expense",
    "22/09/2018 09:00:00,Other,Misc,,abc,Expense", // bad amount -> skipped
  ].join("\n");

  it("maps columns, skips unparsable amounts, stores absolute amounts", () => {
    const out = parseHouseholdCSV(csv);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ category: "Food", subcategory: "Lunch", note: "dal, rice", amount: 120, month: 8 });
    expect(out[1].amount).toBe(45.5);
  });

  it("tolerates missing optional columns and header case", () => {
    const out = parseHouseholdCSV("DATE,AMOUNT\n01/01/2019 10:00:00,10\n");
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe("Other");
  });
});

describe("parseSpotifyCSV", () => {
  it("parses M/D/YYYY data and infers skipped from ms_played when the column is absent", () => {
    const csv = "ts,track_name,artist_name,album_name,ms_played\n7/8/2013 2:44,Song A,Artist A,Album,1000\n";
    const out = parseSpotifyCSV(csv);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ track: "Song A", artist: "Artist A", month: 6, skipped: true });
  });

  it("parses ISO timestamps and an explicit skipped column", () => {
    const csv = "ts,track_name,artist_name,ms_played,skipped\n2013-07-08 23:44:34,B,X,200000,false\n";
    const out = parseSpotifyCSV(csv);
    expect(out[0].month).toBe(6);
    expect(out[0].skipped).toBe(false);
  });

  it("skips rows without a track name", () => {
    expect(parseSpotifyCSV("ts,track_name\n7/8/2013 2:44,\n")).toHaveLength(0);
  });
});
