'use strict';

const REEL_SETS = {
  0: [
    [8,11,6,8,4,3,9,11,5,10,6,10,6,10,10,10,9,11,9,11,10,11,8,7,5,3,7,10,9,5,7,7,7,11,1,4,6,8,4,7,8,10,10,9,10,11,7,10],
    [9,11,7,8,7,9,11,6,8,10,4,9,10,8,5,10,8,10,3,4,1,8,11,11,11,7,10,7,1,11,6,11,10,5,5,9,11,9,11,9,6,11,3,8,6,11,10,9,4],
    [6,11,11,3,5,3,9,3,7,9,8,6,8,6,7,7,7,6,10,5,8,10,10,8,4,10,4,10,11,5,10,7,3,3,3,4,10,8,8,11,7,4,8,11,7,1,9,9,11,7,11],
    [7,8,10,6,7,3,6,9,4,6,5,5,10,10,10,11,1,5,10,10,9,9,11,9,10,11,9,11,3,10,11,11,11,5,11,8,11,4,11,10,11,3,4,8,6,11,11,6,7],
    [5,8,9,6,5,9,10,3,9,9,8,4,8,7,7,7,6,9,9,4,9,10,5,11,6,8,1,7,11,9,9,9,8,11,5,11,10,7,11,3,10,4,11,7,9,6,10],
    [5,10,6,11,5,10,6,11,4,6,10,1,9,7,11,8,8,6,4,11,8,11,8,4,4,4,11,7,7,8,4,9,6,10,9,4,9,7,10,11,9,9,5,9,10,3,4,8,4,9,6],
  ],
  1: [
    [11,6,8,9,11,8,10,5,6,12,8,11,8,7,4,10,10,10,3,10,9,10,9,10,11,10,9,5,11,8,1,4,6,11,9,7,11],
    [8,10,9,11,8,9,7,7,5,9,9,10,6,8,10,9,10,11,5,7,4,8,9,10,10,11,10,10,4,1,12,8,11,4,6,11,8,6,11,11,9,6,9,10,11,4,12,11,8,9,5,6,10,11,9,5,3,6,8,3,7],
    [11,9,6,3,9,11,4,11,4,10,8,5,4,8,10,10,11,6,6,3,12,9,11,3,8,4,7,7,7,10,4,1,8,8,11,7,10,8,10,5,9,3,6,9,8,10,11,8,7,8,7,7,5,5,6,7],
    [10,11,10,5,6,3,9,8,3,7,11,9,8,4,10,4,11,11,8,1,9,11,4,9,9,10,9,6,7,10,10,10,7,11,6,12,3,8,10,10,6,6,5,5,11,10,4,11,5,5,10,11,11,7,3,10,10,9,6,10,5,9,11,11],
    [7,9,8,7,5,11,6,9,10,9,11,1,8,8,6,3,10,9,11,7,8,7,7,7,4,10,3,9,6,12,11,7,11,8,5,8,10,9,10,10,5,4,11,9,4,11,9,6],
    [11,9,10,12,9,6,9,9,8,4,7,3,5,11,6,11,10,11,5,11,10,9,7,7,11,10,10,8,8,5,9,1,4,6,11,9,5,3,12,6,4,11,9,8,9,8,9,9,8,6,4,11,10,7,8,10,11,8,10,9,6],
  ],
  2: [
    [5,4,10,10,9,11,7,10,8,6,3,5,6,9,10,8,10,7,10,10,10,4,11,11,9,3,8,10,10,7,4,11,11,1,8,10,9,4,8,7,7,7,8,7,8,10,11,6,11,5,6,9,6,5,11,10,11,9,9,11,10,10],
    [10,9,5,10,5,7,9,11,4,7,5,7,9,3,10,9,10,11,10,11,6,9,4,6,9,4,8,6,6,8,9,11,11,11,10,7,11,10,11,8,4,11,11,10,6,10,8,5,7,11,9,10,11,3,11,9,1,11,8,8,6,1,7,9,11,8,8,11],
    [8,8,6,9,6,11,4,1,5,1,8,3,11,7,7,7,11,8,10,9,5,11,9,4,4,3,9,10,10,8,3,3,3,7,7,3,7,5,4,10,11,11,6,8,6,10,10,7],
    [5,11,6,8,6,6,10,6,11,11,3,9,8,11,5,3,10,7,9,11,10,10,10,9,10,9,9,11,7,10,3,6,4,5,11,9,10,4,11,9,5,6,5,11,3,9,9,9,4,10,11,9,8,4,1,9,6,11,10,5,11,10,10,7,9,7,10,8,10,6,9],
    [10,8,9,4,7,8,3,9,10,10,4,5,6,8,6,11,10,1,3,7,7,7,11,10,5,9,11,11,8,4,8,1,9,7,7,11,5,9,6,9,6,11,5,9],
    [10,4,10,11,5,6,7,4,11,8,7,6,9,11,9,4,10,8,8,9,11,4,7,8,4,11,8,8,1,4,4,4,11,6,3,10,7,9,6,9,5,9,3,4,4,6,10,11,6,9,9,6,9,6,11,9,10,5,10,11,9,10,5,8,8],
  ],
  3: [
    [5,4,9,11,8,11,10,6,10,4,11,11,6,10,3,8,11,10,6,11,9,8,6,7,10,10,10,11,8,10,9,6,7,1,4,10,10,9,11,5,9,10,11,3,10,9,9,11,8,5,12,7,8,8],
    [4,11,10,5,4,11,11,7,11,7,9,4,3,9,10,8,9,8,10,8,3,12,10,6,9,8,11,6,11,5,10,5,12,6,10,8,6,9,9,7,1],
    [11,11,10,8,6,9,8,3,12,8,4,11,9,11,7,11,4,3,7,3,11,10,8,7,10,10,11,7,7,7,4,8,5,9,6,9,6,10,1,8,4,8,4,5,8,9,7,8,5,11,7,3,6,6,7,10,5,10,10],
    [10,11,11,5,1,7,10,6,9,5,7,10,10,5,9,9,11,10,11,6,4,11,3,5,6,10,11,10,10,10,3,10,3,6,10,8,9,7,4,9,8,9,5,8,3,10,11,4,12,8,11,11,4,11,10,11,9,6,9,7],
    [11,11,6,11,8,6,7,1,4,5,8,9,12,3,8,8,4,10,10,9,11,10,10,11,8,9,6,6,9,7,7,7,6,3,10,7,9,9,10,10,6,9,11,11,9,5,11,9,4,8,9,4,8,8,10,11,5,7,5,9,11,7,7,9],
    [9,7,11,6,10,9,11,12,8,1,8,9,10,4,8,10,12,6,3,11,9,5,8,3,7,7,10,9,10,6,11,11,5,10,4,4,11,9,11,9,6,10,11,9,5,8,9,8,6,9,8],
  ],
  4: [
    [5,9,6,8,10,9,11,10,10,11,7,7,6,8,7,10,10,10,7,6,10,8,4,10,8,11,10,11,11,5,10,7,10,10,11,7,7,7,3,4,9,5,11,9,10,8,6,11,11,9,6,10,4,8,9,3],
    [10,6,4,5,8,7,6,7,5,4,4,4,8,8,11,3,6,9,5,10,11,11,8,8,8,9,10,9,11,10,6,11,4,11,11,11,7,10,7,4,8,8,11,9,9,10,9,3],
    [8,3,7,8,10,10,9,10,10,10,4,6,9,10,4,10,11,5,6,7,7,7,8,8,10,9,11,4,11,3,3,3,8,5,7,11,6,11,10,7,3,7],
    [11,4,5,4,10,3,11,10,6,9,9,9,5,6,11,9,9,10,7,8,3,7,10,10,10,3,4,10,9,8,5,11,9,6,11,11,11,8,7,11,6,9,10,10,11,6,11,11,5],
    [9,7,7,6,10,4,9,8,11,10,9,7,9,5,11,11,11,9,10,11,3,5,4,5,11,11,9,10,9,10,9,11,7,7,7,3,5,9,9,11,6,4,8,9,6,6,5,8,8,7,9,9,9,6,8,9,8,11,9,5,6,8,9,11,11,4,10,11,10],
    [9,11,6,11,4,11,10,11,9,5,6,6,4,10,9,7,10,8,4,11,4,4,4,11,9,9,3,6,9,5,4,8,9,4,4,9,6,5,7,11,6,8,3,7,11,6,6,6,10,5,9,7,8,10,6,8,6,10,6,8,11,4,4,8,9,8,7,7,9,10,10],
  ],
};

