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
      balance:          DEFAULT_BALANCE,
      index:            1,
      reelSet:          0,
      isFreeSpins:      false,
      isSuperFS:        false,
      fsCurrentSpin:    0,
      fsMaxSpin:        FS_COUNT,
      fsTotalWin:       0,
      lastTotalWin:     0,
      pendingResponses: [],
    });
  }
  return memState.get(mgckey);
}

// ─────────────────────────────────────────────────────────────────────────────
// CORREÇÃO 1 (era linhas 30-39):
// loadFromDB agora LANÇA o erro ao invés de engoli-lo.
// Se o DB estiver fora, o spin não acontece — evita usar DEFAULT_BALANCE
// silenciosamente como se fosse o saldo real do jogador.
// ─────────────────────────────────────────────────────────────────────────────
async function loadFromDB(mgckey) {
  const { rows } = await db.query('SELECT * FROM sessions WHERE mgckey=$1', [mgckey]);
  if (rows[0]) {
    const s = getState(mgckey);
    s.balance = parseFloat(rows[0].balance);
    s.index   = rows[0].spin_index || 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CORREÇÃO 2 (era linhas 41-49):
// saveBalance agora usa uma transação atômica:
//   - Lê o balance atual do DB (SELECT FOR UPDATE = lock da linha)
//   - Aplica delta = -bet + win
//   - Faz UPDATE atômico
//   - Lança erro se falhar — o chamador deve tratar
//
// Isso garante que:
//   a) Dois spins simultâneos não corrompem o saldo
//   b) O saldo só é atualizado se a escrita for confirmada
//   c) Erros de DB chegam ao chamador e param o spin
// ─────────────────────────────────────────────────────────────────────────────
async function persistTransaction(mgckey, bet, win) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Cria sessão se não existir, ou bloqueia a linha para update atômico
    await client.query(
      `INSERT INTO sessions (mgckey, balance)
       VALUES ($1, $2)
       ON CONFLICT (mgckey) DO NOTHING`,
      [mgckey, DEFAULT_BALANCE]
    );

    const { rows } = await client.query(
      'SELECT balance FROM sessions WHERE mgckey=$1 FOR UPDATE',
      [mgckey]
    );

    const currentBalance = parseFloat(rows[0].balance);
    const newBalance     = Math.max(0, currentBalance - bet + win);

    await client.query(
      `UPDATE sessions
       SET balance=$1, spin_index=spin_index+1, updated_at=NOW()
       WHERE mgckey=$2`,
      [newBalance, mgckey]
    );

    await client.query('COMMIT');
    return newBalance;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err; // relança — o chamador recebe o erro e para o spin
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function handle(action, params) {
  const mgckey = params.mgckey || 'default';

  // CORREÇÃO 1 aplicada: erro de DB chega até o Express e retorna 500
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
  // Retorna próximo step da fila (cascatas pendentes) — sem custo de DB
  if (sess.pendingResponses.length > 0) {
    let resp = sess.pendingResponses.shift();
    const reqIndex   = params.index   || (sess.index + 1);
    const reqCounter = params.counter || (reqIndex * 2);
    sess.index = parseInt(reqIndex);
    resp = resp.replace(/index=[0-9]+/g,   `index=${reqIndex}`);
    resp = resp.replace(/counter=[0-9]+/g, `counter=${reqCounter}`);
    resp = resp.replace(/stime=[0-9]+/g,   `stime=${Date.now()}`);
    return resp;
  }

  const coinValue = parseFloat(params.c || '0.20');
  const pur       = params.pur !== undefined ? parseInt(params.pur) : -1;
  const bl        = parseInt(params.bl || '0');
  sess.index      = parseInt(params.index || sess.index + 1);

  // ── Buy Feature ────────────────────────────────────────────────────────────
  if (pur === 1 || pur === 0) {
    const isSuperBuy = pur === 1;
    const cost       = isSuperBuy ? coinValue * 10000 : coinValue * 2000;

    // CORREÇÃO 2 aplicada: persistTransaction lança erro se DB falhar
    // O spin não acontece se não conseguir debitar
    const newBalance = await persistTransaction(sess.mgckey, cost, 0);
    sess.balance     = newBalance;

    sess.isFreeSpins    = true;
    sess.isSuperFS      = isSuperBuy;
    sess.fsCurrentSpin  = 1;
    sess.fsMaxSpin      = FS_COUNT;
    sess.fsTotalWin     = 0;
    sess.reelSet        = 0;

    return await buildAndQueueSpin(sess, params, coinValue, pur);
  }

  // ── Free Spins em andamento ────────────────────────────────────────────────
  if (sess.isFreeSpins) {
    sess.fsCurrentSpin++;
    if (sess.fsCurrentSpin > sess.fsMaxSpin) {
      return buildFSEndResponse(sess, coinValue, params, bl);
    }
    return await buildAndQueueSpin(sess, params, coinValue, undefined);
  }

  // ── Spin normal ────────────────────────────────────────────────────────────
  const betMultiplier = bl === 1 ? 25 : 20;
  const bet           = coinValue * betMultiplier;

  // CORREÇÃO 2 aplicada: debita o bet atomicamente ANTES de gerar o spin.
  // Se o DB falhar aqui, o spin não acontece — sem spin grátis.
  const balanceAfterBet = await persistTransaction(sess.mgckey, bet, 0);
  sess.balance = balanceAfterBet;

  return await buildAndQueueSpin(sess, params, coinValue, undefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// CORREÇÃO 3 (era linha 126-137):
// displayBalance agora é o balance APÓS bet e APÓS win — o que o jogador
// realmente tem. Antes mostrava o balance pré-win durante a animação.
//
// CORREÇÃO 4 (era linha 133):
// await adicionado no saveBalance do win normal.
//
// CORREÇÃO 5 (era linha 128-129):
// fsTotalWin agora acumula (+=) corretamente ao invés de sobrescrever (=).
// ─────────────────────────────────────────────────────────────────────────────
async function buildAndQueueSpin(sess, params, coinValue, pur) {
  const responses = rng.doSpinRNG({ ...params, pur }, sess);

  const lastResp = responses[responses.length - 1];
  const tw       = parseFloat(getField(lastResp, 'tw') || '0');

  if (sess.isFreeSpins) {
    // CORREÇÃO 5: acumula corretamente
    sess.fsTotalWin += tw;
    // FS não credita win agora — crédito acontece no doCollect após o spin 11
  } else {
    if (tw > 0) {
      // CORREÇÃO 2 + 4: persiste o win atomicamente com await
      // Se o DB falhar, o erro sobe — o cliente receberá 500
      const newBalance = await persistTransaction(sess.mgckey, 0, tw);
      sess.balance = newBalance;
    }
  }

  // CORREÇÃO 3: displayBalance agora reflete o saldo real atual
  const displayBalance = sess.balance;

  const patched = responses.map(r => patchBalance(r, displayBalance));
  const first   = patched.shift();
  if (patched.length) sess.pendingResponses.push(...patched);
  return first;
}

async function buildFSEndResponse(sess, coinValue, params, bl) {
  const syms = [3,4,5,6,7,8,9,10,11];
  const grid = Array.from({ length: 30 }, () => syms[Math.floor(Math.random() * syms.length)]);
  const tw   = sess.fsTotalWin;

  const resp = serialize({
    tw:            tw.toFixed(2),
    balance:       fmt(sess.balance),
    index:         params.index,
    balance_cash:  fmt(sess.balance),
    reel_set:      '0',
    balance_bonus: '0.00',
    na:            'c',
    tmb_win:       '0',
    bl:            bl.toString(),
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
    fswin_total:   tw.toFixed(2),
    fs_total:      sess.fsMaxSpin,
    fsres_total:   '0.00',
    puri:          sess.isSuperFS ? '1' : '0',
  });

  sess.lastTotalWin  = tw;
  sess.isFreeSpins   = false;
  sess.isSuperFS     = false;
  sess.fsCurrentSpin = 0;
  sess.fsTotalWin    = 0;
  sess.reelSet       = 0;
  return resp;
}

async function handleCollect(sess, params) {
  const win = sess.lastTotalWin || 0;
  sess.index = parseInt(params.index || sess.index + 1);

  if (win > 0) {
    // CORREÇÃO 2 aplicada: persiste o crédito do win atomicamente
    const newBalance = await persistTransaction(sess.mgckey, 0, win);
    sess.balance = newBalance;
  }

  sess.lastTotalWin = 0;
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
  return Array.from({ length: 6 }, () => syms[Math.floor(Math.random() * syms.length)]).join(',');
}

module.exports = { handle };