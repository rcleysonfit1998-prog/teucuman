'use strict';

const sessionModel = require('../models/sessionModel');
const { fmt } = require('../engines/responseBuilder');

/**
 * GET /gs2c/reloadBalance.do
 */
async function reloadBalance(req, res) {
  try {
    const mgckey  = req.query.mgckey || 'default';
    const balance = await sessionModel.getBalance(mgckey);
    res
      .status(200)
      .type('text/plain')
      .send(`balance_bonus=0.00&balance=${fmt(balance)}&balance_cash=${fmt(balance)}&stime=${Date.now()}`);
  } catch (err) {
    console.error('[reloadBalance] Error:', err.message);
    res.status(500).send('error=1');
  }
}

/**
 * POST /gs2c/saveSettings.do
 */
function saveSettings(req, res) {
  res.status(200).json({ error: 0, description: 'OK' });
}

module.exports = { reloadBalance, saveSettings };
