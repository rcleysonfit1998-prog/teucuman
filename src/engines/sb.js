'use strict';
const db  = require('../config/db');
const rng = require('./rng');

const { doInitRNG, doCollectRNG, fmt, serialize, SCATTER_SYM, FS_COUNT, FS_TRIGGER_COUNT } = rng;

const DEFAULT_BALANCE = parseFloat(process.env.DEFAULT_BALANCE || '50000');

// ── In-memory session state ───────────────────────────────────────────────────
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
      fsBombMul:       1,
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

// ── Main handler ──────────────────────────────────────────────────────────────
async function handle(action, params) {
  const mgckey = params.mgckey || 'default';
  await loadFromDB(mgckey);
  const sess = getState(mgckey);

  switch (action) {
    case 'doInit':    return handleInit(sess);
    case 'doSpin':    return handleSpin(sess, params);
    case 'doCollect': return handleCollect(sess);
    default:
      return `balance=${fmt(sess.balance)}&balance_cash=${fmt(sess.balance)}&balance_bonus=0.00&na=s&stime=${Date.now()}`;
  }
}

// ── doInit ────────────────────────────────────────────────────────────────────
async function handleInit(sess) {
  sess.index = 1;
  return doInitRNG(sess.balance);
}

// ── doSpin ────────────────────────────────────────────────────────────────────
async function handleSpin(sess, params) {
  // Return queued tumble step if pending
  if (sess.pendingResponses.length > 0) {
    return sess.pendingResponses.shift();
  }

  const coinValue = parseFloat(params.c || '0.20');
  const pur       = params.pur !== undefined ? parseInt(params.pur) : -1;
  sess.index++;

  // ── Buy feature ──────────────────────────────────────────────────────────
  if (pur === 1 || pur === 0) {
    const isSuperBuy = pur === 1;
    const cost = isSuperBuy ? coinValue * 400 : coinValue * 80;
    sess.balance    = Math.max(0, sess.balance - cost);
    sess.isFreeSpins = true;
    sess.isSuperFS   = isSuperBuy;
    sess.fsCurrentSpin = 1;
    sess.fsTotalWin  = 0;
    sess.reelSet     = 0; // FS always uses reel_set 0
    await saveBalance(sess.mgckey, sess.balance);
    return buildAndQueueSpin(sess, params, coinValue, pur);
  }

  // ── Ongoing freespins ─────────────────────────────────────────────────────
  if (sess.isFreeSpins) {
    sess.fsCurrentSpin++;
    if (sess.fsCurrentSpin > sess.fsMaxSpin) {
      return buildFSEndResponse(sess, coinValue);
    }
    return buildAndQueueSpin(sess, params, coinValue, undefined);
  }

  // ── Normal spin ───────────────────────────────────────────────────────────
  sess.balance = Math.max(0, sess.balance - coinValue);
  await saveBalance(sess.mgckey, sess.balance);
  return buildAndQueueSpin(sess, params, coinValue, undefined);
}

function buildAndQueueSpin(sess, params, coinValue, pur) {
  const responses = rng.doSpinRNG({ ...params, pur }, sess);

  // Determine total win from last response
  const lastResp = responses[responses.length - 1];
  const tw = parseFloat(getField(lastResp, 'tw') || '0');

  if (sess.isFreeSpins) {
    sess.fsTotalWin += tw;
  } else {
    // Credit win if na=s (spin) — collect not needed for normal wins in SB1000
    const na = getField(lastResp, 'na');
    if (tw > 0 && na !== 'c') {
      sess.balance += tw;
      saveBalance(sess.mgckey, sess.balance);
    } else if (tw > 0) {
      sess.lastTotalWin = tw;
    }
  }

  // Patch balance and FS fields into all responses
  const patched = responses.map(r => {
    let p = patchBalance(r, sess.balance);
    if (sess.isFreeSpins) {
      p = ensureField(p, 'fs',        sess.fsCurrentSpin);
      p = ensureField(p, 'fsmax',     FS_COUNT);
      p = ensureField(p, 'fs_bought', FS_COUNT);
      p = ensureField(p, 'fswin',     sess.fsTotalWin.toFixed(2));
      p = ensureField(p, 'fsmul',     sess.fsBombMul || 1);
      p = ensureField(p, 'fsres',     '0');
      p = ensureField(p, 'puri',      sess.isSuperFS ? '1' : '0');
      p = ensureField(p, 'purtr',     '1');
    }
    return p;
  });

  const first = patched.shift();
  if (patched.length) sess.pendingResponses.push(...patched);
  return first;
}

function buildFSEndResponse(sess, coinValue) {
  const syms = [3,4,5,6,7,8,9,10,11];
  const grid = Array.from({length:30}, () => syms[Math.floor(Math.random()*syms.length)]);
  const tw   = sess.fsTotalWin;

  const resp = serialize({
    tw:            tw.toFixed(2),
    balance:       fmt(sess.balance),
    index:         sess.index,
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
    counter:       sess.index * 2,
    l:             '20',
    s:             grid.join(','),
    w:             '0',
    'fs_bought':   FS_COUNT,
    fs:            sess.fsCurrentSpin,
    st:            'rect',
    sw:            6,
    fsmul:         sess.fsBombMul || 1,
    fsmul_total:   '1',
    fswin_total:   tw.toFixed(2),
    fs_total:      FS_COUNT,
    fsres_total:   '0.00',
    puri:          sess.isSuperFS ? '1' : '0',
  });

  sess.lastTotalWin = tw;
  // Reset FS state
  sess.isFreeSpins   = false;
  sess.isSuperFS     = false;
  sess.fsCurrentSpin = 0;
  sess.fsTotalWin    = 0;
  sess.reelSet       = 0;
  return resp;
}

// ── doCollect ─────────────────────────────────────────────────────────────────
async function handleCollect(sess) {
  const win = sess.lastTotalWin || 0;
  sess.balance += win;
  sess.lastTotalWin = 0;
  await saveBalance(sess.mgckey, sess.balance);
  return doCollectRNG(sess.balance, sess.index, win);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getField(str, field) {
  const m = str.match(new RegExp(`(?:^|&)${field}=([^&]*)`));
  return m ? m[1] : null;
}

function patchBalance(str, balance) {
  return str
    .replace(/balance=[^&]*/g,      `balance=${fmt(balance)}`)
    .replace(/balance_cash=[^&]*/g, `balance_cash=${fmt(balance)}`);
}

function ensureField(str, field, value) {
  if (str.includes(`${field}=`)) return str;
  return `${str}&${field}=${value}`;
}

function randRow() {
  const syms = [3,4,5,6,7,8,9,10,11];
  return Array.from({length:6}, () => syms[Math.floor(Math.random()*syms.length)]).join(',');
}

module.exports = { handle };
