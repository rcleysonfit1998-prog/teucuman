'use strict';

// ── Sweet Bonanza 1000 RNG Engine ─────────────────────────────────────────────
// Based on analysis of GameProtocolDictionary and real HAR responses
//
// Grid: 6 columns × 5 rows = 30 positions
// Position index: col-major → pos = col*5 + row  (0..29)
// Symbols: 1=scatter(lollipop) 2=wild(unused) 3..11=fruits 12=bomb(multiplier)
// Mechanics: cluster pays (tumbling), no paylines

// ── Reel data extracted from doInit ──────────────────────────────────────────
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
    [11,6,8,9,11,8,10,5,6,12,8,11,8,7,4,10,10,10,3,10,9,10,9,10,11,10,9,5,11,8,1,4,6,8,5,9,11],
    [8,9,10,10,8,11,10,9,10,8,11,10,8,6,7,9,8,7,11,9,11,6,8,5,9,11,11,3,10,8,11,10,8,11,10,8,6,11,5,9,8,4,10,8,10,9,7,10,11,8,4,10,8,9,10,11,8,10,11,8,10,11],
    [5,4,10,10,9,11,7,10,8,6,3,5,6,9,10,8,10,7,10,10,10,4,11,11,9,3,8,10,10,7,4,11,11,5,11,9,10,8,5,11,6,11,6,7,4,11,7,11,8,3,5,10,11,10,11,11],
    [4,11,8,11,11,10,8,11,10,9,10,9,11,7,8,5,6,11,10,9,10,8,11,10,10,8,9,10,4,11,10,9,11,10,11,10,9,11,8,9,11,9,10,11,10,9,10,8,11,10,4,10,9,11,10,11,10,8,10,9,10,9,11,10],
    [5,9,10,11,10,9,5,10,8,11,9,10,8,6,11,9,10,9,8,10,11,10,5,11,9,8,4,11,9,10,8,9,11,10,8,9,5,11,10,9,11,10,9,11,10,9,11,10],
    [4,8,10,9,11,8,10,9,4,8,11,10,9,4,9,10,11,8,4,11,9,10,9,4,8,10,11,10,9,4,10,11,10,4,8,9,10,11,4,8,9,10,9,11,8,10,9,11,4,10,9,11,8,4,10,9,11,10,9,11],
  ],
  2: [
    [5,4,10,10,9,11,7,10,8,6,3,5,6,9,10,8,10,7,10,10,10,4,11,11,9,3,8,10,10,7,4,11,11,5,11,9,10,8,5,11,6,11,6,7,4,11,7,11,8,3,5,10,11,10,11,11,8,10,11,10,4,10,11],
    [9,10,8,11,10,9,11,8,10,9,11,10,8,9,11,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,10,8,9,11,8,10,9,11,8,10,9,11,10,8,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10],
    [8,11,9,10,8,11,9,10,8,11,10,9,8,11,10,9,8,11,9,10,8,11,9,10,8,11,9,10,8,11,10,9,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10],
    [10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11],
    [9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11],
    [8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8],
  ],
  3: [
    [5,4,9,11,8,11,10,6,10,4,11,11,6,10,3,8,11,10,6,11,9,8,6,7,10,10,10,11,8,10,9,6,7,9,4,7,11,9,10,3,11,7,9,4,10,6,11,9,3,9,10,11,6,10],
    [8,9,11,10,8,7,9,11,10,8,9,11,8,10,9,7,8,9,10,11,8,9,11,10,8,9,10,11,8,10,9,11,8,9,10,11,8,9,10,11],
    [6,9,10,11,8,6,9,10,11,8,9,6,10,11,8,9,10,6,11,8,9,10,11,6,8,9,10,11,6,8,9,10,6,11,8,9,10,11,6,8,9,10,11,6,8,9,10,11,6,8,9,6,10,11,8,9,10,11,6],
    [9,10,8,11,10,9,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,11,8,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11,9,10,8,11],
    [8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11],
    [10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11],
  ],
  4: [
    [5,9,6,8,10,9,11,10,10,11,7,7,6,8,7,10,10,10,7,6,10,8,4,10,8,11,10,11,11,5,10,7,1,7,9,3,9,7,11,9,10,10,4,3,11,7,9,3,10,9,11,5,4,7,10,8],
    [9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10],
    [8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10,11,8,9,10],
    [10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10,11,9,8,10],
    [9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9,8,11,10,9],
    [8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9,11,8,10,9],
  ],
};

