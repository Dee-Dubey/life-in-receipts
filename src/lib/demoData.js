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

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDemoData() {
  const household = [];
  const spotify = [];

  for (let m = 0; m < 12; m++) {
    const txnCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < txnCount; i++) {
      const c = pick(DEMO_CATS);
      const day = 1 + Math.floor(Math.random() * 27);
      const hour = Math.floor(Math.random() * 24);
      const amount = Math.round(20 + Math.random() * 900);
      const date = new Date(2018, m, day, hour, Math.floor(Math.random() * 60));
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

    const songCount = 8 + Math.floor(Math.random() * 10);
    for (let j = 0; j < songCount; j++) {
      const t = pick(DEMO_TRACKS);
      const day = 1 + Math.floor(Math.random() * 27);
      const hour = Math.floor(Math.random() * 24);
      const ms = 30000 + Math.floor(Math.random() * 220000);
      const ts = new Date(2018, m, day, hour, Math.floor(Math.random() * 60));
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
