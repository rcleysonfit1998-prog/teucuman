'use strict';
require('dotenv').config();
const { pool } = require('./db');

const SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  id            SERIAL PRIMARY KEY,
  mgckey        TEXT NOT NULL UNIQUE,
  balance       NUMERIC(14,2) NOT NULL DEFAULT 100000.00,
  spin_index    INTEGER NOT NULL DEFAULT 0,
  collect_index INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spin_log (
  id             BIGSERIAL PRIMARY KEY,
  mgckey         TEXT NOT NULL,
  action         TEXT NOT NULL,
  bet            NUMERIC(10,2),
  win            NUMERIC(10,2),
  balance_before NUMERIC(14,2),
  balance_after  NUMERIC(14,2),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spin_log_mgckey ON spin_log(mgckey);
`;

(async () => {
  console.log('[migrate] Running...');
  try {
    await pool.query(SQL);
    console.log('[migrate] Done ✓');
  } catch (err) {
    console.error('[migrate] Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
