'use strict';

// ── Sweet Bonanza 1000 RNG Engine ─────────────────────────────────────────────
// Reel sets, paytable and protocol extracted from real Pragmatic Play doInit
//
// Grid: 6 cols × 5 rows = 30 positions
// Position index: col-major → pos = col*5 + row  (0..29)
// Symbols: 1=scatter 3..11=fruits 12=bomb(multiplier)

// ── Reel sets (from real Pragmatic doInit) ────────────────────────────────────
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

// ── Paytable: PAYTABLE[sym][count-1] = multiplier ────────────────────────────
// sym 3..11 = fruits, indexed from paytable row 3 (0-indexed)
// count = number of matching symbols in cluster (1..30)
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

// Minimum cluster size per symbol
const MIN_CLUSTER = { 3:8, 4:8, 5:8, 6:4, 7:4, 8:4, 9:4, 10:4, 11:4 };

const COLS        = 6;
const ROWS        = 5;
const GRID_SIZE   = COLS * ROWS;
const SCATTER_SYM = 1;
const BOMB_SYM    = 12;
const FS_COUNT    = 10;
const FS_TRIGGER  = 4;

// Bomb multiplier pools
const BOMB_MULS_NORMAL = [2, 3, 4, 5];
const BOMB_MULS_SUPER  = [20, 25, 30, 35, 40, 50];

function rnd(max) { return Math.floor(Math.random() * max); }

// ── Spin a grid from a reel set ───────────────────────────────────────────────
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

// Guarantee minScatters scatter symbols
function spinGridWithScatters(reelSetIdx, minScatters) {
  let grid, tries = 0;
  do {
    grid = spinGrid(reelSetIdx);
    tries++;
  } while (grid.filter(s => s === SCATTER_SYM).length < minScatters && tries < 1000);
  return grid;
}

// ── Cluster detection (BFS) ───────────────────────────────────────────────────
function getNeighbors(pos) {
  const col = Math.floor(pos / ROWS);
  const row = pos % ROWS;
  const n = [];
  if (row > 0)        n.push(pos - 1);
  if (row < ROWS - 1) n.push(pos + 1);
  if (col > 0)        n.push(pos - ROWS);
  if (col < COLS - 1) n.push(pos + ROWS);
  return n;
}

function findClusters(grid) {
  const visited = new Uint8Array(GRID_SIZE);
  const clusters = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const sym = grid[i];
    if (visited[i] || sym === SCATTER_SYM || sym === BOMB_SYM || sym === 0) continue;
    const cluster = [];
    const queue = [i];
    visited[i] = 1;
    while (queue.length) {
      const pos = queue.shift();
      cluster.push(pos);
      for (const nb of getNeighbors(pos)) {
        if (!visited[nb] && grid[nb] === sym) {
          visited[nb] = 1;
          queue.push(nb);
        }
      }
    }
    const minSize = MIN_CLUSTER[sym] || 4;
    if (cluster.length >= minSize) clusters.push({ sym, positions: cluster });
  }
  return clusters;
}

// ── Tumble: remove clusters + bombs, drop down, fill top ─────────────────────
function applyTumble(grid, clusters, bombs, reelSetIdx) {
  const toRemove = new Set();
  for (const c of clusters) c.positions.forEach(p => toRemove.add(p));
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
        // Fill with random symbol from reel (no scatter/bomb in refill)
        let sym;
        const reel = rs[col];
        do { sym = reel[rnd(reel.length)]; } while (sym === SCATTER_SYM || sym === BOMB_SYM);
        newGrid[pos] = sym;
      }
    }
  }
  return newGrid;
}

// ── Bombs on grid ─────────────────────────────────────────────────────────────
function findBombs(grid, isSuper) {
  const muls = isSuper ? BOMB_MULS_SUPER : BOMB_MULS_NORMAL;
  const bombs = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    if (grid[i] === BOMB_SYM) bombs.push({ pos: i, mul: muls[rnd(muls.length)] });
  }
  return bombs;
}

// ── Win calculation ───────────────────────────────────────────────────────────
function clusterWin(clusters, coinValue, bombMulSum) {
  let win = 0;
  const mul = bombMulSum || 1;
  for (const c of clusters) {
    const row = PAYTABLE_ROWS[c.sym];
    if (!row) continue;
    const idx = Math.min(c.positions.length, 30) - 1;
    const pay = row[idx] || 0;
    if (pay > 0) win += pay * coinValue * mul;
  }
  return win;
}

// ── Response field builders ───────────────────────────────────────────────────
function buildTmb(clusters, bombs) {
  const parts = [];
  for (const c of clusters) for (const p of c.positions) parts.push(`${p},${c.sym}`);
  for (const b of bombs) parts.push(`${b.pos},${BOMB_SYM}`);
  return parts.join('~');
}

