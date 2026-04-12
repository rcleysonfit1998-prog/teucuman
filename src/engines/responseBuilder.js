'use strict';

function fmt(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parse(raw) {
  const obj = {};
  for (const part of raw.split('&')) {
    const eq = part.indexOf('=');
    if (eq > 0) obj[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return obj;
}

function serialize(obj) {
  return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('&');
}

function build(raw, { balance, stime }) {
  const fields = parse(raw);
  fields['balance']       = fmt(balance);
  fields['balance_cash']  = fmt(balance);
  fields['balance_bonus'] = '0.00';
  fields['stime']         = stime ?? Date.now();
  return serialize(fields);
}

function extractWin(fields) {
  const tw = fields['tw'];
  if (!tw) return 0;
  return parseFloat(tw.replace(/,/g, '')) || 0;
}

module.exports = { fmt, parse, serialize, build, extractWin };