const PAYTABLE_ROWS = {
  3:  [1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,500,500,200,200,0,0,0,0,0,0,0],
  4:  [500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,200,200,50,50,0,0,0,0,0,0,0],
  5:  [300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,100,100,40,40,0,0,0,0,0,0,0],
  6:  [0,0,0,240,240,240,240,240,240,240,240,240,240,240,240,240,240,240,240,40,40,30,30,0,0,0,0,0,0,0],
  7:  [0,0,0,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,30,30,20,20,0,0,0,0,0,0,0],
  8:  [0,0,0,160,160,160,160,160,160,160,160,160,160,160,160,160,160,160,160,24,24,16,16,0,0,0,0,0,0,0],
  9:  [0,0,0,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,20,20,10,10,0,0,0,0,0,0,0],
  10: [0,0,0,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,18,18,8,8,0,0,0,0,0,0,0],
  11: [0,0,0,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,15,15,5,5,0,0,0,0,0,0,0],
};

const COLS        = 6;
const ROWS        = 5;
const GRID_SIZE   = COLS * ROWS;
const SCATTER_SYM = 1;
const BOMB_SYM    = 12;
const FS_COUNT    = 10;
const FS_TRIGGER  = 4;

function rnd(max) { return Math.floor(Math.random() * max); }

