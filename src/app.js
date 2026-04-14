'use strict';
require('dotenv').config();

const express      = require('express');
const { pool }     = require('./config/db');
const cors         = require('./middlewares/cors');
const logger       = require('./middlewares/logger');
const queryStrip   = require('./middlewares/queryStrip');
const errorHandler = require('./middlewares/errorHandler');
const routes       = require('./routes');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000');

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors);
app.use(logger);
app.use(queryStrip);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use(routes);

// ── Centralized error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Connected ✓');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\n  Pragmatic Play Server → http://localhost:${PORT}\n`);
  });
}

start();
