'use strict';

require('dotenv').config();

const express = require('express');
const path    = require('path');

const requestLogger  = require('./middlewares/requestLogger');
const gameRoutes     = require('./routes/gameRoutes');
const systemRoutes   = require('./routes/systemRoutes');
const { initResponseCache, GAMES } = require('./config/games');
const { pool }       = require('./config/db');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000');

// ── Middleware stack ──────────────────────────────────────────────────────────
app.use(requestLogger);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// ── CORS (game runs same-origin, but XDomain popup needs this) ────────────────
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// ── Static assets (public/) ───────────────────────────────────────────────────
// Strips ?key=... query strings so Express finds files correctly
app.use((req, _res, next) => {
  req.url = req.url.split('?')[0] || req.url;
  // Restore query for routes that need it (game5Html, reloadBalance, etc.)
  // Express req.query already parsed; this only affects static middleware path
  next();
}, express.static(path.join(__dirname, '../public'), {
  maxAge:    0,
  etag:      false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache');
  },
}));

// ── Application routes ────────────────────────────────────────────────────────
app.use('/gs2c', gameRoutes);
app.use('/',     systemRoutes);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).type('text/plain').send(`Not Found: ${req.originalUrl}`);
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message, err.stack);
  res.status(500).type('text/plain').send('Internal Server Error');
});

// ── Boot ──────────────────────────────────────────────────────────────────────
async function start() {
  // 1. Verify DB connection
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Connected ✓');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    console.error('  → Run: createdb pragmatic && node src/config/migrate.js');
    process.exit(1);
  }

  // 2. Load HAR responses into memory
  initResponseCache();

  // 3. Start HTTP server
  app.listen(PORT, () => {
    console.log(`\n  Pragmatic Server → http://localhost:${PORT}\n`);
    Object.values(GAMES).forEach(g => {
      const ready = true; // TODO: check if responses loaded
      console.log(`  ${ready ? '✓' : '✗'} ${g.name.padEnd(35)} /gs2c/game5Html.html?slug=${g.slug}`);
    });
    console.log('');
  });
}

start();