// Sistema de pesos para as bombas (valores menores caem mais vezes)
function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rnd(total);
  for (let i = 0; i < items.length; i++) {
    if (r < weights[i]) return items[i];
    r -= weights[i];
  }
  return items[0];
}

function getRandomBombMul(isSuper) {
  if (isSuper) {
    const muls = [20, 25, 50, 100, 1000];
    const weights = [50, 30, 15, 4, 1]; // 20x e 25x são mais comuns
    return weightedRandom(muls, weights);
  } else {
    const muls = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100, 1000];
    const weights = [100, 100, 80, 80, 60, 50, 40, 30, 20, 10, 5, 2, 1, 1];
    return weightedRandom(muls, weights);
  }
}

function spinGrid(reelSetIdx) {
  const rs = REEL_SETS[reelSetIdx] || REEL_SETS[0];
  const grid = new Array(GRID_SIZE);
  for (let col = 0; col < COLS; col++) {
    const reel = rs[col];
    const stop = rnd(reel.length);
    for (let row = 0; row < ROWS; row++) {
      grid[col * ROWS + row] = reel[(stop + row) % reel.length];
    }
  }
  return grid;
}

function spinGridWithScatters(reelSetIdx, minScatters) {
  let grid, tries = 0;
  do {
    grid = spinGrid(reelSetIdx);
    tries++;
  } while (grid.filter(s => s === SCATTER_SYM).length < minScatters && tries < 1000);
  return grid;
}

function findWins(grid) {
  const counts = {};
  const positions = {};
  for (let i = 0; i < GRID_SIZE; i++) {
    const sym = grid[i];
    if (sym === SCATTER_SYM || sym === BOMB_SYM) continue;
    counts[sym] = (counts[sym] || 0) + 1;
    if (!positions[sym]) positions[sym] = [];
    positions[sym].push(i);
  }

  const wins = [];
  for (const sym in counts) {
    if (counts[sym] >= 8) {
      wins.push({ sym: parseInt(sym), positions: positions[sym] });
    }
  }
  return wins;
}

