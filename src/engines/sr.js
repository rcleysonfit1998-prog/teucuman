'use strict';
const db  = require('../config/db');
const rng = require('./sr_rng');

const { doInitRNG, doCollectRNG, fmt, serialize, SCATTER, FS_AWARDS, GRID_SIZE } = rng;

const DEFAULT_BALANCE = parseFloat(process.env.DEFAULT_BALANCE || '50000');

// ── In-memory session state ───────────────────────────────────────────────────
const memState = new Map();

function getState(mgckey) {
  if (!memState.has(mgckey)) {
    memState.set(mgckey, {
      mgckey,
      balance:             DEFAULT_BALANCE,
      index:               1,
      isFreeSpins:         false,
      isSuperFS:           false,
      fsCurrentSpin:       0,
      fsMaxSpin:           10,
      fsTotalWin:          0,
      lastTotalWin:        0,
      hitCounts:           new Array(GRID_SIZE).fill(0),
      hitCountsInitialized: false,
      pendingResponses:    [],
    });
  }
  return memState.get(mgckey);
}

async function loadFromDB(mgckey) {
  const { rows } = await db.query('SELECT * FROM sessions WHERE mgckey=$1', [mgckey]);
  if (rows[0]) {
    const s = getState(mgckey);
    s.balance = parseFloat(rows[0].balance);
    s.index   = rows[0].spin_index || 1;
  }
}

