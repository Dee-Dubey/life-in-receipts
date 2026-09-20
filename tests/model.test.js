import { describe, it, expect } from "vitest";
import { buildModel, correlation, fmtINR, ordinal } from "../src/lib/model.js";
import { generateDemoData } from "../src/lib/demoData.js";

describe("formatters", () => {
  it("formats rupees with Indian grouping", () => {
    expect(fmtINR(1234567)).toBe("₹12,34,567");
    expect(fmtINR(0)).toBe("₹0");
  });
  it("adds ordinal suffixes", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 30].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "30th",
    ]);
  });
});

describe("correlation", () => {
  it("is 1 / -1 for perfectly linear data and 0 for constants or empty input", () => {
    expect(correlation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(correlation([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1);
    expect(correlation([1, 1, 1], [1, 2, 3])).toBe(0);
    expect(correlation([], [])).toBe(0);
  });
});

describe("buildModel", () => {
  it("always returns 12 chapters, even for empty input, with a 'Quiet' mood", () => {
    const months = buildModel([], []);
    expect(months).toHaveLength(12);
    expect(months[0].mood).toBe("Quiet");
    expect(months[0].narrative).toMatch(/No receipts survive/);
  });

  it("groups by month, sums only expenses, and picks a defining day", () => {
    const d = (m, day, h = 12) => new Date(2018, m, day, h);
    const household = [
      { date: d(0, 5), month: 0, category: "Food", subcategory: "", note: "", amount: 100, type: "Expense" },
      { date: d(0, 5), month: 0, category: "Food", subcategory: "", note: "", amount: 50, type: "Expense" },
      { date: d(0, 9), month: 0, category: "Salary", subcategory: "", note: "", amount: 9999, type: "Income" },
    ];
    const spotify = [{ ts: d(0, 5, 23), month: 0, track: "T", artist: "A", album: "", msPlayed: 1, skipped: true }];
    const [jan] = buildModel(household, spotify);
    expect(jan.totalSpent).toBe(150);
    expect(jan.totalIncome).toBe(9999);
    expect(jan.topCategory).toBe("Food");
    expect(jan.definingDay.day).toBe(5);
    expect(jan.lateNightFraction).toBe(1);
    expect(jan.mood).toBe("Restless");
  });
});

describe("generateDemoData", () => {
  it("is deterministic for a given seed", () => {
    const a = generateDemoData(1);
    const b = generateDemoData(1);
    expect(a.household.map((t) => t.amount)).toEqual(b.household.map((t) => t.amount));
    expect(a.spotify.length).toBe(b.spotify.length);
  });
  it("covers all 12 months", () => {
    const { household } = generateDemoData();
    expect(new Set(household.map((t) => t.month)).size).toBe(12);
  });
});