// Paytable: paytable[symbol][count] = multiplier (symbol 3..11, count 1..30)
// Extracted from doInit paytable field
const PAYTABLE = {
  3:  { min: 8, pays: [1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,500,500,200,200] },
  4:  { min: 8, pays: [500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,200,200,50,50] },
  5:  { min: 8, pays: [300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,300,100,100,40,40] },
  6:  { min: 5, pays: [0,0,0,240,240,240,240,240,240,240,240,240,240,240,240,240,240,240,240,40,40,30,30] },
  7:  { min: 5, pays: [0,0,0,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,30,30,20,20] },
  8:  { min: 5, pays: [0,0,0,160,160,160,160,160,160,160,160,160,160,160,160,160,160,160,160,24,24,16,16] },
  9:  { min: 5, pays: [0,0,0,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,20,20,10,10] },
  10: { min: 5, pays: [0,0,0,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,18,18,8,8] },
  11: { min: 5, pays: [0,0,0,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,15,15,5,5] },
};

const COLS = 6;
const ROWS = 5;
const GRID_SIZE = COLS * ROWS; // 30
const SCATTER_SYM = 1;
const BOMB_SYM    = 12;
const FS_TRIGGER_COUNT = 4; // 4+ scatters trigger freespins
const FS_COUNT    = 10;

// Bomb multiplier values during freespins
const BOMB_MULS_NORMAL = [2, 3, 4, 5];
const BOMB_MULS_SUPER  = [20, 25, 30, 35, 40, 50]; // min 20x

function rndInt(max) { return Math.floor(Math.random() * max); }

// ── Spin a reel set to get a 6x5 grid ────────────────────────────────────────
function spinGrid(reelSetIdx) {
  const reelSet = REEL_SETS[reelSetIdx] || REEL_SETS[0];
  const grid = new Array(GRID_SIZE);
  for (let col = 0; col < COLS; col++) {
    const reel = reelSet[col];
    const stop = rndInt(reel.length);
    for (let row = 0; row < ROWS; row++) {
      const sym = reel[(stop + row) % reel.length];
      grid[col * ROWS + row] = sym;
    }
  }
  return grid;
}

// ── For pur=1 (buy freespins): guarantee 4+ scatters ─────────────────────────
function spinGridWithScatters(reelSetIdx, minScatters) {
  let grid, attempts = 0;
  do {
    grid = spinGrid(reelSetIdx);
    attempts++;
  } while (grid.filter(s => s === SCATTER_SYM).length < minScatters && attempts < 500);
  return grid;
}

// ── Find clusters (connected groups of same symbol) ──────────────────────────
function findClusters(grid) {
  const visited = new Array(GRID_SIZE).fill(false);
  const clusters = [];

  function getNeighbors(pos) {
    const col = Math.floor(pos / ROWS);
    const row = pos % ROWS;
    const n = [];
    if (row > 0)      n.push(col * ROWS + row - 1);
    if (row < ROWS-1) n.push(col * ROWS + row + 1);
    if (col > 0)      n.push((col-1) * ROWS + row);
    if (col < COLS-1) n.push((col+1) * ROWS + row);
    return n;
  }

  for (let i = 0; i < GRID_SIZE; i++) {
    if (visited[i] || grid[i] === SCATTER_SYM || grid[i] === BOMB_SYM || grid[i] === 0) continue;
    const sym = grid[i];
    const cluster = [];
    const queue = [i];
    visited[i] = true;
    while (queue.length) {
      const pos = queue.shift();
      cluster.push(pos);
      for (const nb of getNeighbors(pos)) {
        if (!visited[nb] && grid[nb] === sym) {
          visited[nb] = true;
          queue.push(nb);
        }
      }
    }
    if (cluster.length >= (PAYTABLE[sym] ? (PAYTABLE[sym].min || 5) : 5)) {
      clusters.push({ sym, positions: cluster });
    }
  }
  return clusters;
}

