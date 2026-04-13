'use strict';

// ── Sweet Bonanza 1000 RNG Engine Corrigido ──────────────────────────────────
const REEL_SETS = {
  0: [
    [8,11,6,8,4,3,9,11,5,10,6,10,6,10,10,10,9,11,9,11,10,11,8,7,5,3,7,10,9,5,7,7,7,11,1,4,6,8,4,7,8,10,10,9,10,11,7,10],
    [9,11,7,8,7,9,11,6,8,10,4,9,10,8,5,10,8,10,3,4,1,8,11,11,11,7,10,7,1,11,6,11,10,5,5,9,11,9,11,9,6,11,3,8,6,11,10,9,4],
    [6,11,11,10,10,10,9,10,11,7,1,3,5,8,9,5,3,4,8,10,9,5,6,11,9,11,4,1,11,10,5,11,1,11,7,9,5,3,5,10,8,11,8,10,11,10,6,7,9],
    [10,8,11,4,11,8,1,3,10,6,10,5,3,11,10,9,9,10,9,11,7,5,11,1,11,11,11,11,10,8,9,7,4,4,11,8,6,11,10,10,10,11,10,5,11,8,9,7],
    [10,8,5,5,10,7,10,11,10,11,10,9,10,1,10,8,11,11,6,10,11,7,8,4,11,10,10,10,9,3,10,5,10,11,10,11,6,11,10,11,4,8,9,8,11,7],
    [11,4,1,11,10,6,10,11,8,10,10,11,11,5,7,9,11,10,10,11,9,5,10,11,10,10,4,3,8,11,1,11,10,10,8,7,6,11,10,4,11,10,11,10,9,7]
  ]
};

const PAYTABLE = {
  3:  [0,0,0,0,0,0,0,1,1,1,1.2,1.2,10,10,10,10,10,10,10,10,10,10,50,50,50,50,50,50,50,50], // Coração
  4:  [0,0,0,0,0,0,0,0.8,0.8,0.8,1,1,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,25,25,25,25,25,25,25,25], // Quadrado
  5:  [0,0,0,0,0,0,0,0.5,0.5,0.5,0.6,0.6,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,15,15,15,15,15,15,15,15], // Pentágono
  6:  [0,0,0,0,0,0,0,0.4,0.4,0.4,0.5,0.5,1.2,1.2,1.2,1.2,1.2,1.2,1.2,1.2,1.2,1.2,12,12,12,12,12,12,12,12], // Retângulo
  7:  [0,0,0,0,0,0,0,0.3,0.3,0.3,0.4,0.4,1,1,1,1,1,1,1,1,1,1,10,10,10,10,10,10,10,10], // Maçã
  8:  [0,0,0,0,0,0,0,0.25,0.25,0.25,0.3,0.3,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,8,8,8,8,8,8,8,8], // Ameixa
  9:  [0,0,0,0,0,0,0,0.2,0.2,0.2,0.25,0.25,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,5,5,5,5,5,5,5,5], // Melancia
  10: [0,0,0,0,0,0,0,0.15,0.15,0.15,0.2,0.2,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,4,4,4,4,4,4,4,4], // Uva
  11: [0,0,0,0,0,0,0,0.1,0.1,0.1,0.15,0.15,0.25,0.25,0.25,0.25,0.25,0.25,0.25,0.25,0.25,0.25,2,2,2,2,2,2,2,2], // Banana
  1:  [0,0,0,1,1,3,3,3,3,3,3,3,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10] // Scatter
};

// Formatação para originalidade (evita .00 em inteiros)
function fmt(val) {
  if (typeof val === 'number') {
    return val % 1 === 0 ? val.toString() : val.toFixed(2);
  }
  return val;
}

function serialize(data) {
  let str = "";
  for (const [key, value] of Object.entries(data)) {
    str += `${key}=${value}&`;
  }
  return str; // Mantém o & final conforme original
}

function generateGrid(reelSetIndex = 0) {
  const reels = REEL_SETS[reelSetIndex];
  const grid = [];
  for (let col = 0; col < 6; col++) {
    const start = Math.floor(Math.random() * reels[col].length);
    for (let row = 0; row < 5; row++) {
      grid.push(reels[col][(start + row) % reels[col].length]);
    }
  }
  return grid;
}

function calculateWin(grid, bet) {
  const counts = {};
  const positions = {};
  grid.forEach((sym, idx) => {
    if (!counts[sym]) {
      counts[sym] = 0;
      positions[sym] = [];
    }
    counts[sym]++;
    positions[sym].push(idx);
  });

  let totalWin = 0;
  let winDetails = [];
  let winPositions = [];

  for (const sym in counts) {
    const count = counts[sym];
    const payRow = PAYTABLE[sym];
    if (payRow && count >= 8) {
      const multiplier = payRow[count - 1] || 0;
      if (multiplier > 0) {
        const winAmount = multiplier * (bet / 20); // Baseado em l=20
        totalWin += winAmount;
        winDetails.push({ sym, win: winAmount, pos: positions[sym] });
        // Formato l0: index~valor~pos1~pos2...
        winPositions.push(`0~${fmt(winAmount)}~${positions[sym].join('~')}`);
      }
    }
  }

  return { totalWin, winPositions, winDetails };
}

module.exports = { generateGrid, calculateWin, serialize, fmt };