'use strict';

/**
 * POST /api/slots/:gameId/gs2c_/gameService
 *
 * Delegates action handling to the engine attached by the gameRegistry middleware.
 * Controllers know nothing about which game is running — the registry resolved that.
 */
async function gameService(req, res, next) {
  try {
    const params   = req.body;
    const action   = params.action || '';
    const response = await req.engine.handle(action, params);
    res
      .status(200)
      .type('text/plain')
      .set('Cache-Control', 'no-store')
      .send(response);
  } catch (err) {
    next(err);
  }
}

module.exports = { gameService };
