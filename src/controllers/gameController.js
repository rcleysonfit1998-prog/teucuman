'use strict';

const balanceService = require('../services/balanceService');
const { DEFAULT_SETTINGS } = require('../utils/constants');

/**
 * POST /api/slots/:gameId/gs2c_/gameService
 */
async function gameService(req, res, next) {
  try {
    const { engine } = req.game;
    const response = await engine.handle(req.body.action || '', req.body);
    res.status(200).type('text/plain').set('Cache-Control', 'no-store').send(response);
  } catch (err) {
    console.error(`[${req.gameId} gameService]`, err.message);
    res.status(500).type('text/plain').send('error=1');
  }
}

/**
 * GET /api/slots/:gameId/gs2c/reloadBalance.do
 */
async function reloadBalance(req, res, next) {
  try {
    const mgckey = req.query.mgckey || 'default'; // pega do html5Game.html ou usa 'default' se não fornecido
    const balance = await balanceService.getBalance(mgckey);
    res.type('text/plain').send(balanceService.formatBalanceResponse(balance));
  } catch {
    res.status(500).send('error=1');
  }
}

/**
 * POST /api/slots/:gameId/gs2c/saveSettings.do
 */
function saveSettings(req, res) {
  const { settings, method, id } = req.body;

  if (method === 'load') {
    if (id === 'vsCommon') {
      return res.type('json').send(
        JSON.stringify({ MinimizedNotificationTypes: '', HideMetaNotifications: 'false' })
      );
    }
    return res.type('text/plain').send(DEFAULT_SETTINGS);
  }

  if (!settings) return res.type('text/plain').send(DEFAULT_SETTINGS);

  if (settings.trim().startsWith('{')) {
    try { return res.type('json').send(settings); } catch (_) { /* fall through */ }
  }

  res.type('text/plain').send(settings);
}

module.exports = { gameService, reloadBalance, saveSettings };
