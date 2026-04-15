'use strict';

const gameRegistry = require('../config/gameRegistry');

/**
 * Middleware que resolve o :gameId da rota.
 * Se o jogo existir no registry, anexa `req.game` com { engine, symbol, emoji, label }.
 * Se não existir, retorna 404.
 */
function resolveGame(req, res, next) {
  const { gameId } = req.params;
  const game = gameRegistry.get(gameId);

  if (!game) {
    return res.status(404).json({ error: `Game "${gameId}" not found` });
  }

  req.game = game;
  req.gameId = gameId;
  next();
}

module.exports = resolveGame;
