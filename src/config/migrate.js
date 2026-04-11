'use strict';

require('dotenv').config();
const { pool } = require('./db');

const SQL = `
-- Sessions: one row per mgckey
CREATE TABLE IF NOT EXISTS sessions (
  id          SERIAL PRIMARY KEY,
  mgckey      TEXT        NOT NULL UNIQUE,
  balance     NUMERIC(14,2) NOT NULL DEFAULT 100000.00,
  spin_index  INTEGER     NOT NULL DEFAULT 0,
  collect_index INTEGER   NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spin log: full audit trail
CREATE TABLE IF NOT EXISTS spin_log (
  id          BIGSERIAL PRIMARY KEY,
  mgckey      TEXT        NOT NULL,
  symbol      TEXT        NOT NULL,
  action      TEXT        NOT NULL,   -- doInit | doSpin | doCollect
  bet         NUMERIC(10,2),
  win         NUMERIC(10,2),
  balance_before NUMERIC(14,2),
  balance_after  NUMERIC(14,2),
  response_raw   TEXT,               -- full response string for debugging
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spin_log_mgckey ON spin_log(mgckey);
CREATE INDEX IF NOT EXISTS idx_spin_log_created ON spin_log(created_at DESC);

-- Games registry
CREATE TABLE IF NOT EXISTS games (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,  -- cult | zeus | pub
  symbol      TEXT NOT NULL UNIQUE,  -- vs25scolymp | vs15godsofwar | vs25luckpub
  name        TEXT NOT NULL,
  gs_version  TEXT NOT NULL DEFAULT 'v5',
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO games (slug, symbol, name, gs_version) VALUES
  ('cult', 'vs25scolymp',   'Cult of Fortune',              'v5'),
  ('zeus', 'vs15godsofwar', 'Zeus vs Hades – Gods of War',  'v4'),
  ('pub',  'vs25luckpub',   'Lucky''s Wild Pub 2',          'v5')
ON CONFLICT (slug) DO NOTHING;
`;

(async () => {
  console.log('[migrate] Running migrations...');
  try {
    await pool.query(SQL);
    console.log('[migrate] Done.');
  } catch (err) {
    console.error('[migrate] Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
