'use strict';
const db = require('../config/db');

const DEFAULT_BALANCE = parseFloat(process.env.DEFAULT_BALANCE || '50000');

async function getOrCreate(mgckey) {
  const { rows } = await db.query(
    `INSERT INTO sessions (mgckey) VALUES ($1)
     ON CONFLICT (mgckey) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [mgckey]
  );
  return rows[0];
}

async function debitBet(mgckey, bet) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM sessions WHERE mgckey=$1 FOR UPDATE`, [mgckey]);
    const sess = rows[0];
    const newBalance = Math.max(0, parseFloat(sess.balance) - bet);
    const { rows: updated } = await client.query(
      `UPDATE sessions SET balance=$1, spin_index=spin_index+1, updated_at=NOW() WHERE mgckey=$2 RETURNING *`,
      [newBalance, mgckey]
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

async function creditWin(mgckey, win) {
  const { rows } = await db.query(
    `UPDATE sessions SET balance=balance+$1, updated_at=NOW() WHERE mgckey=$2 RETURNING *`,
    [win, mgckey]
  );
  return rows[0];
}

async function nextCollect(mgckey) {
  const { rows } = await db.query(
    `UPDATE sessions SET collect_index=collect_index+1, updated_at=NOW() WHERE mgckey=$1 RETURNING *`,
    [mgckey]
  );
  return rows[0];
}

async function getBalance(mgckey) {
  const { rows } = await db.query(`SELECT balance FROM sessions WHERE mgckey=$1`, [mgckey]);
  return rows[0] ? parseFloat(rows[0].balance) : DEFAULT_BALANCE;
}

module.exports = { getOrCreate, debitBet, creditWin, nextCollect, getBalance };
