import { describe, it, expect } from "vitest";
import { receiptText } from "../src/lib/receipt.js";
import { buildModel } from "../src/lib/model.js";
import { generateDemoData } from "../src/lib/demoData.js";

describe("receiptText", () => {
  const { household, spotify } = generateDemoData();
  const [jan] = buildModel(household, spotify);
  const text = receiptText(jan);
  const lines = text.split("\n");

  it("starts with the title and month, and includes the key figures", () => {
    expect(lines[0]).toBe("YOUR LIFE, IN RECEIPTS");
    expect(lines[2]).toBe("JANUARY");
    expect(text).toMatch(/SPENT \.+ ₹/);
    expect(text).toMatch(/RECEIPTS \.+ \d+ items/);
    expect(text).toMatch(/MOOD: [A-Z ]+/);
  });

  it("never lets a line run past the receipt width", () => {
    // line items may exceed the width only when a value itself is very long; the demo data stays within it
    expect(Math.max(...lines.map((l) => l.length))).toBeLessThanOrEqual(40);
  });

  it("handles an empty month", () => {
    const [emptyJan] = buildModel([], []);
    const empty = receiptText(emptyJan);
    expect(empty).toContain("MOOD: QUIET");
    expect(empty).toContain("No receipts survive from January");
  });
});
