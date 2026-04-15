'use strict';

const COLS      = 7;
const ROWS      = 7;
const GRID_SIZE = COLS * ROWS;
const SCATTER   = 1;
const MIN_CLUSTER = 5;
const MAX_MUL   = 1024;

const REEL_SET = [
  [9,9,6,6,5,9,7,7,7,5,8,8,8,7,9,5,5,6,4,9,9,7,8,8,1,3,3,4,3,3,3,9,9,9,6,6,7,9,9,5,5,4,5,5,9,7,8,5,5,5,5,6,4,9,9,4,8,8,6,9,9,1,7,6,6,8,8,9,9,9,9,5,8,4,8,8,3,8,8,6,6,8,8,8,5,5,6,4],
  [4,4,7,7,8,8,8,7,8,8,9,9,5,5,8,8,1,5,5,3,9,9,9,7,3,3,4,4,7,7,9,9,9,8,8,7,8,4,5,3,3,5,5,4,7,7,5,3,7,8,8,8,8,5,5,8,8,1,9,7,9,9,7,8,8,7,3,3,8,8,8,7,8,8,8,8,5,9,9,9,6,8,8,8,6,3,3,6,7,7,4,4,4,4,7],
  [9,9,9,7,7,7,7,4,5,5,7,7,5,5,5,9,9,4,4,6,6,4,4,8,8,1,5,9,5,3,8,7,7,6,6,8,9,9,9,9,6,3,3,3,9,8,8,6,6,8,9,9,8,3,7,7,9,1,7,7,7,8,9,4,7,7,9,5,5,9,8,8,5,6,9,7,7,3,3,9,9,1,1,6,6,4,4,4,9,6,6],
  [7,7,3,3,6,6,6,5,5,5,6,7,3,3,7,4,4,5,5,5,7,7,1,3,3,4,4,4,4,5,8,8,6,6,8,8,8,8,1,7,8,7,7,6,6,7,7,9,9,7,7,4,4,6,6,8,3,4,4,9,9,9,9,9,4,4,7,4,9,6,6,9,9,7,7,7,5,5,5,9,9,9,8,6,7,7,8,7,5,9,9,6,6,5,5],
  [4,6,6,8,3,3,6,9,7,4,5,5,3,3,7,1,9,4,4,7,7,9,4,4,6,4,5,3,8,6,8,8,8,4,4,7,3,3,3,4,4,8,8,3,4,4,8,8,6,6,6,8,8,7,7,5,5,1,7,7,7,6,4,4,4,8,8,4,3,3,9,9,8,8,9,9,9,5,5,3,3,3,9,3,7,7,3,4,4],
  [5,6,6,4,4,6,6,6,9,6,6,6,7,9,9,8,8,9,8,8,7,7,3,3,8,8,8,9,9,9,9,9,8,8,1,9,4,4,6,6,6,7,5,3,3,7,7,5,5,4,4,8,8,7,7,8,8,7,7,5,8,8,8,8,6,6,9,9,9,9,7,7,9,9,5,5,5,1,6,8,8,5,5,5,5,3,3,9,9,3,8,8,4,4,5,3,3,5,7,7],
  [8,8,6,6,6,7,4,4,4,4,9,9,9,9,5,5,5,1,7,4,6,9,9,4,9,9,7,7,4,4,3,3,9,9,7,7,9,7,7,3,9,8,8,9,9,9,6,6,7,7,6,4,4,6,6,4,9,9,9,9,9,9,1,7,4,4,5,5,8,8,6,6,8,8,5,5,4,4,8,8,8,8,8,8,8,8,9,9,4,4,7,4,4],
];

const PAYTABLE_RAW = {
  3: [3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,1400,700,300,150,100,50,40,35,30,20,0,0,0,0],
  4: [2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,1200,600,250,120,80,40,30,25,20,15,0,0,0,0],
  5: [1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,800,400,200,90,60,30,25,20,15,10,0,0,0,0],
  6: [800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,800,400,200,100,60,40,25,20,15,10,8,0,0,0,0],
  7: [600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,300,160,70,50,30,20,15,10,8,6,0,0,0,0],
  8: [500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,240,120,60,40,25,15,10,8,6,5,0,0,0,0],
  9: [400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,200,100,50,30,20,10,8,6,5,4,0,0,0,0],
};

const FS_AWARDS = { 3: 10, 4: 12, 5: 15, 6: 20, 7: 30 };

function rnd(max) { return Math.floor(Math.random() * max); }