// ── Apply tumbling: remove winning symbols, drop down ─────────────────────────
function applyTumble(grid, clusters, bombs) {
  const toRemove = new Set();
  for (const c of clusters) c.positions.forEach(p => toRemove.add(p));
  // also remove exploded bombs
  for (const b of bombs) toRemove.add(b.pos);

  const newGrid = grid.slice();
  for (let col = 0; col < COLS; col++) {
    // collect remaining symbols in this col (bottom to top)
    const remaining = [];
    for (let row = ROWS - 1; row >= 0; row--) {
      const pos = col * ROWS + row;
      if (!toRemove.has(pos)) remaining.push(newGrid[pos]);
    }
    // fill from bottom, top positions get 0 (will be filled with new symbols)
    for (let row = ROWS - 1; row >= 0; row--) {
      const pos = col * ROWS + row;
      const idx = ROWS - 1 - row;
      newGrid[pos] = remaining[idx] !== undefined ? remaining[idx] : 0;
    }
  }

  // Fill empty (0) positions with new random symbols (no scatter, no bomb during normal tumble)
  const reelSet = REEL_SETS[0];
  for (let i = 0; i < GRID_SIZE; i++) {
    if (newGrid[i] === 0) {
      const col = Math.floor(i / ROWS);
      const reel = reelSet[col];
      newGrid[i] = reel[rndInt(reel.length)];
      // avoid scatter/bomb in refill
      if (newGrid[i] === SCATTER_SYM || newGrid[i] === BOMB_SYM) {
        newGrid[i] = [3,4,5,6,7,8,9,10,11][rndInt(9)];
      }
    }
  }
  return newGrid;
}

// ── Find bombs and collect their multipliers ──────────────────────────────────
function findBombs(grid, isSuperFS) {
  const bombs = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    if (grid[i] === BOMB_SYM) {
      const muls = isSuperFS ? BOMB_MULS_SUPER : BOMB_MULS_NORMAL;
      bombs.push({ pos: i, mul: muls[rndInt(muls.length)] });
    }
  }
  return bombs;
}

// ── Compute win for one tumble step ──────────────────────────────────────────
function computeStepWin(clusters, coinValue, accMul, bombs) {
  let win = 0;
  const bombMul = bombs.reduce((acc, b) => acc + b.mul, 0) || 1;
  const effectiveMul = accMul * bombMul;

  for (const c of clusters) {
    const pt = PAYTABLE[c.sym];
    if (!pt) continue;
    const count = Math.min(c.positions.length, 30);
    const payIdx = count - 1;
    const mult = pt.pays[payIdx] || 0;
    if (mult > 0) win += mult * coinValue * effectiveMul;
  }
  return { win, effectiveMul, bombMul };
}

// ── Build tmb field: "pos,sym~pos,sym~..." ────────────────────────────────────
function buildTmb(clusters, bombs) {
  const parts = [];
  for (const c of clusters) {
    for (const p of c.positions) parts.push(`${p},${c.sym}`);
  }
  for (const b of bombs) parts.push(`${b.pos},${BOMB_SYM}`);
  return parts.join('~');
}

// ── Build l0,l1... win lines field ────────────────────────────────────────────
function buildWinLines(clusters, coinValue, accMul) {
  const lines = {};
  let lineIdx = 0;
  for (const c of clusters) {
    const pt = PAYTABLE[c.sym];
    if (!pt) continue;
    const count = Math.min(c.positions.length, 30);
    const mult = pt.pays[count-1] || 0;
    if (mult > 0) {
      const lineWin = mult * coinValue * accMul;
      lines[`l${lineIdx}`] = `0~${lineWin.toFixed(2)}~${c.positions.join('~')}`;
      lineIdx++;
    }
  }
  return lines;
}

// ── Build rmul field from active bombs ────────────────────────────────────────
function buildRmul(bombs) {
  if (!bombs.length) return '';
  return bombs.map(b => `${BOMB_SYM}~${b.pos}~${b.mul}`).join(';');
}