async function persistTransaction(mgckey, bet, win) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO sessions (mgckey, balance) VALUES ($1,$2) ON CONFLICT (mgckey) DO NOTHING`,
      [mgckey, DEFAULT_BALANCE]
    );
    const { rows } = await client.query(
      'SELECT balance FROM sessions WHERE mgckey=$1 FOR UPDATE', [mgckey]
    );
    const newBalance = Math.max(0, parseFloat(rows[0].balance) - bet + win);
    await client.query(
      `UPDATE sessions SET balance=$1, spin_index=spin_index+1, updated_at=NOW() WHERE mgckey=$2`,
      [newBalance, mgckey]
    );
    await client.query('COMMIT');
    return newBalance;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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
    let resp = sess.pendingResponses.shift();
    const reqIndex   = parseInt(params.index   || sess.index + 1);
    const reqCounter = parseInt(params.counter || reqIndex * 2);
    sess.index = reqIndex;
    resp = resp
      .replace(/index=[0-9]+/g,   `index=${reqIndex}`)
      .replace(/counter=[0-9]+/g, `counter=${reqCounter}`)
      .replace(/stime=[0-9]+/g,   `stime=${Date.now()}`);
    return resp;
  }

  const coinValue = parseFloat(params.c || '0.20');
  const pur       = params.pur !== undefined ? parseInt(params.pur) : -1;
  const bl        = parseInt(params.bl || '0');
  sess.index      = parseInt(params.index || sess.index + 1);

  // ── Buy feature ──────────────────────────────────────────────────────────
  // pur=1 = Normal FS (100× total bet), pur=0 = Super FS (500× total bet)
  if (pur === 1 || pur === 0) {
    const isSuperBuy = pur === 0;
    const betMul     = bl === 1 ? 25 : 20;
    const totalBet   = coinValue * betMul;
    const cost       = isSuperBuy ? totalBet * 500 : totalBet * 100;

    const newBalance = await persistTransaction(sess.mgckey, cost, 0);
    sess.balance     = newBalance;

    sess.isFreeSpins          = true;
    sess.isSuperFS            = isSuperBuy;
    sess.fsCurrentSpin        = 1;
    sess.fsMaxSpin            = 10;
    sess.fsTotalWin           = 0;
    sess.hitCountsInitialized = false;
    sess.hitCounts            = isSuperBuy
      ? new Array(GRID_SIZE).fill(2)   // Super FS: all spots start at 2x
      : new Array(GRID_SIZE).fill(0);  // Normal FS: clean

    return await buildAndQueueSpin(sess, params, coinValue, pur);
  }

  // ── Ongoing Free Spins ────────────────────────────────────────────────────
  if (sess.isFreeSpins) {
    sess.fsCurrentSpin++;

    // Check for scatter re-trigger on the previous spin grid
    // (handled inside buildAndQueueSpin via triggerFS flag)

    if (sess.fsCurrentSpin > sess.fsMaxSpin) {
      return buildFSEndResponse(sess, coinValue, params, bl);
    }
    return await buildAndQueueSpin(sess, params, coinValue, undefined);
  }

  // ── Normal spin ───────────────────────────────────────────────────────────
  const betMul = bl === 1 ? 25 : 20;
  const bet    = coinValue * betMul;

  const balanceAfterBet = await persistTransaction(sess.mgckey, bet, 0);
  sess.balance = balanceAfterBet;
  // Reset multiplier spots for base game
  sess.hitCounts = new Array(GRID_SIZE).fill(0);

  return await buildAndQueueSpin(sess, params, coinValue, undefined);
}

// ── Build and queue all tumble responses for one spin ─────────────────────────
async function buildAndQueueSpin(sess, params, coinValue, pur) {
  const { responses, hitCounts } = rng.doSpinRNG({ ...params, pur }, sess);

  // Update session hitCounts (may have been modified during FS tumbling)
  if (sess.isFreeSpins) {
    sess.hitCounts = hitCounts;
  }

  // Get total win from last response
  const lastResp = responses[responses.length - 1];
  const tw = parseFloat(getField(lastResp, 'tw') || '0');

  if (sess.isFreeSpins) {
    sess.fsTotalWin += tw;
    // Check for scatter re-trigger in the grid of the first response
    const s = getField(responses[0], 's');
    if (s && !pur) {
      const grid = s.split(',').map(Number);
      const scatters = grid.filter(x => x === SCATTER).length;
      if (scatters >= 3) {
        const extra = FS_AWARDS[Math.min(scatters, 7)] || 0;
        if (extra > 0) sess.fsMaxSpin += extra;
      }
    }
  } else {
    if (tw > 0) {
      const newBalance = await persistTransaction(sess.mgckey, 0, tw);
      sess.balance = newBalance;
    }
    sess.lastTotalWin = tw;
  }

  const displayBalance = sess.balance;
  const patched = responses.map(r => patchBalance(r, displayBalance));

  const first = patched.shift();
  if (patched.length) sess.pendingResponses.push(...patched);
  return first;
}

// ── FS end response (spin fs=N+1, na=c) ──────────────────────────────────────
function buildFSEndResponse(sess, coinValue, params, bl) {
  const tw   = sess.fsTotalWin;
  const syms = [3,4,5,6,7,8,9];
  const grid = Array.from({ length: GRID_SIZE }, () => syms[Math.floor(Math.random() * syms.length)]);

  const resp = serialize({
    tw:            tw.toFixed(2),
    balance:       fmt(sess.balance),
    index:         params.index,
    balance_cash:  fmt(sess.balance),
    balance_bonus: '0.00',
    na:            'c',
    tmb_win:       '0',
    bl:            bl.toString(),
    stime:         Date.now(),
    sa:            randRow(),
    sb:            randRow(),
    sh:            7,
    c:             coinValue.toFixed(2),
    sver:          '5',
    counter:       params.counter,
    l:             '20',
    s:             grid.join(','),
    w:             '0',
    'fs_bought':   sess.fsMaxSpin,
    fs:            sess.fsCurrentSpin,
    st:            'rect',
    sw:            7,
    fsmul:         '1',
    fsmul_total:   '1',
    fswin_total:   tw.toFixed(2),
    fs_total:      sess.fsMaxSpin,
    fsres_total:   '0.00',
    puri:          sess.isSuperFS ? '0' : '1',
    trail:         'pmp~',
  });

  sess.lastTotalWin  = tw;
  sess.isFreeSpins   = false;
  sess.isSuperFS     = false;
  sess.fsCurrentSpin = 0;
  sess.fsTotalWin    = 0;
  sess.hitCounts     = new Array(GRID_SIZE).fill(0);
  sess.hitCountsInitialized = false;
  return resp;
}

// ── doCollect ─────────────────────────────────────────────────────────────────
async function handleCollect(sess) {
  const win = sess.lastTotalWin || 0;
  if (win > 0) {
    const newBalance = await persistTransaction(sess.mgckey, 0, win);
    sess.balance = newBalance;
  }
  sess.lastTotalWin = 0;
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

function randRow() {
  const syms = [3,4,5,6,7,8,9];
  return Array.from({ length: 7 }, () => syms[Math.floor(Math.random() * syms.length)]).join(',');
}

module.exports = { handle };
