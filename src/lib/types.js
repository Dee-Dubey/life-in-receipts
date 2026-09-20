/**
 * Shared shapes, documented once with JSDoc so editors can autocomplete and readers know
 * what flows through the app. (No runtime code — this file only holds type definitions.)
 *
 * @typedef {Object} Transaction
 * @property {Date|null} date          parsed purchase date (null if the cell was unreadable)
 * @property {number|null} month       0–11, or null when the date is missing
 * @property {string} category
 * @property {string} subcategory
 * @property {string} note
 * @property {number} amount           always positive
 * @property {string} type             "Expense" | "Income" (as written in the CSV)
 *
 * @typedef {Object} Song
 * @property {Date|null} ts
 * @property {number|null} month       0–11, or null when the timestamp is missing
 * @property {string} track
 * @property {string} artist
 * @property {string} album
 * @property {number} msPlayed
 * @property {boolean} skipped
 *
 * @typedef {Object} DefiningDay
 * @property {number} day              day-of-month, 1–31
 * @property {Transaction[]} txns
 * @property {Song[]} songs
 *
 * @typedef {Object} Month
 * @property {number} index            0–11
 * @property {string} name
 * @property {Transaction[]} txns
 * @property {Song[]} songs
 * @property {number} totalSpent
 * @property {number} totalIncome
 * @property {Record<string, number>} categoryTotals
 * @property {string|null} topCategory
 * @property {number} topCategoryAmt
 * @property {string|null} topArtist
 * @property {string|null} topTrack
 * @property {number} lateNightFraction  0–1
 * @property {number} skipRate           0–1
 * @property {string} mood
 * @property {DefiningDay|null} definingDay
 * @property {string} narrative
 */

export {};
