'use strict';

const registry = require('../engines/registry');

/**
 * Validates the :gameId route parameter against the engine registry.
 * On success, attaches `req.engine` so downstream controllers are decoupled
 * from the registry — they just call `req.engine.handle(action, params)`.
 * On failure, short-circuits with 404 so invalid game IDs never reach game logic.
 */
module.exports = function gameRegistryMiddleware(req, res, next) {
  const { gameId } = req.params;
  const engine = registry.get(gameId);

  if (!engine) {
    return res.status(404).json({ error: `Game '${gameId}' not found` });
  }

  req.engine = engine;
  next();
};
