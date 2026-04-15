'use strict';

/**
 * Game Registry
 * Mapeamento central: gameId → engine + metadados.
 * Para adicionar um novo jogo basta inserir uma entrada aqui.
 */

const registry = new Map();

function register(gameId, { engine, symbol, emoji, label }) {
  registry.set(gameId, { engine, symbol, emoji, label });
}

// ── Registrar jogos ───────────────────────────────────────────────────────────
register('SweetBonanza1000', {
  engine: require('../engines/sb'),
  symbol: 'vs20fruitswx',
  emoji:  '🍬',
  label:  'Sweet Bonanza 1000',
});

register('SugarRush1000', {
  engine: require('../engines/sr'),
  symbol: 'vs20sugarrushx',
  emoji:  '🍭',
  label:  'Sugar Rush 1000',
});

function get(gameId)  { return registry.get(gameId) || null; }
function has(gameId)  { return registry.has(gameId); }
function entries()    { return [...registry.entries()]; }

module.exports = { register, get, has, entries };