// ── Format helpers ────────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function serialize(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

// ── Main spin logic ───────────────────────────────────────────────────────────
// Returns array of responses (one per tumble step) for a single spin
function doSpinRNG(params, sessionState) {
  const coinValue  = parseFloat(params.c || '0.20');
  const reelSetIdx = sessionState.reelSet || 0;
  const isFreeSpins= sessionState.isFreeSpins || false;
  const isSuper    = sessionState.isSuperFS || false;
  const pur        = params.pur ? parseInt(params.pur) : 0;
  const index      = sessionState.index + 1;
  const counter    = index * 2;

  // Initial grid
  let grid;
  if (pur === 1 || pur === 0 && (params.fsp !== undefined)) {
    // Buy feature: guarantee 4+ scatters
    grid = spinGridWithScatters(reelSetIdx, 4);
  } else {
    grid = spinGrid(reelSetIdx);
  }

  const responses = [];
  let totalWin    = 0;
  let tumblesWin  = 0; // win from tumbling steps
  let accMul      = 1;
  let activeBombs = []; // bombs on field with their multipliers
  let isRespin    = false;
  let rsCurrent   = 0;

  // ── First tumble step ────────────────────────────────────────────────────
  const step1 = buildStep(grid, coinValue, accMul, activeBombs, isFreeSpins, isSuper, index, counter, sessionState, isRespin, rsCurrent, totalWin, tumblesWin, pur);

  if (!step1.hasWin && !step1.scatterTrigger) {
    // No win, no trigger — simple response
    return [buildNoWinResponse(grid, coinValue, index, counter, sessionState, pur, step1.scatters)];
  }

  // Has win or scatter trigger — process tumbling
  let currentGrid = grid;
  let cascadeStep = 0;

  while (true) {
    const clusters = findClusters(currentGrid);
    const bombs    = findBombs(currentGrid, isSuper);
    const hasClusters = clusters.length > 0;

    if (!hasClusters) {
      // End of cascade
      if (cascadeStep > 0) {
        // Final cascade response (rs_t=1)
        const finalResp = buildFinalCascadeResponse(currentGrid, coinValue, index, counter, sessionState, totalWin, tumblesWin, activeBombs, pur);
        responses.push(finalResp);
      }
      break;
    }

    const { win, effectiveMul, bombMul } = computeStepWin(clusters, coinValue, accMul, bombs);
    accMul = effectiveMul;
    totalWin += win;
    if (cascadeStep > 0) tumblesWin += win; // track tumble-only wins separately

    const tmb  = buildTmb(clusters, bombs);
    const rmul = buildRmul([...activeBombs, ...bombs]);
    // Accumulate bombs
    for (const b of bombs) {
      const existing = activeBombs.find(ab => ab.pos === b.pos);
      if (!existing) activeBombs.push(b);
    }
    const trail = activeBombs.length
      ? `nmwin~${tumblesWin > 0 ? tumblesWin.toFixed(2) : win.toFixed(2)}${accMul > 1 ? `;totmul~${accMul}` : ''}`
      : '';

    const winLines = buildWinLines(clusters, coinValue, accMul);

    // Apply tumble for next step
    const newGrid = applyTumble(currentGrid, clusters, bombs);
    cascadeStep++;
    rsCurrent++;

    // Build response for this cascade step
    const resp = buildCascadeResponse({
      grid: newGrid,
      tmb,
      rmul,
      trail,
      winLines,
      totalWin,
      tumblesWin: win,
      coinValue,
      index,
      counter,
      sessionState,
      pur,
      rsCurrent,
      accMul,
      activeBombs,
    });
    responses.push(resp);
    currentGrid = newGrid;
  }

  // If no responses yet (only scatter trigger no clusters), build scatter response
  if (responses.length === 0) {
    return [buildNoWinResponse(grid, coinValue, index, counter, sessionState, pur, step1.scatters)];
  }

  return responses;
}

