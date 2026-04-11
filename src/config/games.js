'use strict';

const path = require('path');
const fs   = require('fs');

/**
 * Static game metadata.
 * DB is the source of truth for runtime state (balance, indices).
 * This file holds structural config that never changes.
 */
const GAMES = {
  cult: {
    slug:       'cult',
    symbol:     'vs25scolymp',
    name:       'Cult of Fortune',
    gsVersion:  'v5',
    grid:       { cols: 5, rows: 4 },
    lines:      25,
    defaultBet: 0.08,
  },
  zeus: {
    slug:       'zeus',
    symbol:     'vs15godsofwar',
    name:       'Zeus vs Hades – Gods of War',
    gsVersion:  'v4',
    grid:       { cols: 5, rows: 5 },
    lines:      10,
    defaultBet: 0.10,
  },
  pub: {
    slug:       'pub',
    symbol:     'vs25luckpub',
    name:       "Lucky's Wild Pub 2",
    gsVersion:  'v5',
    grid:       { cols: 5, rows: 3 },
    lines:      25,
    defaultBet: 0.08,
  },
};

/** Reverse map: symbol → slug */
const SYMBOL_TO_SLUG = Object.fromEntries(
  Object.values(GAMES).map(g => [g.symbol, g.slug])
);

/**
 * Load HAR-extracted responses for a game.
 * Returns { doInit, doSpin: [], doCollect: [] }
 */
function loadResponses(slug) {
  const p = path.join(__dirname, '../../games', slug, 'responses', 'index.json');
  if (!fs.existsSync(p)) {
    console.warn(`[games] No responses found for slug: ${slug}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** In-memory response cache (loaded once at startup) */
const responseCache = {};

function initResponseCache() {
  for (const slug of Object.keys(GAMES)) {
    const r = loadResponses(slug);
    if (r) {
      responseCache[slug] = r;
      console.log(`[games] Loaded ${slug}: doSpin×${r.doSpin.length}, doCollect×${r.doCollect.length}`);
    }
  }
}

function getResponses(slug) {
  return responseCache[slug] || null;
}

function getGame(slug) {
  return GAMES[slug] || null;
}

function getGameBySymbol(symbol) {
  const slug = SYMBOL_TO_SLUG[symbol];
  return slug ? GAMES[slug] : null;
}

function slugFromSymbol(symbol) {
  return SYMBOL_TO_SLUG[symbol] || null;
}

module.exports = {
  GAMES,
  SYMBOL_TO_SLUG,
  getGame,
  getGameBySymbol,
  slugFromSymbol,
  getResponses,
  initResponseCache,
};
