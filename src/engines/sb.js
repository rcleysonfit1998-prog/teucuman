'use strict';
// Se não usar banco, mantenha comentado
// const db = require('../config/db'); 

const rng = require('./rng');
const { generateGrid, calculateWin, serialize, fmt } = rng;

const memState = new Map();

function getState(mgckey) {
  if (!memState.has(mgckey)) {
    memState.set(mgckey, {
      mgckey,
      balance: 50000.00,
      index: 1,
      pendingResponses: []
    });
  }
  return memState.get(mgckey);
}

/**
 * Função principal que o gameService chama
 */
async function handle(action, params) {
  const mgckey = params.mgckey || 'default';
  const sess = getState(mgckey);

  try {
    switch (action) {
      case 'doInit':
        return handleInit(sess);
      case 'doSpin':
        const bet = parseFloat(params.c) * 20; // Converte aposta por linha em total
        return handleSpin(sess, bet);
      case 'doCollect':
        return handleCollect(sess);
      default:
        // Caso venha uma ação desconhecida, tenta o fluxo de spin/pendentes
        return handleSpin(sess, 0);
    }
  } catch (err) {
    console.error('[sb.js Error]:', err);
    return "error=1";
  }
}

// ── Lógica de Inicialização ──────────────────────────────────────────────────
function handleInit(sess) {
  const initData = {
    def_cum: "0.00",
    def_num: "0",
    balance: fmt(sess.balance),
    index: sess.index,
    balance_cash: fmt(sess.balance),
    reel_set: 0,
    sver: 5,
    counter: sess.index * 2,
    st: "rect",
    sw: 6,
    sh: 5,
    c: "0.10",
    l: 20,
    s: "11,10,9,8,7,6,11,10,9,8,7,6,11,10,9,8,7,6,11,10,9,8,7,6,11,10,9,8,7,6" // Grade padrão
  };
  return serialize(initData);
}

// ── Lógica de Spin (Corrigida para Tumbles) ──────────────────────────────────
async function handleSpin(sess, bet) {
  // Se houver resposta de "Collect" na fila (vinda de um ganho anterior), manda ela
  if (sess.pendingResponses && sess.pendingResponses.length > 0) {
    return sess.pendingResponses.shift();
  }

  // Desconta aposta apenas se não for tumble
  if (bet > 0) {
    sess.balance -= bet;
    sess.index++;
  }
  
  const grid = generateGrid(0);
  const { totalWin, winPositions } = calculateWin(grid, bet || 2.0); // 2.0 default se bet vier 0

  const respObj = {
    tw: fmt(totalWin),
    balance: fmt(sess.balance),
    index: sess.index,
    balance_cash: fmt(sess.balance),
    reel_set: 0,
    na: 's', 
    stime: Date.now(),
    sh: 5,
    c: fmt(bet / 20 || 0.10),
    sver: 5,
    counter: sess.index * 2,
    l: 20,
    s: grid.join(','),
    w: fmt(totalWin),
    st: 'rect',
    sw: 6
  };

  if (totalWin > 0) {
    respObj.rs = 't'; 
    respObj.rs_t = 1;
    respObj.tmb_win = fmt(totalWin);
    respObj.l0 = winPositions.join('&');
    respObj.trail = `nmwin~${fmt(totalWin)}`;

    // Cria o pacote de fechamento e guarda na fila
    const collectObj = JSON.parse(JSON.stringify(respObj));
    collectObj.na = 'c';
    collectObj.w = '0';
    delete collectObj.rs;
    delete collectObj.rs_t;
    delete collectObj.l0;

    sess.pendingResponses.push(serialize(collectObj));
    sess.balance += totalWin;
  } else {
    respObj.w = '0';
    respObj.tmb_win = '0';
  }

  return serialize(respObj);
}

// ── Lógica de Coleta ─────────────────────────────────────────────────────────
function handleCollect(sess) {
  // Se o jogo pedir doCollect e tivermos algo na fila, manda
  if (sess.pendingResponses.length > 0) {
    return sess.pendingResponses.shift();
  }
  
  // Resposta padrão de coleta se não houver ganhos
  return serialize({
    balance: fmt(sess.balance),
    index: sess.index,
    na: "s"
  });
}

module.exports = { handle };