function applyTumble(grid, wins, bombs, reelSetIdx) {
  const toRemove = new Set();
  for (const w of wins) w.positions.forEach(p => toRemove.add(p));
  for (const b of bombs) toRemove.add(b.pos);

  const newGrid = grid.slice();
  const rs = REEL_SETS[reelSetIdx] || REEL_SETS[0];

  for (let col = 0; col < COLS; col++) {
    const remaining = [];
    for (let row = ROWS - 1; row >= 0; row--) {
      const pos = col * ROWS + row;
      if (!toRemove.has(pos)) remaining.push(newGrid[pos]);
    }
    for (let row = ROWS - 1; row >= 0; row--) {
      const pos = col * ROWS + row;
      const idx = ROWS - 1 - row;
      if (idx < remaining.length) {
        newGrid[pos] = remaining[idx];
      } else {
        let sym;
        const reel = rs[col];
        // 🚨 CORREÇÃO: Bombas PODEM cair durante os tumbles, apenas Scatters não caem.
        do { sym = reel[rnd(reel.length)]; } while (sym === SCATTER_SYM);
        newGrid[pos] = sym;
      }
    }
  }
  return newGrid;
}

function findBombs(grid, isSuper) {
  const bombs = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    if (grid[i] === BOMB_SYM) {
      bombs.push({ pos: i, mul: getRandomBombMul(isSuper) });
    }
  }
  return bombs;
}

function clusterWin(wins, coinValue) {
  let win = 0;
  for (const w of wins) {
    const row = PAYTABLE_ROWS[w.sym];
    if (!row) continue;
    const count = Math.min(w.positions.length, 30);
    const payIdx = 30 - count;
    const pay = row[payIdx] || 0;
    if (pay > 0) win += pay * coinValue;
  }
  return win;
}

function buildTmb(wins, bombs) {
  const parts = [];
  for (const w of wins) for (const p of w.positions) parts.push(`${p},${w.sym}`);
  for (const b of bombs) parts.push(`${b.pos},${BOMB_SYM}`);
  return parts.join('~');
}

function buildSMark(wins, bombs) {
  const parts = [];
  for (const w of wins) for (const p of w.positions) parts.push(`${w.sym}:${p}`);
  for (const b of bombs) parts.push(`${BOMB_SYM}:${b.pos}`);
  if (parts.length === 0) return '';
  return `tmb~${parts.join(',')}`;
}

function buildWinLines(wins, coinValue) {
  const lines = {};
  let idx = 0;
  for (const w of wins) {
    const row = PAYTABLE_ROWS[w.sym];
    if (!row) continue;
    const count = Math.min(w.positions.length, 30);
    const payIdx = 30 - count;
    const pay = (row[payIdx] || 0) * coinValue;
    if (pay > 0) {
      lines[`l${idx}`] = `0~${pay.toFixed(2)}~${w.positions.join('~')}`;
      idx++;
    }
  }
  return lines;
}

