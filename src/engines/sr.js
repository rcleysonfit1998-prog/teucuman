'use strict';
const db  = require('../config/db');
const rng = require('./sr_rng');

const { doInitRNG, fmt, serialize, SCATTER, FS_AWARDS, GRID_SIZE } = rng;

const DEFAULT_BALANCE = parseFloat(process.env.DEFAULT_BALANCE || '50000');

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
      hitCounts:           new Array(GRID_SIZE).fill(0),
      hitCountsInitialized: false,
      retriggered:         false,
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

async function handle(action, params) {
  const mgckey = params.mgckey || 'default';
  await loadFromDB(mgckey);
  const sess = getState(mgckey);

  switch (action) {
    case 'doInit':    return handleInit(sess, params);
    case 'doSpin':    return handleSpin(sess, params);
    case 'doCollect': return handleCollect(sess, params); // ⬅️ CORREÇÃO: params adicionado!
    default:
      return `balance=${fmt(sess.balance)}&balance_cash=${fmt(sess.balance)}&balance_bonus=0.00&na=s&stime=${Date.now()}`;
  }
}

async function handleInit(sess, params) {
  sess.index = 1;
  return rng.doInitRNG(sess.balance, params);
}

async function handleSpin(sess, params) {
  // Return queued tumble step if pending
  if (sess.pendingResponses.length > 0) {
    let resp = sess.pendingResponses.shift();
    const reqIndex   = parseInt(params.index   || sess.index + 1);
    const reqCounter = parseInt(params.counter || reqIndex * 2);
    sess.index = reqIndex;
    resp = resp
      .replace(/index=[0-9]+/g,   `index=${reqIndex}`)
      .replace(/counter=[0-9]+/g, `counter=${reqCounter + 1}`) // ⬅️ CORREÇÃO: Sempre +1
      .replace(/stime=[0-9]+/g,   `stime=${Date.now()}`);
    return resp;
  }

  const coinValue = parseFloat(params.c || '0.20');
  const pur       = params.pur !== undefined ? parseInt(params.pur) : -1;
  const bl        = parseInt(params.bl || '0');
  sess.index      = parseInt(params.index || sess.index + 1);

  // ── Buy feature ──────────────────────────────────────────────────────────
  if (pur === 1 || pur === 0) {
    const isSuperBuy = pur === 1;
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
    sess.retriggered          = false;
    sess.hitCountsInitialized = false;
    sess.hitCounts            = isSuperBuy
      ? new Array(GRID_SIZE).fill(2)
      : new Array(GRID_SIZE).fill(0);

    return await buildAndQueueSpin(sess, params, coinValue, pur);
  }

  // ── Ongoing Free Spins ────────────────────────────────────────────────────
  if (sess.isFreeSpins) {
    if (sess.retriggered) {
        sess.retriggered = false;
    } else {
        sess.fsCurrentSpin++;
    }

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
  sess.hitCounts = new Array(GRID_SIZE).fill(0);

  return await buildAndQueueSpin(sess, params, coinValue, undefined);
}

async function buildAndQueueSpin(sess, params, coinValue, pur) {
  const { responses, hitCounts } = rng.doSpinRNG({ ...params, pur }, sess);

  if (sess.isFreeSpins) {
    sess.hitCounts = hitCounts;
  }

  const lastResp = responses[responses.length - 1];
  const tw = parseFloat(getField(lastResp, 'tw') || '0');

  if (sess.isFreeSpins) {
    sess.fsTotalWin = tw;
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

function buildFSEndResponse(sess, coinValue, params, bl) {
  const tw   = sess.fsTotalWin;
  const syms = [3,4,5,6,7,8,9];
  const grid = Array.from({ length: GRID_SIZE }, () => syms[Math.floor(Math.random() * syms.length)]);

  const slm = rng.buildSlm(sess.hitCounts);
  const slmFields = slm.slm_mp !== undefined ? { slm_mp: slm.slm_mp, slm_mv: slm.slm_mv } : {};

  const resp = serialize({
    tw:            tw.toFixed(2),
    balance:       fmt(sess.balance),
    index:         params.index,
    balance_cash:  fmt(sess.balance),
    balance_bonus: '0.00',
    na:            'c',
    tmb_win:       '0',
    stime:         Date.now(),
    sa:            rng.randRow(),
    sb:            rng.randRow(),
    sh:            7,
    c:             coinValue.toFixed(2),
    sver:          '5',
    counter:       params.counter,
    l:             '20',
    s:             grid.join(','),
    w:             '0',
    fs:            sess.fsCurrentSpin,
    sw:            7,
    st:            'rect',
    fsmul:         '1',
    fsmul_total:   '1',
    fswin_total:   '0.00',
    fs_total:      sess.fsMaxSpin,
    fsres_total:   '0.00',
    puri:          sess.isSuperFS ? '1' : '0',
    trail:         rng.buildTrail(sess.hitCounts),
    ...slmFields
  });

  sess.lastTotalWin  = tw;
  sess.isFreeSpins   = false;
  sess.isSuperFS     = false;
  sess.fsCurrentSpin = 0;
  sess.fsTotalWin    = 0;
  sess.hitCounts     = new Array(GRID_SIZE).fill(0);
  sess.hitCountsInitialized = false;
  sess.retriggered   = false;
  return resp;
}

async function handleCollect(sess, params) {
  const win = sess.lastTotalWin || 0;
  if (win > 0) {
    const newBalance = await persistTransaction(sess.mgckey, 0, win);
    sess.balance = newBalance;
  }
  sess.lastTotalWin = 0;
  
  // ⬅️ CORREÇÃO: Lê o index e counter que o cliente enviou
  const reqIndex = params.index || sess.index;
  const reqCounter = params.counter || (reqIndex * 2);
  sess.index = parseInt(reqIndex);

  return rng.doCollectRNG(sess.balance, reqIndex, reqCounter);
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

module.exports = { handle };