'use strict';

const session = require('../models/sessionModel');
const { fmt } = require('../utils/fmt');

// Single source of truth for the default settings string.
// The provider client reads this on first load and after a settings reset.
const DEFAULT_SETTINGS =
  'SoundState=true_true_true_false_false;FastPlay=false;Intro=true;' +
  'StopMsg=0;TurboSpinMsg=0;BetInfo=0_-1;BatterySaver=false;' +
  'ShowCCH=false;ShowFPH=false;CustomGameStoredData=;Coins=false;' +
  'Volume=0.5;GameSpeed=0;HapticFeedback=false';

/**
 * GET /api/slots/:gameId/gs2c/reloadBalance.do
 * Shared across all games — balance lives in the session, not per-game.
 */
async function reloadBalance(req, res, next) {
  try {
    const mgckey  = req.query.mgckey || 'default';
    const balance = await session.getBalance(mgckey);
    res.type('text/plain').send(
      `balance_bonus=0.00&balance=${fmt(balance)}&balance_cash=${fmt(balance)}&stime=${Date.now()}`
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/slots/:gameId/gs2c/saveSettings.do
 * Shared across all games — settings are provider-level, not game-level.
 */
function saveSettings(req, res) {
  const { method, id, settings } = req.body;

  if (method === 'load') {
    if (id === 'vsCommon') {
      return res.type('json').json({ MinimizedNotificationTypes: '', HideMetaNotifications: 'false' });
    }
    return res.type('text/plain').send(DEFAULT_SETTINGS);
  }

  if (!settings) return res.type('text/plain').send(DEFAULT_SETTINGS);

  if (settings.trim().startsWith('{')) {
    try { return res.type('json').send(settings); } catch (_) { /* fall through */ }
  }

  res.type('text/plain').send(settings);
}

module.exports = { reloadBalance, saveSettings };
