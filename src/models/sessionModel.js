'use strict';

const db = require('../config/db');

const DEFAULT_BALANCE = parseFloat(process.env.DEFAULT_BALANCE || '100000');

/**
 * Get or create a session row for the given mgckey.
 */
async function getOrCreate(mgckey) {
  const { rows } = await db.query(
    `INSERT INTO sessions (mgckey, balance)
     VALUES ($1, $2)
     ON CONFLICT (mgckey) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [mgckey, DEFAULT_BALANCE]
  );
  return rows[0];
}

/**
 * Debit bet, increment spin_index, return updated session.
 * Uses a FOR UPDATE lock to prevent race conditions.
 */
async function debitBet(mgckey, bet) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM sessions WHERE mgckey = $1 FOR UPDATE`,
      [mgckey]
    );
    const sess = rows[0];
    if (!sess) throw new Error(`Session not found: ${mgckey}`);

    const newBalance  = Math.max(0, parseFloat(sess.balance) - bet);
    const newSpinIdx  = sess.spin_index + 1;

    const { rows: updated } = await client.query(
      `UPDATE sessions
       SET balance = $1, spin_index = $2, updated_at = NOW()
       WHERE mgckey = $3
       RETURNING *`,
      [newBalance, newSpinIdx, mgckey]
    );
    await client.query('COMMIT');
    return updated[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Increment collect_index, return updated session.
 */
async function nextCollect(mgckey) {
  const { rows } = await db.query(
    `UPDATE sessions
     SET collect_index = collect_index + 1, updated_at = NOW()
     WHERE mgckey = $1
     RETURNING *`,
    [mgckey]
  );
  return rows[0];
}

/**
 * Credit a win amount back to balance.
 */
async function creditWin(mgckey, win) {
  const { rows } = await db.query(
    `UPDATE sessions
     SET balance = balance + $1, updated_at = NOW()
     WHERE mgckey = $2
     RETURNING *`,
    [win, mgckey]
  );
  return rows[0];
}

async function getBalance(mgckey) {
  const { rows } = await db.query(
    `SELECT balance FROM sessions WHERE mgckey = $1`,
    [mgckey]
  );
  return rows[0] ? parseFloat(rows[0].balance) : DEFAULT_BALANCE;
}

module.exports = { getOrCreate, debitBet, nextCollect, creditWin, getBalance };