function spinGrid() {
  const grid = new Array(GRID_SIZE);
  for (let col = 0; col < COLS; col++) {
    const reel = REEL_SET[col];
    const stop = rnd(reel.length);
    for (let row = 0; row < ROWS; row++) {
      grid[col * ROWS + row] = reel[(stop + row) % reel.length];
    }
  }
  return grid;
}

function spinGridWithScatters(minScatters) {
  let grid, tries = 0;
  do {
    grid = spinGrid();
    tries++;
  } while (grid.filter(s => s === SCATTER).length < minScatters && tries < 2000);
  return grid;
}

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
    if (visited[i] || sym === SCATTER || sym === 0) continue;
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
    if (cluster.length >= MIN_CLUSTER) clusters.push({ sym, positions: cluster });
  }
  return clusters;
}

function hitCountToMul(hc) {
  if (hc <= 1) return 1;
  return Math.min(Math.pow(2, hc - 1), MAX_MUL);
}

function clusterMul(cluster, hitCounts) {
  let sum = 0;
  let hasActive = false;
  for (const pos of cluster) {
    const m = hitCountToMul(hitCounts[pos]);
    if (m > 1) { sum += m; hasActive = true; }
  }
  return hasActive ? sum : 1;
}

function buildSlm(hitCounts) {
  const mp = [];
  const mv = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    if (hitCounts[i] >= 2) {
      mp.push(i);
      mv.push(hitCountToMul(hitCounts[i]));
    }
  }
  if (mp.length === 0) return {};
  return { slm_mp: mp.join(','), slm_mv: mv.join(',') };
}

function updateHitCounts(hitCounts, positions) {
  const updated = hitCounts.slice();
  for (const pos of positions) {
    updated[pos] = Math.min(updated[pos] + 1, 11);
  }
  return updated;
}

function calcWin(clusters, coinValue, hitCounts) {
  let total = 0;
  for (const c of clusters) {
    const row = PAYTABLE_RAW[c.sym];
    if (!row) continue;
    const idx = GRID_SIZE - c.positions.length;
    if (idx < 0 || idx >= row.length) continue;
    const base = row[idx] || 0;
    if (base === 0) continue;
    const mul = clusterMul(c.positions, hitCounts);
    total += base * coinValue * mul;
  }
  return total;
}

function applyTumble(grid, clusters) {
  const toRemove = new Set();
  for (const c of clusters) c.positions.forEach(p => toRemove.add(p));

  const newGrid = grid.slice();
  for (let col = 0; col < COLS; col++) {
    const remaining = [];
    for (let row = ROWS - 1; row >= 0; row--) {
      const pos = col * ROWS + row;
      if (!toRemove.has(pos)) remaining.push(newGrid[pos]);
    }
    const reel = REEL_SET[col];
    for (let row = ROWS - 1; row >= 0; row--) {
      const pos = col * ROWS + row;
      const idx = ROWS - 1 - row;
      if (idx < remaining.length) {
        newGrid[pos] = remaining[idx];
      } else {
        let sym;
        do { sym = reel[rnd(reel.length)]; } while (sym === SCATTER);
        newGrid[pos] = sym;
      }
    }
  }
  return newGrid;
}

function buildSMark(clusters) {
  const parts = [];
  for (const c of clusters) {
    for (const pos of c.positions) parts.push(`${c.sym}:${pos}`);
  }
  return `tmb~${parts.join(',')}`;
}

function buildTrail(hitCounts) {
  const active = hitCounts
    .map((hc, i) => hc === 1 ? i : -1)
    .filter(i => i >= 0);
  return `pmp~${active.join(',')}`;
}

function buildWinLines(clusters, coinValue, hitCounts) {
  const lines = {};
  const lmi = [];
  const lmv = [];
  let idx = 0;
  for (const c of clusters) {
    const row = PAYTABLE_RAW[c.sym];
    if (!row) continue;
    const rowIdx = GRID_SIZE - c.positions.length;
    const base = row[rowIdx] || 0;
    if (base === 0) continue;
    
    const mul = clusterMul(c.positions, hitCounts);
    const win = base * coinValue * mul;
    lines[`l${idx}`] = `0~${win.toFixed(2)}~${c.positions.join('~')}`;
    
    if (mul > 1) {
      lmi.push(idx);
      lmv.push(mul);
    }
    idx++;
  }
  if (lmi.length > 0) {
    lines.lmi = lmi.join(',');
    lines.lmv = lmv.join(',');
  }
  return lines;
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
  const syms = [3,4,5,6,7,8,9];
  return Array.from({ length: COLS }, () => syms[rnd(syms.length)]).join(',');
}