function buildWinLines(clusters, coinValue, bombMulSum) {
  const mul = bombMulSum || 1;
  const lines = {};
  let idx = 0;
  for (const c of clusters) {
    const row = PAYTABLE_ROWS[c.sym];
    if (!row) continue;
    const payIdx = Math.min(c.positions.length, 30) - 1;
    const pay = (row[payIdx] || 0) * coinValue * mul;
    if (pay > 0) {
      lines[`l${idx}`] = `0~${pay.toFixed(2)}~${c.positions.join('~')}`;
      idx++;
    }
  }
  return lines;
}

function buildRmul(activeBombs) {
  if (!activeBombs.length) return '';
  return activeBombs.map(b => `${BOMB_SYM}~${b.pos}~${b.mul}`).join(';');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── doSpinRNG: returns array of response strings (one per tumble step) ────────
function doSpinRNG(params, sess) {
  const coinValue  = parseFloat(params.c || '0.20');
  const reelSetIdx = sess.reelSet || 0;
  const isSuper    = sess.isSuperFS || false;
  const pur        = params.pur !== undefined ? parseInt(params.pur) : -1;
  const index      = (sess.index || 1);
  const counter    = index * 2;

  // Initial grid
  let grid = (pur === 0 || pur === 1)
    ? spinGridWithScatters(reelSetIdx, FS_TRIGGER)
    : spinGrid(reelSetIdx);

  const responses    = [];
  let totalWin       = 0;
  let tmbWin         = 0;
  let activeBombs    = [];
  let cascadeStep    = 0;

  // ── Tumbling loop ────────────────────────────────────────────────────────
  while (true) {
    const clusters = findClusters(grid);
    const newBombs = findBombs(grid, isSuper);
    // Merge new bombs into active (avoid duplicates by position)
    for (const b of newBombs) {
      if (!activeBombs.find(ab => ab.pos === b.pos)) activeBombs.push(b);
    }

    if (clusters.length === 0) {
      // No win this step
      if (cascadeStep === 0) {
        // Zero-win spin
        return [buildBaseResponse(grid, 0, 0, coinValue, index, counter, sess, pur, [], '')];
      }
      // End of cascade — final response with rs_t=1
      responses.push(buildCascadeEndResponse(grid, totalWin, tmbWin, coinValue, index, counter, sess, activeBombs, pur));
      break;
    }

    const bombMulSum = activeBombs.reduce((acc, b) => acc + b.mul, 0) || 1;
    const stepWin    = clusterWin(clusters, coinValue, bombMulSum);
    totalWin        += stepWin;
    if (cascadeStep > 0) tmbWin += stepWin;

    const tmb      = buildTmb(clusters, newBombs);
    const rmul     = buildRmul(activeBombs);
    const winLines = buildWinLines(clusters, coinValue, bombMulSum);
    const trail    = activeBombs.length
      ? `nmwin~${tmbWin > 0 ? tmbWin.toFixed(2) : stepWin.toFixed(2)}${bombMulSum > 1 ? `;totmul~${bombMulSum}` : ''}`
      : '';

    // Apply tumble for next iteration
    const nextGrid = applyTumble(grid, clusters, newBombs, reelSetIdx);
    cascadeStep++;

    // Build cascade step response
    responses.push(buildCascadeStepResponse({
      prevGrid: grid, nextGrid, tmb, rmul, trail, winLines,
      totalWin, stepWin, tmbWin, coinValue, index, counter,
      sess, pur, cascadeStep, activeBombs,
    }));

    grid = nextGrid;
  }

  return responses;
}

// ── Response builders ─────────────────────────────────────────────────────────
function buildBaseResponse(grid, totalWin, tmbWin, coinValue, index, counter, sess, pur, activeBombs, trail) {
  const scatters = grid.filter(s => s === SCATTER_SYM).length;
  const obj = {
    tw:            totalWin.toFixed(2),
    balance:       fmt(sess.balance),
    index,
    balance_cash:  fmt(sess.balance),
    reel_set:      sess.reelSet || 0,
    balance_bonus: '0.00',
    na:            's',
    tmb_win:       tmbWin > 0 ? tmbWin.toFixed(2) : '0',
    bl:            '0',
    stime:         Date.now(),
    sa:            randRow(),
    sb:            randRow(),
    sh:            ROWS,
    c:             coinValue.toFixed(2),
    sver:          '5',
    counter,
    l:             '20',
    s:             grid.join(','),
    w:             totalWin > 0 ? totalWin.toFixed(2) : '0',
    st:            'rect',
    sw:            COLS,
    ntp:           '0.00',
  };

  if (trail) obj.trail = trail;
  if (activeBombs.length) obj.rmul = buildRmul(activeBombs);

  // Freespin fields
  if (sess.isFreeSpins) addFSFields(obj, sess);

  // Scatter trigger (buy feature response)
  if (pur === 0 || pur === 1) {
    obj.puri = pur;
    obj.purtr = '1';
    if (sess.isFreeSpins) {
      obj['fs_bought'] = FS_COUNT;
      obj.fsmax = FS_COUNT;
    }
  }

  return serialize(obj);
}

function buildCascadeStepResponse({ prevGrid, nextGrid, tmb, rmul, trail, winLines, totalWin, stepWin, tmbWin, coinValue, index, counter, sess, pur, cascadeStep, activeBombs }) {
  const obj = {
    tw:            totalWin.toFixed(2),
    tmb,
    balance:       fmt(sess.balance),
    index,
    balance_cash:  fmt(sess.balance),
    reel_set:      sess.reelSet || 0,
    balance_bonus: '0.00',
    na:            's',
    rs:            't',
    tmb_win:       stepWin.toFixed(2),
    bl:            '0',
    stime:         Date.now(),
    rs_p:          '0',
    rs_c:          cascadeStep,
    sh:            ROWS,
    rs_m:          '1',
    c:             coinValue.toFixed(2),
    sver:          '5',
    counter,
    l:             '20',
    s:             nextGrid.join(','),
    w:             stepWin > 0 ? stepWin.toFixed(2) : '0',
    st:            'rect',
    sw:            COLS,
    ...winLines,
  };

  if (rmul) obj.rmul = rmul;
  if (trail) obj.trail = trail;
  if (sess.isFreeSpins) addFSFields(obj, sess);
  if (pur !== undefined && pur >= 0) obj.puri = pur;

  return serialize(obj);
}

function buildCascadeEndResponse(grid, totalWin, tmbWin, coinValue, index, counter, sess, activeBombs, pur) {
  const obj = {
    tw:            totalWin.toFixed(2),
    balance:       fmt(sess.balance),
    index,
    balance_cash:  fmt(sess.balance),
    reel_set:      sess.reelSet || 0,
    balance_bonus: '0.00',
    na:            totalWin > 0 ? 's' : 's',
    rs_t:          '1',
    tmb_win:       tmbWin.toFixed(2),
    bl:            '0',
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
    st:            'rect',
    sw:            COLS,
    ntp:           `-${totalWin.toFixed(2)}`,
  };

  if (activeBombs.length) {
    obj.rmul = buildRmul(activeBombs);
    const totalMul = activeBombs.reduce((a, b) => a + b.mul, 0);
    obj.trail    = `nmwin~${tmbWin.toFixed(2)};totmul~${totalMul}`;
    obj.tmb_res  = (totalWin - tmbWin).toFixed(2);
  }

  if (sess.isFreeSpins) addFSFields(obj, sess);
  if (pur !== undefined && pur >= 0) obj.puri = pur;

  return serialize(obj);
}

function addFSFields(obj, sess) {
  obj.fs         = sess.fsCurrentSpin;
  obj.fsmax      = FS_COUNT;
  obj['fs_bought'] = FS_COUNT;
  obj.fswin      = (sess.fsTotalWin || 0).toFixed(2);
  obj.fsmul      = sess.fsBombMul || 1;
  obj.fsres      = '0';
  obj.puri       = sess.isSuperFS ? '1' : '0';
  obj.purtr      = '1';
}

// ── doInitRNG ─────────────────────────────────────────────────────────────────
function doInitRNG(balance) {
  const defGrid = spinGrid(0);

  // Build reel set fields (no n_reel_set — not used by Pragmatic)
  const reelSetFields = {};
  for (let i = 0; i < 5; i++) {
    reelSetFields[`reel_set${i}`] = REEL_SETS[i].map(r => r.join(',')).join('~');
  }

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
    bonuses:       '0',
  });
}

// Build paytable string: 13 rows × 30 cols (symbols 0..12)
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

// ── doCollectRNG ──────────────────────────────────────────────────────────────
function doCollectRNG(balance, index, totalWin) {
  return serialize({
    balance:       fmt(balance),
    index,
    balance_cash:  fmt(balance),
    balance_bonus: '0.00',
    na:            's',
    sver:          '5',
    stime:         Date.now(),
    counter:       index * 2,
    a:             '0',
    gs:            '0',
    w:             totalWin.toFixed(2),
    tw:            totalWin.toFixed(2),
  });
}

module.exports = { doSpinRNG, doInitRNG, doCollectRNG, fmt, serialize, SCATTER_SYM, BOMB_SYM, FS_COUNT, FS_TRIGGER };
