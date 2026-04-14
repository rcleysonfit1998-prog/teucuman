'use strict';

/**
 * Formats a number as a US-locale currency string with 2 decimal places.
 * @param {number|string} n
 * @returns {string}  e.g. 1234.5 → "1,234.50"
 */
function fmt(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

module.exports = { fmt };
