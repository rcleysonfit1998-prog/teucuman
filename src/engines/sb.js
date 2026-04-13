'use strict';
const path    = require('path');
const fs      = require('fs');
const session = require('../models/sessionModel');

const RESPONSES_PATH = path.join(__dirname, '../../games/sb/responses/index.json');
let _r = null;
function R() {
  if (!_r) _r = JSON.parse(fs.readFileSync(RESPONSES_PATH, 'utf8'));
  return _r;
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parse(raw) {
  const obj = {};
  for (const p of raw.split('&')) {
    const eq = p.indexOf('=');
    if (eq > 0) obj[p.slice(0, eq)] = p.slice(eq + 1);
  }
  return obj;
}

function serialize(obj) {
  return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('&');
}

function patchBalance(raw, balance) {
  const f = parse(raw);
  f['balance']       = fmt(balance);
  f['balance_cash']  = fmt(balance);
  f['balance_bonus'] = '0.00';
  f['stime']         = Date.now();
  return serialize(f);
}

async function doInit(mgckey) {
  const sess = await session.getOrCreate(mgckey);
  return patchBalance(R().doInit, parseFloat(sess.balance));
}

async function doSpin(mgckey, bet) {
  const r    = R();
  const sess = await session.debitBet(mgckey, bet);
  const idx  = (sess.spin_index - 1) % r.doSpin.length;
  const raw  = r.doSpin[idx];
  const f    = parse(raw);

  // Extract win (tw = total win)
  const win = parseFloat((f['tw'] || '0').replace(/,/g, '')) || 0;
  let balance = parseFloat(sess.balance);
  if (win > 0) {
    const credited = await session.creditWin(mgckey, win);
    balance = parseFloat(credited.balance);
  }

  f['balance']       = fmt(balance);
  f['balance_cash']  = fmt(balance);
  f['balance_bonus'] = '0.00';
  f['stime']         = Date.now();
  f['c']             = bet.toFixed(2);
  return serialize(f);
}

async function doCollect(mgckey) {
  const r    = R();
  const sess = await session.nextCollect(mgckey);
  const idx  = (sess.collect_index - 1) % r.doCollect.length;
  return patchBalance(r.doCollect[idx], parseFloat(sess.balance));
}

async function handle(action, params) {
  const mgckey = params.mgckey || 'default';
  const bet    = parseFloat(params.c || '0.20');

  switch (action) {
    case 'doInit':    return doInit(mgckey);
    case 'doSpin':    return doSpin(mgckey, bet);
    case 'doCollect': return doCollect(mgckey);
    default: {
      const balance = await session.getBalance(mgckey);
      return `balance=${fmt(balance)}&balance_cash=${fmt(balance)}&balance_bonus=0.00&na=s&stime=${Date.now()}`;
    }
  }
}

module.exports = { handle };
