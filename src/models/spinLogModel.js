'use strict';

const db = require('../config/db');

/**
 * Insert a spin log entry (fire-and-forget, non-blocking).
 */
async function log({ mgckey, symbol, action, bet, win, balanceBefore, balanceAfter, responseRaw }) {
  try {
    await db.query(
      `INSERT INTO spin_log
         (mgckey, symbol, action, bet, win, balance_before, balance_after, response_raw)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [mgckey, symbol, action, bet ?? null, win ?? null, balanceBefore, balanceAfter, responseRaw]
    );
  } catch (err) {
    // Log errors should never crash the game server
    console.error('[spinLog] Failed to write log:', err.message);
  }
}

module.exports = { log };