// ── Check first grid for wins / scatter ──────────────────────────────────────
function buildStep(grid, coinValue, accMul, activeBombs, isFreeSpins, isSuper, index, counter, sessionState, isRespin, rsCurrent, totalWin, tumblesWin, pur) {
  const clusters = findClusters(grid);
  const scatters = grid.filter(s => s === SCATTER_SYM).length;
  return {
    hasWin: clusters.length > 0,
    scatterTrigger: !isFreeSpins && scatters >= FS_TRIGGER_COUNT,
    scatters,
  };
}

function buildNoWinResponse(grid, coinValue, index, counter, sess, pur, scatters) {
  const base = buildBaseFields(grid, coinValue, index, counter, sess, pur, 0, scatters);
  base.na     = 's';
  base['na']  = 's';
  base.w      = '0';
  base.tw     = '0.00';
  base.tmb_win= '0';
  return serialize(base);
}

function buildCascadeResponse({ grid, tmb, rmul, trail, winLines, totalWin, tumblesWin, coinValue, index, counter, sessionState, pur, rsCurrent, accMul, activeBombs }) {
  const obj = {
    tw:       totalWin.toFixed(2),
    tmb,
    balance:  fmt(sessionState.balance),
    index,
    balance_cash: fmt(sessionState.balance),
    reel_set:  sessionState.reelSet || 0,
    balance_bonus: '0.00',
    na:       's',
    rs:       't',
    tmb_win:  tumblesWin.toFixed(2),
    bl:       '0',
    stime:    Date.now(),
    rs_p:     '0',
    rs_c:     rsCurrent,
    sh:       ROWS,
    rs_m:     '1',
    c:        coinValue.toFixed(2),
    sver:     '5',
    counter,
    l:        '20',
    s:        grid.join(','),
    w:        tumblesWin > 0 ? tumblesWin.toFixed(2) : '0',
    st:       'rect',
    sw:       COLS,
    ...winLines,
  };

  if (rmul) obj.rmul = rmul;
  if (trail) obj.trail = trail;

  // freespin fields
  if (sessionState.isFreeSpins) {
    obj.fs         = sessionState.fsCurrentSpin;
    obj.fsmax      = FS_COUNT;
    obj['fs_bought']= FS_COUNT;
    obj.fsmul      = sessionState.fsBombMul || 1;
    obj.fsres      = '0';
    obj.puri       = sessionState.isSuperFS ? '1' : '0';
  }

  if (pur) obj.puri = pur;

  return serialize(obj);
}

function buildFinalCascadeResponse(grid, coinValue, index, counter, sess, totalWin, tumblesWin, activeBombs, pur) {
  const rmul = buildRmul(activeBombs);
  const obj = {
    tw:       totalWin.toFixed(2),
    balance:  fmt(sess.balance),
    index,
    balance_cash: fmt(sess.balance),
    reel_set:  sess.reelSet || 0,
    balance_bonus: '0.00',
    na:       's',
    rs_t:     '1',
    tmb_win:  tumblesWin.toFixed(2),
    bl:       '0',
    stime:    Date.now(),
    sh:       ROWS,
    c:        coinValue.toFixed(2),
    sver:     '5',
    counter,
    l:        '20',
    s:        grid.join(','),
    w:        '0',
    st:       'rect',
    sw:       COLS,
  };

  if (rmul) obj.rmul = rmul;
  if (activeBombs.length) {
    const totalMul = activeBombs.reduce((a,b) => a + b.mul, 0);
    obj.trail = `nmwin~${tumblesWin.toFixed(2)};totmul~${totalMul}`;
    obj.tmb_res = (totalWin - tumblesWin).toFixed(2);
  }

  if (sess.isFreeSpins) {
    obj.fs         = sess.fsCurrentSpin;
    obj.fsmax      = FS_COUNT;
    obj['fs_bought']= FS_COUNT;
    obj.fsmul      = sess.fsBombMul || 1;
    obj.fsres      = '0';
    obj.puri       = sess.isSuperFS ? '1' : '0';
  }

  return serialize(obj);
}

