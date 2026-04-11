'use strict';

const { build, extractWin, parse, serialize, fmt } = require('../responseBuilder');
const sessionModel = require('../../models/sessionModel');
const spinLog      = require('../../models/spinLogModel');
const { getResponses } = require('../../config/games');

const SLUG   = 'pub';
const SYMBOL = 'vs25luckpub';

async function doInit(mgckey) {
  const responses = getResponses(SLUG);
  const sess      = await sessionModel.getOrCreate(mgckey);
  const balance   = parseFloat(sess.balance);
  const response  = build(responses.doInit, { balance, stime: Date.now() });
  spinLog.log({ mgckey, symbol: SYMBOL, action: 'doInit', balanceBefore: balance, balanceAfter: balance, responseRaw: response });
  return response;
}

async function doSpin(mgckey, bet) {
  const responses = getResponses(SLUG);
  const sess      = await sessionModel.debitBet(mgckey, bet);
  const spinIdx   = (sess.spin_index - 1) % responses.doSpin.length;
  const balanceAfter = parseFloat(sess.balance);
  const raw       = responses.doSpin[spinIdx];
  const fields    = parse(raw);
  const win       = extractWin(fields);
  let finalBalance = balanceAfter;
  if (win > 0) {
    const credited = await sessionModel.creditWin(mgckey, win);
    finalBalance = parseFloat(credited.balance);
  }
  fields['balance'] = fmt(finalBalance);
  fields['balance_cash'] = fmt(finalBalance);
  fields['balance_bonus'] = '0.00';
  fields['stime'] = Date.now();
  fields['c'] = bet.toFixed(2);
  const response = serialize(fields);
  spinLog.log({ mgckey, symbol: SYMBOL, action: 'doSpin', bet, win, balanceBefore: balanceAfter + bet, balanceAfter: finalBalance, responseRaw: response });
  return response;
}

async function doCollect(mgckey) {
  const responses = getResponses(SLUG);
  const sess      = await sessionModel.nextCollect(mgckey);
  const collectIdx = (sess.collect_index - 1) % responses.doCollect.length;
  const balance    = parseFloat(sess.balance);
  const response   = build(responses.doCollect[collectIdx], { balance, stime: Date.now() });
  spinLog.log({ mgckey, symbol: SYMBOL, action: 'doCollect', balanceBefore: balance, balanceAfter: balance, responseRaw: response });
  return response;
}

async function handle(action, params) {
  const mgckey = params.mgckey || 'default';
  const bet    = parseFloat(params.c || '0.08');
  switch (action) {
    case 'doInit':    return doInit(mgckey);
    case 'doSpin':    return doSpin(mgckey, bet);
    case 'doCollect': return doCollect(mgckey);
    default: {
      const sess = await sessionModel.getOrCreate(mgckey);
      const bal  = parseFloat(sess.balance);
      return `balance=${fmt(bal)}&balance_cash=${fmt(bal)}&balance_bonus=0.00&na=s&stime=${Date.now()}`;
    }
  }
}

module.exports = { handle };
