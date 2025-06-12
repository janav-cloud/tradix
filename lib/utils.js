// lib/utils.js
const ANNUALIZATION_FACTOR = 252; // Number of trading days in a year
const RISK_FREE_RATE = 0.02; // Risk-free rate for Sharpe/Sortino calculations

// --- Date Utilities ---
/**
 * Formats a Date object or string into 'YYYY-MM-DD' format.
 * @param {Date|string} dateInput - The date to format.
 * @returns {string} The formatted date string.
 */
function formatDate(dateInput) {
  let date;
  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    throw new Error('Invalid date input provided.');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');  // Month is 0-indexed
  return `${year}-${month}-${day}`;
}

/**
 * Parses a 'YYYY-MM-DD' string into a Date object.
 * Adjusts to UTC to prevent timezone issues with date comparisons.
 * @param {string} dateString - Date string in 'YYYY-MM-DD' format.
 * @returns {Date} A UTC Date object.
 */
function parseDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)); // Month is 0-indexed in Date constructor
}

module.exports = {
  ANNUALIZATION_FACTOR,
  RISK_FREE_RATE,
  formatDate,
  parseDate
};