function buildBaseFields(grid, coinValue, index, counter, sess, pur, win, scatters) {
  const obj = {
    tw:           win.toFixed(2),
    balance:      fmt(sess.balance),
    index,
    balance_cash: fmt(sess.balance),
    reel_set:     sess.reelSet || 0,
    balance_bonus:'0.00',
    tmb_win:      '0',
    bl:           '0',
    stime:        Date.now(),
    sa:           randomSymRow(),
    sb:           randomSymRow(),
    sh:           ROWS,
    c:            coinValue.toFixed(2),
    sver:         '5',
    counter,
    l:            '20',
    s:            grid.join(','),
    w:            win > 0 ? win.toFixed(2) : '0',
    st:           'rect',
    sw:           COLS,
  };

  if (sess.isFreeSpins) {
    obj.fs          = sess.fsCurrentSpin;
    obj.fsmax       = FS_COUNT;
    obj['fs_bought']= FS_COUNT;
    obj.fswin       = (sess.fsTotalWin || 0).toFixed(2);
    obj.fsmul       = sess.fsBombMul || 1;
    obj.fsres       = '0';
    obj.puri        = sess.isSuperFS ? '1' : '0';
    obj.purtr       = '1';
    if (scatters >= FS_TRIGGER_COUNT) {
      obj['fs_bought'] = FS_COUNT;
    }
  }

  if (pur) obj.puri = pur;
  return obj;
}

function randomSymRow() {
  const syms = [3,4,5,6,7,8,9,10,11];
  return Array.from({length: COLS}, () => syms[rndInt(syms.length)]).join(',');
}

// ── doInit RNG response ───────────────────────────────────────────────────────
function doInitRNG(balance) {
  return serialize({
    'doInit::': '',
    is1000:    'true',
    def_s:     spinGrid(0).join(','),
    balance:   fmt(balance),
    cfgs:      '1',
    ver:       '3',
    index:     '1',
    balance_cash: fmt(balance),
    def_sb:    randomSymRow(),
    reel_set_size: '5',
    def_sa:    randomSymRow(),
    reel_set:  '0',
    balance_bonus: '0.00',
    na:        's',
    'scatters': '1~2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,100,60,0,0,0~0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0~1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1',
    paytable:  buildPaytableStr(),
    ...buildReelSetsFields(),
    sh:        ROWS,
    sw:        COLS,
    sver:      '5',
    defc:      '0.10',
    'sc':      '0.01,0.02,0.03,0.04,0.05,0.10,0.20,0.30,0.40,0.50,0.75,1.00,2.00,3.00,4.00,5.00,6.00,7.00,8.00,9.00,10.00,11.00,12.00',
    bonuses:   '0',
    stime:     Date.now(),
    counter:   '2',
  });
}

function buildPaytableStr() {
  // 13 symbols × 30 cols
  const rows = [];
  for (let sym = 0; sym < 13; sym++) {
    if (PAYTABLE[sym + 1]) {
      const pt = PAYTABLE[sym + 1];
      const row = new Array(30).fill(0);
      for (let i = 0; i < pt.pays.length; i++) row[i] = pt.pays[i];
      rows.push(row.join(','));
    } else {
      rows.push(new Array(30).fill(0).join(','));
    }
  }
  return rows.join(';');
}

function buildReelSetsFields() {
  const obj = {};
  for (let i = 0; i < 5; i++) {
    const rs = REEL_SETS[i];
    obj[`reel_set${i}`] = rs.map(r => r.join(',')).join('~');
    obj[`n_reel_set${i}`] = rs.map(r => r.join(',')).join('~');
  }
  return obj;
}

// ── doCollect RNG ─────────────────────────────────────────────────────────────
function doCollectRNG(balance, index, totalWin) {
  const counter = index * 2;
  return serialize({
    'doCollect::': '',
    balance:       fmt(balance),
    index,
    balance_cash:  fmt(balance),
    balance_bonus: '0.00',
    na:            's',
    sver:          '5',
    stime:         Date.now(),
    counter,
    a:             '0',
    gs:            '0',
    w:             totalWin.toFixed(2),
    tw:            totalWin.toFixed(2),
  });
}

module.exports = { doSpinRNG, doInitRNG, doCollectRNG, SCATTER_SYM, FS_COUNT, FS_TRIGGER_COUNT, fmt, serialize };
