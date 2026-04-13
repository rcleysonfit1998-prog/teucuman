'use strict';
const rng = require('./rng');
const { generateGrid, calculateWin, serialize, fmt } = rng;

const memState = new Map();

function getState(mgckey) {
  if (!memState.has(mgckey)) {
    memState.set(mgckey, {
      balance: 50000.00,
      index: 1,
      pendingResponses: []
    });
  }
  return memState.get(mgckey);
}

async function handleSpin(mgckey, bet) {
  const sess = getState(mgckey);
  
  // Se houver respostas pendentes (Tumbles), envia a próxima
  if (sess.pendingResponses.length > 0) {
    return sess.pendingResponses.shift();
  }

  // Novo Spin Normal
  sess.balance -= bet;
  sess.index++;
  
  const grid = generateGrid(0);
  const { totalWin, winPositions } = calculateWin(grid, bet);

  const baseResponse = {
    tw: fmt(totalWin),
    balance: fmt(sess.balance),
    index: sess.index,
    balance_cash: fmt(sess.balance),
    reel_set: 0,
    na: totalWin > 0 ? 's' : 's', // Na versão antiga, na=s inicia o processo
    stime: Date.now(),
    sh: 5,
    c: fmt(bet / 20),
    sver: 5,
    counter: sess.index * 2,
    l: 20,
    s: grid.join(','),
    w: fmt(totalWin), // O ganho do passo atual
    st: 'rect',
    sw: 6
  };

  if (totalWin > 0) {
    // ESSENCIAL: Ativar o modo Tumble no primeiro ganho
    baseResponse.rs = 't'; 
    baseResponse.rs_p = 0;
    baseResponse.rs_c = 1;
    baseResponse.rs_m = 1;
    baseResponse.l0 = winPositions.join('&'); // Diz ao jogo quais símbolos brilham
    baseResponse.trail = `nmwin~${fmt(totalWin)}`;

    // Criar o log de fechamento (Collect) que o jogo pede após a animação
    const collectResponse = { ...baseResponse };
    collectResponse.na = 'c'; // Agora sim, encerra a rodada
    delete collectResponse.rs;
    delete collectResponse.rs_p;
    delete collectResponse.rs_c;
    delete collectResponse.rs_m;
    
    sess.pendingResponses.push(serialize(collectResponse));
    
    // Atualiza saldo no estado
    sess.balance += totalWin;
  } else {
    baseResponse.na = 's';
    baseResponse.w = '0';
  }

  return serialize(baseResponse);
}

module.exports = { handleSpin };