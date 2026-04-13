'use strict';
require('dotenv').config();
const { pool } = require('./db');

const SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  id            SERIAL PRIMARY KEY,
  mgckey        TEXT NOT NULL UNIQUE,
  balance       NUMERIC(14,2) NOT NULL DEFAULT 50000.00,
  spin_index    INTEGER NOT NULL DEFAULT 0,
  collect_index INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
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