function countScatters(grid) {
  return grid.filter(s => s === SCATTER).length;
}

function doSpinRNG(params, sess) {
  const coinValue  = parseFloat(params.c || '0.20');
  const pur        = params.pur !== undefined ? parseInt(params.pur) : -1;
  const isFreeSpins = sess.isFreeSpins || false;
  const index      = sess.index || 1;
  const counter    = index * 2;

  let grid = (pur === 0 || pur === 1)
    ? spinGridWithScatters(3)
    : spinGrid();

  let hitCounts = isFreeSpins
    ? (sess.hitCounts || new Array(GRID_SIZE).fill(0))
    : new Array(GRID_SIZE).fill(0);

  if (sess.isSuperFS && isFreeSpins && !sess.hitCountsInitialized) {
    hitCounts = new Array(GRID_SIZE).fill(2);
    sess.hitCountsInitialized = true;
    sess.hitCounts = hitCounts;
  }

  const responses  = [];
  let spinTotalWin = 0;
  let totalWin     = isFreeSpins ? (sess.fsTotalWin || 0) : 0;
  let cascadeStep  = 0;
  let fsmore       = 0;

  while (true) {
    const clusters = findClusters(grid);

    if (clusters.length === 0) {
      const sc = countScatters(grid);
      if (sc >= 3 && isFreeSpins) {
        fsmore = FS_AWARDS[Math.min(sc, 7)] || 0;
        sess.fsMaxSpin += fsmore;
        sess.retriggered = true;
      }

      if (cascadeStep === 0) {
        const r  = buildBaseResponse(grid, totalWin, coinValue, index, counter, sess, pur, hitCounts, fsmore);
        return { responses: [r], hitCounts };
      }
      responses.push(buildEndResponse(grid, totalWin, spinTotalWin, coinValue, index, counter, sess, hitCounts, pur, fsmore));
      break;
    }

    const allHitPositions = clusters.flatMap(c => c.positions);
    const stepWin = calcWin(clusters, coinValue, hitCounts);
    spinTotalWin += stepWin;
    totalWin += stepWin;

    const sMark    = buildSMark(clusters);
    const winLines = buildWinLines(clusters, coinValue, hitCounts);

    hitCounts = updateHitCounts(hitCounts, allHitPositions);

    const nextGrid = applyTumble(grid, clusters);
    cascadeStep++;

    responses.push(buildCascadeStepResponse({
      nextGrid, sMark, winLines, stepWin, spinTotalWin, totalWin,
      coinValue, index, counter, sess, pur, cascadeStep, hitCounts,
    }));

    grid = nextGrid;
  }

  if (isFreeSpins) {
    sess.hitCounts = hitCounts;
  }

  return { responses, hitCounts };
}

function buildBaseResponse(grid, totalWin, coinValue, index, counter, sess, pur, hitCounts, fsmore) {
  const obj = {
    tw:            totalWin.toFixed(2),
    balance:       fmt(sess.balance),
    index,
    balance_cash:  fmt(sess.balance),
    balance_bonus: '0.00',
    na:            's',
    tmb_win:       '0',
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
    sw:            COLS,
    st:            'rect',
    trail:         buildTrail(hitCounts),
  };

  if (sess.isFreeSpins) addFSFields(obj, sess, hitCounts, fsmore, pur);
  if (pur >= 0) { obj.puri = pur; obj.purtr = '1'; }

  return serialize(obj);
}

function buildCascadeStepResponse({ nextGrid, sMark, winLines, stepWin, spinTotalWin, totalWin, coinValue, index, counter, sess, pur, cascadeStep, hitCounts }) {
  const obj = {
    s_mark:        sMark,
    tw:            totalWin.toFixed(2),
    balance:       fmt(sess.balance),
    index,
    balance_cash:  fmt(sess.balance),
    balance_bonus: '0.00',
    na:            's',
    tmb_win:       spinTotalWin.toFixed(2),
    rs_p:          '0',
    stime:         Date.now(),
    sa:            randRow(),
    sb:            randRow(),
    rs_c:          cascadeStep,
    sh:            ROWS,
    rs_m:          '1',
    c:             coinValue.toFixed(2),
    sver:          '5',
    counter,
    l:             '20',
    s:             nextGrid.join(','),
    w:             Number(stepWin.toFixed(2)),
    sw:            COLS,
    st:            'rect',
    trail:         buildTrail(hitCounts),
    ...winLines,
  };

  if (sess.isFreeSpins) addFSFields(obj, sess, hitCounts, 0, pur);
  if (pur >= 0) { obj.puri = pur; obj.purtr = '1'; }

  return serialize(obj);
}

