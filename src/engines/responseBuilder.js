'use strict';

/**
 * Format a number as Pragmatic expects: "99,998.88"
 */
function fmt(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse a Pragmatic response string into a key→value map.
 * Values are kept as strings to preserve exact format.
 */
function parse(raw) {
  const obj = {};
  for (const part of raw.split('&')) {
    const eq = part.indexOf('=');
    if (eq > 0) obj[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return obj;
}

/**
 * Serialize a key→value map back to a Pragmatic response string.
 */
function serialize(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

/**
 * Patch live session fields into a parsed response object.
 * This ensures balance, stime and counters are always fresh.
 */
function patchSession(fields, { balance, stime }) {
  fields['balance']       = fmt(balance);
  fields['balance_cash']  = fmt(balance);
  fields['balance_bonus'] = '0.00';
  fields['stime']         = stime ?? Date.now();
  return fields;
}

/**
 * Build a complete response string from raw HAR response + live session.
 *
 * @param {string} raw          - Raw response from responses/index.json
 * @param {object} sessionPatch - { balance, stime }
 * @returns {string}            - Ready-to-send response string
 */
function build(raw, sessionPatch) {
  const fields = parse(raw);
  patchSession(fields, sessionPatch);
  return serialize(fields);
}

/**
 * Extract win amount from a parsed response (tw = total win).
 */
function extractWin(fields) {
  const tw = fields['tw'];
  if (!tw) return 0;
  return parseFloat(tw.replace(/,/g, '')) || 0;
}

module.exports = { fmt, parse, serialize, patchSession, build, extractWin };
