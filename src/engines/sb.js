'use strict';
const db  = require('../config/db');
const rng = require('./rng');

const { doInitRNG, doCollectRNG, fmt, serialize, FS_COUNT } = rng;

const DEFAULT_BALANCE = parseFloat(process.env.DEFAULT_BALANCE || '50000');

const memState = new Map();

function getState(mgckey) {
  if (!memState.has(mgckey)) {
    memState.set(mgckey, {
      mgckey,
      balance:         DEFAULT_BALANCE,
      index:           1,
      reelSet:         0,
      isFreeSpins:     false,
      isSuperFS:       false,
      fsCurrentSpin:   0,
      fsMaxSpin:       FS_COUNT,
      fsTotalWin:      0,
      lastTotalWin:    0,
      pendingResponses:[],
    });
  }
  return memState.get(mgckey);
}

async function loadFromDB(mgckey) {
  try {
    const { rows } = await db.query('SELECT * FROM sessions WHERE mgckey=$1', [mgckey]);
    if (rows[0]) {
      const s = getState(mgckey);
      s.balance = parseFloat(rows[0].balance);
      s.index   = rows[0].spin_index || 1;
    }
  } catch (_) {}
}

async function saveBalance(mgckey, balance) {
  try {
    await db.query(
      `INSERT INTO sessions (mgckey, balance) VALUES ($1,$2)
       ON CONFLICT (mgckey) DO UPDATE SET balance=$2, spin_index=spin_index+1, updated_at=NOW()`,
      [mgckey, balance]
    );
  } catch (_) {}
}

async function handle(action, params) {
  const mgckey = params.mgckey || 'default';
  await loadFromDB(mgckey);
  const sess = getState(mgckey);

  switch (action) {
    case 'doInit':    return handleInit(sess);
    case 'doSpin':    return handleSpin(sess, params);
    case 'doCollect': return handleCollect(sess, params);
    default:
      return `balance=${fmt(sess.balance)}&balance_cash=${fmt(sess.balance)}&balance_bonus=0.00&na=s&stime=${Date.now()}`;
  }
}

async function handleInit(sess) {
  sess.index = 1;
  return doInitRNG(sess.balance);
}

async function handleSpin(sess, params) {
  if (sess.pendingResponses.length > 0) {
    let resp = sess.pendingResponses.shift();
    const reqIndex = params.index || (sess.index + 1);
    const reqCounter = params.counter || (reqIndex * 2);
    sess.index = parseInt(reqIndex);
    
    resp = resp.replace(/index=[0-9]+/g, `index=${reqIndex}`);
    resp = resp.replace(/counter=[0-9]+/g, `counter=${reqCounter}`);
    resp = resp.replace(/stime=[0-9]+/g, `stime=${Date.now()}`);
    return resp;
  }

  const coinValue = parseFloat(params.c || '0.20');
  const pur       = params.pur !== undefined ? parseInt(params.pur) : -1;
  sess.index = parseInt(params.index || sess.index + 1);

  if (pur === 1 || pur === 0) {
    const isSuperBuy = pur === 1;
    const cost = isSuperBuy ? coinValue * 10000 : coinValue * 2000;
    sess.balance = Math.max(0, sess.balance - cost);
    sess.isFreeSpins = true;
    sess.isSuperFS   = isSuperBuy;
    sess.fsCurrentSpin = 1;
    sess.fsMaxSpin   = FS_COUNT;
    sess.fsTotalWin  = 0;
    sess.reelSet     = 0;
    await saveBalance(sess.mgckey, sess.balance);
    return buildAndQueueSpin(sess, params, coinValue, pur);
  }

  if (sess.isFreeSpins) {
    sess.fsCurrentSpin++;
    if (sess.fsCurrentSpin > sess.fsMaxSpin) {
      return buildFSEndResponse(sess, coinValue, params);
    }
    return buildAndQueueSpin(sess, params, coinValue, undefined);
  }

  // 🚨 CORREÇÃO: O custo da aposta é coinValue * 20 linhas
  const cost = coinValue * 20;
  sess.balance = Math.max(0, sess.balance - cost);
  await saveBalance(sess.mgckey, sess.balance);
  return buildAndQueueSpin(sess, params, coinValue, undefined);
}

function buildAndQueueSpin(sess, params, coinValue, pur) {
  const responses = rng.doSpinRNG({ ...params, pur }, sess);

  const lastResp = responses[responses.length - 1];
  const tw = parseFloat(getField(lastResp, 'tw') || '0');

  // 🚨 CORREÇÃO: O saldo enviado nas respostas deve ser o saldo PRÉ-GANHO.
  // O cliente fará a animação do ganho e atualizará visualmente.
  const displayBalance = sess.balance;

  if (sess.isFreeSpins) {
    sess.fsTotalWin = tw;
  } else {
    if (tw > 0) {
      // Adicionamos o ganho ao saldo real no servidor imediatamente
      sess.balance += tw;
      saveBalance(sess.mgckey, sess.balance);
    }
  }

  // Injetamos o saldo pré-ganho em todas as respostas da cascata
  const patched = responses.map(r => patchBalance(r, displayBalance));

  const first = patched.shift();
  if (patched.length) sess.pendingResponses.push(...patched);
  return first;
}

function buildFSEndResponse(sess, coinValue, params) {
  const syms = [3,4,5,6,7,8,9,10,11];
  const grid = Array.from({length:30}, () => syms[Math.floor(Math.random()*syms.length)]);
  const tw   = sess.fsTotalWin;

  const resp = serialize({
    tw:            tw.toFixed(2),
    balance:       fmt(sess.balance),
    index:         params.index,
    balance_cash:  fmt(sess.balance),
    reel_set:      sess.reelSet,
    balance_bonus: '0.00',
    na:            'c',
    tmb_win:       '0',
    bl:            '0',
    stime:         Date.now(),
    sa:            randRow(),
    sb:            randRow(),
    sh:            5,
    c:             coinValue.toFixed(2),
    sver:          '5',
    counter:       params.counter,
    l:             '20',
    s:             grid.join(','),
    w:             '0',
    'fs_bought':   FS_COUNT,
    fs:            sess.fsCurrentSpin,
    st:            'rect',
    sw:            6,
    fsmul:         '1',
    fsmul_total:   '1',
    fswin_total:   '0.00',
    fs_total:      sess.fsMaxSpin,
    fsres_total:   '0.00',
    puri:          sess.isSuperFS ? '1' : '0',
  });

  sess.lastTotalWin = tw;
  sess.isFreeSpins   = false;
  sess.isSuperFS     = false;
  sess.fsCurrentSpin = 0;
  sess.fsTotalWin    = 0;
  sess.reelSet       = 0;
  return resp;
}

async function handleCollect(sess, params) {
  const win = sess.lastTotalWin || 0;
  sess.balance += win;
  sess.lastTotalWin = 0;
  sess.index = parseInt(params.index || sess.index + 1);
  await saveBalance(sess.mgckey, sess.balance);
  return doCollectRNG(sess.balance, sess.index);
}

function getField(str, field) {
  const m = str.match(new RegExp(`(?:^|&)${field}=([^&]*)`));
  return m ? m[1] : null;
}

function patchBalance(str, balance) {
  return str
    .replace(/balance=[^&]*/g,      `balance=${fmt(balance)}`)
    .replace(/balance_cash=[^&]*/g, `balance_cash=${fmt(balance)}`);
}

function randRow() {
  const syms = [3,4,5,6,7,8,9,10,11];
  return Array.from({length:6}, () => syms[Math.floor(Math.random()*syms.length)]).join(',');
}

module.exports = { handle };