function buildEndResponse(grid, totalWin, spinTotalWin, coinValue, index, counter, sess, hitCounts, pur, fsmore) {
  const obj = {
    tw:            totalWin.toFixed(2),
    balance:       fmt(sess.balance),
    index,
    balance_cash:  fmt(sess.balance),
    balance_bonus: '0.00',
    na:            (spinTotalWin > 0 && !sess.isFreeSpins) ? 'c' : 's',
    rs_t:          '1',
    tmb_win:       spinTotalWin.toFixed(2),
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
    sw:            COLS,
    st:            'rect',
    trail:         buildTrail(hitCounts),
  };

  if (sess.isFreeSpins) addFSFields(obj, sess, hitCounts, fsmore, pur);
  if (pur >= 0) { obj.puri = pur; obj.purtr = '1'; }

  return serialize(obj);
}

function addFSFields(obj, sess, hitCounts, fsmore, pur) {
  obj.fs          = sess.fsCurrentSpin;
  obj.fsmax       = sess.fsMaxSpin;
  if (fsmore > 0) obj.fsmore = fsmore;
  if (sess.fsCurrentSpin === 1 && pur >= 0) {
      obj.fs_bought = sess.fsMaxSpin;
  }
  obj.fswin       = '0';
  obj.fsmul       = '1';
  obj.fsres       = '0';
  obj.puri        = sess.isSuperFS ? '1' : '0';
  if (hitCounts) {
    const slm = buildSlm(hitCounts);
    if (slm.slm_mp !== undefined) {
      obj.slm_mp = slm.slm_mp;
      obj.slm_mv = slm.slm_mv;
    }
  }
}

function doInitRNG(balance) {
  const defGrid = spinGrid();
  const reel0   = REEL_SET.map(r => r.join(',')).join('~');

  return serialize({
    is1000:        'true',
    def_s:         defGrid.join(','),
    balance:       fmt(balance),
    cfgs:          '1',
    ver:           '3',
    index:         '1',
    balance_cash:  fmt(balance),
    def_sb:        randRow(),
    reel_set_size: '1',
    def_sa:        randRow(),
    reel_set:      '0',
    balance_bonus: '0.00',
    na:            's',
    scatters:      '1~0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0~0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0~1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1',
    rt:            'd',
    'gameInfo':    '{rtps:{purchase_1:"96.44",purchase_0:"96.52",regular:"96.53"},props:{max_rnd_sim:"1",max_rnd_hr:"12800000",max_rnd_win:"25000"}}',
    wl_i:          'tbm~25000',
    stime:         Date.now(),
    sa:            randRow(),
    sb:            randRow(),
    sc:            '0.01,0.02,0.03,0.04,0.05,0.10,0.20,0.30,0.40,0.50,0.75,1.00,2.00,3.00,4.00,5.00,6.00,7.00,8.00,9.00,10.00,11.00,12.00',
    defc:          '0.10',
    purInit_e:     '1,1',
    sh:            ROWS,
    wilds:         '2~0~1',
    bonuses:       '0',
    st:            'rect',
    c:             '0.10',
    sw:            COLS,
    sver:          '5',
    counter:       '2',
    ntp:           '0.00',
    paytable:      PAYTABLE_STR,
    l:             '20',
    total_bet_max: '120,000.00',
    reel_set0:     reel0,
    s:             defGrid.join(','),
    purInit:       '[{bet:2000,type:"default"},{bet:10000,type:"default"}]',
    total_bet_min: '0.01',
  });
}

const PAYTABLE_STR = (() => {
  const rows = [];
  rows.push('0');
  rows.push(new Array(49).fill(0).join(','));
  rows.push('0');
  for (let sym = 3; sym <= 9; sym++) {
    rows.push(PAYTABLE_RAW[sym].join(','));
  }
  rows.push('0');
  rows.push('0');
  return rows.join(';');
})();

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

module.exports = {
  doSpinRNG, doInitRNG, doCollectRNG,
  fmt, serialize, SCATTER, FS_AWARDS, GRID_SIZE,
  buildSlm, buildTrail, randRow
};