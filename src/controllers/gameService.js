'use strict';

const qs = require('querystring');
const { slugFromSymbol } = require('../config/games');

// Game handlers — each game owns its own logic
const handlers = {
  cult: require('../engines/games/cult'),
  zeus: require('../engines/games/zeus'),
  pub:  require('../engines/games/pub'),
};

/**
 * POST /gs2c/ge/v4/gameService
 * POST /gs2c/ge/v5/gameService
 */
async function gameService(req, res) {
  try {
    const params = req.body;                     // parsed by express urlencoded middleware
    const action = params.action || '';
    const symbol = params.symbol || '';
    const slug   = slugFromSymbol(symbol);

    if (!slug || !handlers[slug]) {
      console.warn(`[gameService] Unknown symbol: ${symbol}`);
      return res.status(400).type('text/plain').send('error=1&description=Unknown game');
    }

    const handler  = handlers[slug];
    const response = await handler.handle(action, params);

    res
      .status(200)
      .type('text/plain')
      .set('Cache-Control', 'no-cache, no-store')
      .send(response);

  } catch (err) {
    console.error('[gameService] Error:', err.message, err.stack);
    res.status(500).type('text/plain').send('error=1&description=Internal server error');
  }
}

module.exports = { gameService };
