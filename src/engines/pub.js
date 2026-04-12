'use strict';

const path    = require('path');
const fs      = require('fs');
const { build, extractWin, parse, serialize, fmt } = require('./responseBuilder');
const session = require('../models/sessionModel');

const RESPONSES_PATH = path.join(__dirname, '../../games/pub/responses/index.json');

let _responses = null;
function getResponses() {
  if (!_responses) _responses = JSON.parse(fs.readFileSync(RESPONSES_PATH, 'utf8'));
  return _responses;
}

async function doInit(mgckey) {
  const r    = getResponses();
  const sess = await session.getOrCreate(mgckey);
  return build(r.doInit, { balance: parseFloat(sess.balance), stime: Date.now() });
}

async function doSpin(mgckey, bet) {
  const r    = getResponses();
  const sess = await session.debitBet(mgckey, bet);
  const idx  = (sess.spin_index - 1) % r.doSpin.length;
  const raw  = r.doSpin[idx];
  const fields = parse(raw);
  const win  = extractWin(fields);

  let balance = parseFloat(sess.balance);
  if (win > 0) {
    const credited = await session.creditWin(mgckey, win);
    balance = parseFloat(credited.balance);
  }

  fields['balance']       = fmt(balance);
  fields['balance_cash']  = fmt(balance);
  fields['balance_bonus'] = '0.00';
  fields['stime']         = Date.now();
  fields['c']             = bet.toFixed(2);

  return serialize(fields);
}

async function doCollect(mgckey) {
  const r    = getResponses();
  const sess = await session.nextCollect(mgckey);
  const idx  = (sess.collect_index - 1) % r.doCollect.length;
  return build(r.doCollect[idx], { balance: parseFloat(sess.balance), stime: Date.now() });
}

async function handle(action, params) {
  const mgckey = params.mgckey || 'default';
  const bet    = parseFloat(params.c || '0.08');

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