function buildRmul(activeBombs) {
  if (!activeBombs.length) return '';
  return activeBombs.map(b => `${BOMB_SYM}~${b.pos}~${b.mul}`).join(';');
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function serialize(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

function randRow() {
  const syms = [3,4,5,6,7,8,9,10,11];
  return Array.from({ length: COLS }, () => syms[rnd(syms.length)]).join(',');
}

function addFSFields(obj, sess, fsMore) {
  obj.fs         = sess.fsCurrentSpin;
  obj.fsmax      = sess.fsMaxSpin;
  obj['fs_bought'] = FS_COUNT;
  obj.fswin      = sess.fsTotalWin.toFixed(2);
  obj.fsmul      = '1';
  obj.fsres      = '0';
  obj.puri       = sess.isSuperFS ? '1' : '0';
  if (fsMore > 0) obj.fs_more = fsMore;
}

// ── doSpinRNG ─────────────────────────────────────────────────────────────────
function doSpinRNG(params, sess) {
  const coinValue  = parseFloat(params.c || '0.20');
  const isSuper    = sess.isSuperFS || false;
  const pur        = params.pur !== undefined ? parseInt(params.pur) : -1;
  const index      = parseInt(params.index || sess.index || 1);
  const counter    = parseInt(params.counter || index * 2);
  const bl         = parseInt(params.bl || '0'); // 🚨 ANTE BET

  let isTriggerSpin = (pur === 0 || pur === 1);
  
  // 🚨 ANTE BET: Dobra a chance de cair scatters naturalmente
  if (!isTriggerSpin && bl === 1 && !sess.isFreeSpins) {
    if (Math.random() < 0.01) { // Simula a chance dobrada forçando um trigger ocasional
      isTriggerSpin = true;
    }
  }

  // 🚨 CORREÇÃO: Usa o Reel Set 1 (com bombas) durante os Free Spins
  const actualReelSet = (sess.isFreeSpins && !isTriggerSpin) ? 1 : 0;
  
  let grid = isTriggerSpin
    ? spinGridWithScatters(actualReelSet, FS_TRIGGER)
    : spinGrid(actualReelSet);

  const scatterCount = grid.filter(s => s === SCATTER_SYM).length;
  let fsMore = 0;

  if (scatterCount >= 4) {
    if (!sess.isFreeSpins) {
      sess.isFreeSpins = true;
      sess.fsCurrentSpin = 1;
      sess.fsMaxSpin = FS_COUNT;
      sess.fsTotalWin = 0;
      isTriggerSpin = true;
    } else if (!isTriggerSpin) {
      sess.fsMaxSpin += 5;
      fsMore = 5;
    }
  }

  let scatterWin = 0;
  if (scatterCount >= 6) scatterWin = 100 * 20 * coinValue;
  else if (scatterCount === 5) scatterWin = 5 * 20 * coinValue;
  else if (scatterCount >= 4) scatterWin = 3 * 20 * coinValue;

  const responses    = [];
  let spinBaseWin    = 0; 
  let activeBombs    = [];
  let cascadeStep    = 0;
  
  let baseTw = sess.isFreeSpins ? sess.fsTotalWin : 0;

  while (true) {
    const wins = findWins(grid);
    const newBombs = findBombs(grid, isSuper);
    for (const b of newBombs) {
      if (!activeBombs.find(ab => ab.pos === b.pos)) activeBombs.push(b);
    }

    if (wins.length === 0) {
      const bombMulSum = activeBombs.reduce((acc, b) => acc + b.mul, 0) || 1;
      const spinTotalWin = spinBaseWin * bombMulSum;
      const tmbRes = (bombMulSum > 1 && spinBaseWin > 0) ? spinTotalWin : 0;
      const finalTw = baseTw + spinTotalWin + scatterWin;
      
      if (cascadeStep === 0) {
        responses.push(buildBaseResponse({
          grid, finalTw, spinBaseWin, coinValue, index, counter, sess, pur, activeBombs, scatterWin, isTriggerSpin, fsMore, bl
        }));
      } else {
        responses.push(buildCascadeEndResponse({
          grid, finalTw, spinBaseWin, tmbRes, coinValue, index, counter, sess, activeBombs, pur, scatterWin, isTriggerSpin, fsMore, bl
        }));
      }
      break;
    }

    const stepWin = clusterWin(wins, coinValue); 
    spinBaseWin += stepWin;

    const tmb = buildTmb(wins, newBombs);
    const s_mark = buildSMark(wins, newBombs);
    const rmul = buildRmul(activeBombs);
    const winLines = buildWinLines(wins, coinValue); 
    const trail = `nmwin~${spinBaseWin.toFixed(2)}`;
    
    const nextGrid = applyTumble(grid, wins, newBombs, actualReelSet);
    cascadeStep++;

    responses.push(buildCascadeStepResponse({
      nextGrid, tmb, s_mark, rmul, trail, winLines,
      baseTw, stepWin, spinBaseWin, coinValue, index, counter,
      sess, cascadeStep, activeBombs, isTriggerSpin, fsMore, bl
    }));

    grid = nextGrid;
  }

  return responses;
}

function buildBaseResponse({ grid, finalTw, spinBaseWin, coinValue, index, counter, sess, pur, activeBombs, scatterWin, isTriggerSpin, fsMore, bl }) {
  const obj = {
    tw:            finalTw.toFixed(2),
    balance:       fmt(sess.balance),
    index,
    balance_cash:  fmt(sess.balance),
    reel_set:      '0',
    balance_bonus: '0.00',
    na:            's',
    tmb_win:       '0',
    bl:            bl.toString(),
    stime:         Date.now(),
    sa:            randRow(),
    sb:            randRow(),
    sh:            ROWS,
    c:             coinValue.toFixed(2),
    sver:          '5',
    counter,
    l:             '20',
    s:             grid.join(','),
    w:             scatterWin > 0 ? scatterWin.toFixed(2) : '0',
    st:            'rect',
    sw:            COLS,
  };

  // 🚨 CORREÇÃO: Se houver bombas na tela, MESMO SEM GANHO, o rmul é OBRIGATÓRIO!
  if (activeBombs && activeBombs.length > 0) {
    obj.rmul = buildRmul(activeBombs);
  }

  if (scatterWin > 0) {
    const scatterPos = [];
    grid.forEach((s, i) => { if (s === SCATTER_SYM) scatterPos.push(i); });
    obj.psym = `1~${scatterWin.toFixed(2)}~${scatterPos.join('~')}`;
  }

  if (sess.isFreeSpins && !isTriggerSpin) {
    addFSFields(obj, sess, fsMore);
  }

  if (isTriggerSpin) {
    obj.puri = pur !== -1 ? pur : '0';
    obj.purtr = '1';
    obj.fs = '1';
    obj.fsmax = FS_COUNT;
    obj['fs_bought'] = FS_COUNT;
    obj.fswin = '0.00';
    obj.fsmul = '1';
    obj.fsres = '0';
  }

  return serialize(obj);
}

function buildCascadeStepResponse({ nextGrid, tmb, s_mark, rmul, trail, winLines, baseTw, stepWin, spinBaseWin, coinValue, index, counter, sess, cascadeStep, activeBombs, isTriggerSpin, fsMore, bl }) {
  const obj = {
    tw:            baseTw.toFixed(2),
    tmb,
    balance:       fmt(sess.balance),
    index,
    balance_cash:  fmt(sess.balance),
    reel_set:      '0',
    balance_bonus: '0.00',
    na:            's',
    rs:            't',
    tmb_win:       spinBaseWin.toFixed(2),
    bl:            bl.toString(), // 🚨 ANTE BET
    stime:         Date.now(),
    sa:            randRow(),
    sb:            randRow(),
    rs_p:          '0',
    rs_c:          cascadeStep,
    sh:            ROWS,
    rs_m:          '1',
    c:             coinValue.toFixed(2),
    sver:          '5',
    counter,
    l:             '20',
    s:             nextGrid.join(','),
    w:             stepWin.toFixed(2),
    trail,
    st:            'rect',
    sw:            COLS,
    s_mark,
    ...winLines,
  };

  if (rmul) obj.rmul = rmul;
  
  if (sess.isFreeSpins && !isTriggerSpin) {
    addFSFields(obj, sess, fsMore);
  }

  return serialize(obj);
}

function buildCascadeEndResponse({ grid, finalTw, spinBaseWin, tmbRes, coinValue, index, counter, sess, activeBombs, pur, scatterWin, isTriggerSpin, fsMore, bl }) {
  const obj = {
    tw:            finalTw.toFixed(2),
    balance:       fmt(sess.balance),
    index,
    balance_cash:  fmt(sess.balance),
    reel_set:      '0',
    balance_bonus: '0.00',
    na:            's',
    rs_t:          '1',
    tmb_win:       spinBaseWin.toFixed(2),
    bl:            bl.toString(),
    stime:         Date.now(),
    sa:            randRow(),
    sb:            randRow(),
    sh:            ROWS,
    c:             coinValue.toFixed(2),
    sver:          '5',
    counter,
    l:             '20',
    s:             grid.join(','),
    w:             '0',
    trail:         `nmwin~${spinBaseWin.toFixed(2)}`,
    st:            'rect',
    sw:            COLS,
  };

  // 🚨 CORREÇÃO: Garante que o rmul seja enviado se houver bombas, independente do ganho
  if (activeBombs && activeBombs.length > 0) {
    obj.rmul = buildRmul(activeBombs);
    
    if (spinBaseWin > 0) {
      const totalMul = activeBombs.reduce((a, b) => a + b.mul, 0);
      obj.trail    = `nmwin~${spinBaseWin.toFixed(2)};totmul~${totalMul}`;
      obj.tmb_res  = tmbRes.toFixed(2);
    }
  }

  if (scatterWin > 0) {
    const scatterPos = [];
    grid.forEach((s, i) => { if (s === SCATTER_SYM) scatterPos.push(i); });
    obj.psym = `1~${scatterWin.toFixed(2)}~${scatterPos.join('~')}`;
  }

  if (sess.isFreeSpins && !isTriggerSpin) {
    addFSFields(obj, sess, fsMore);
  }

  if (isTriggerSpin) {
    obj.puri = pur !== -1 ? pur : '0';
    obj.purtr = '1';
    obj.fs = '1';
    obj.fsmax = FS_COUNT;
    obj['fs_bought'] = FS_COUNT;
    obj.fswin = '0.00';
    obj.fsmul = '1';
    obj.fsres = '0';
  }

  return serialize(obj);
}

function doInitRNG(balance) {
  const defGrid = spinGrid(0);
  const reelSetFields = {};
  for (let i = 0; i < 5; i++) {
    // 🚨 CORREÇÃO: Fallback de segurança. Se o REEL_SETS[i] não existir, usa o 0.
    const rs = REEL_SETS[i] || REEL_SETS[0];
    reelSetFields[`reel_set${i}`] = rs.map(r => r.join(',')).join('~');
  }

  // ... (o resto da função continua igual)

  const PAYTABLE_STR = (() => {
    const rows = [];
    for (let sym = 0; sym <= 12; sym++) {
      const pt = PAYTABLE_ROWS[sym];
      if (pt) {
        const row = new Array(30).fill(0);
        for (let i = 0; i < pt.length; i++) row[i] = pt[i];
        rows.push(row.join(','));
      } else {
        rows.push(new Array(30).fill(0).join(','));
      }
    }
    return rows.join(';');
  })();

  return serialize({
    is1000:        'true',
    def_s:         defGrid.join(','),
    balance:       fmt(balance),
    cfgs:          '1',
    ver:           '3',
    index:         '1',
    balance_cash:  fmt(balance),
    def_sb:        randRow(),
    reel_set_size: '5',
    def_sa:        randRow(),
    reel_set:      '0',
    balance_bonus: '0.00',
    na:            's',
    scatters:      '1~2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,100,60,0,0,0~0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0~1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1',
    rt:            'd',
    'gameInfo':    '{rtps:{ante:"96.50",purchase_1:"96.55",purchase_0:"96.52",regular:"96.53"},props:{max_rnd_sim:"1",max_rnd_hr:"71428571",max_rnd_win:"25000",max_rnd_win_a:"20000",max_rnd_hr_a:"47619048"}}',
    wl_i:          'tbm~25000;tbm_a~20000',
    bl:            '0',
    stime:         Date.now(),
    sa:            randRow(),
    sb:            randRow(),
    sc:            '0.01,0.02,0.03,0.04,0.05,0.10,0.20,0.30,0.40,0.50,0.75,1.00,2.00,3.00,4.00,5.00,6.00,7.00,8.00,9.00,10.00,11.00,12.00',
    defc:          '0.10',
    purInit_e:     '1,1',
    sh:            ROWS,
    wilds:         '2~0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0~1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1',
    bonuses:       '0',
    st:            'rect',
    c:             '0.10',
    sw:            COLS,
    sver:          '5',
    bls:           '20,25',
    counter:       '2',
    ntp:           '0.00',
    paytable:      PAYTABLE_STR,
    l:             '20',
    total_bet_max: '120,000.00',
    ...reelSetFields,
    s:             defGrid.join(','),
    purInit:       '[{bet:2000,type:"default"},{bet:10000,type:"default"}]',
    total_bet_min: '0.01',
  });
}

function doCollectRNG(balance, index) {
  return serialize({
    index,
    counter:       index * 2,
    balance:       fmt(balance),
    balance_cash:  fmt(balance),
    balance_bonus: '0.00',
    na:            's',
    sver:          '5',
    stime:         Date.now(),
  });
}

module.exports = { doSpinRNG, doInitRNG, doCollectRNG, fmt, serialize, SCATTER_SYM, BOMB_SYM, FS_COUNT, FS_TRIGGER };