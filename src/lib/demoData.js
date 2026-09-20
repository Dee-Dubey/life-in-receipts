import { CATEGORY_MOOD } from "./csv.js";

// NOTE: this is entirely made-up placeholder data, generated in the browser,
// so the UI is never empty before you upload your own CSVs. None of it comes
// from a real Kaggle file.

const DEMO_CATS = [
  { category: "Food", subs: ["Snacks", "Lunch", "Dinner", "Groceries", "Milk"] },
  { category: "Transportation", subs: ["Auto", "Train", "Cab", "Metro"] },
  { category: "subscription", subs: ["Netflix", "Mobile Recharge", "Tata Sky"] },
  { category: "Festivals", subs: ["Ganesh Pujan", "Diwali", "Holi", "Rakhi"] },
  { category: "Family", subs: ["Pocket Money", "Gift", "Support"] },
  { category: "Apparel", subs: ["Laundry", "New Clothes"] },
  { category: "fitness_and_medical", subs: ["Gym", "Pharmacy"] },
  { category: "Other", subs: ["Misc"] },
];

const DEMO_TRACKS = [
  { artist: "Arctic Monkeys", track: "Do I Wanna Know?" },
  { artist: "MGMT", track: "Electric Feel" },
  { artist: "Frank Ocean", track: "White" },
  { artist: "Lana Del Rey", track: "Born To Die" },
  { artist: "M83", track: "Midnight City" },
  { artist: "Two Door Cinema Club", track: "Sun" },
  { artist: "Passion Pit", track: "Take a Walk" },
  { artist: "Calvin Harris", track: "Drinking from the Bottle" },
  { artist: "James Arthur", track: "Impossible" },
  { artist: "Emeli Sandé", track: "Heaven" },
];

// Small seeded PRNG (mulberry32) so the sample data is identical on every load —
// stable screenshots, reproducible tests, no "the page changed on refresh" surprises.
function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDemoData(seed = 2018) {
  const rng = makeRng(seed);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const household = [];
  const spotify = [];

  for (let m = 0; m < 12; m++) {
    const txnCount = 5 + Math.floor(rng() * 5);
    for (let i = 0; i < txnCount; i++) {
      const c = pick(DEMO_CATS);
      const day = 1 + Math.floor(rng() * 27);
      const hour = Math.floor(rng() * 24);
      const amount = Math.round(20 + rng() * 900);
      const date = new Date(2018, m, day, hour, Math.floor(rng() * 60));
      household.push({
        date,
        month: m,
        category: c.category,
        subcategory: pick(c.subs),
        note: "",
        amount,
        type: "Expense",
        mood: CATEGORY_MOOD[c.category.toLowerCase()] || "Routine",
      });
    }

    const songCount = 8 + Math.floor(rng() * 10);
    for (let j = 0; j < songCount; j++) {
      const t = pick(DEMO_TRACKS);
      const day = 1 + Math.floor(rng() * 27);
      const hour = Math.floor(rng() * 24);
      const ms = 30000 + Math.floor(rng() * 220000);
      const ts = new Date(2018, m, day, hour, Math.floor(rng() * 60));
      spotify.push({
        ts,
        month: m,
        track: t.track,
        artist: t.artist,
        album: "",
        msPlayed: ms,
        skipped: ms < 60000,
        reasonEnd: ms < 60000 ? "nextbtn" : "trackdone",
      });
    }
  }

  return { household, spotify };
}
