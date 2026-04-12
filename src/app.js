'use strict';
require('dotenv').config();

const express = require('express');
const path    = require('path');
const qs      = require('querystring');
const session = require('./models/sessionModel');
const pubGame = require('./engines/pub');
const logger  = require('./middlewares/requestLogger');
const { fmt } = require('./engines/responseBuilder');
const { pool } = require('./config/db');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(logger);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// ── Strip ?key=... for static files ──────────────────────────────────────────
app.use((req, _res, next) => {
  if (req.path.includes('game5Html') || req.path.includes('html5Game') ||
      req.path.includes('reloadBalance') || req.path.includes('gameService')) {
    return next();
  }
  req.url = req.url.split('?')[0];
  next();
});

app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: 0, etag: false,
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-store'),
}));

// ── html5Game.do ──────────────────────────────────────────────────────────────
app.get('/gs2c/html5Game.do', (_req, res) => {
  res.sendFile(path.join(__dirname, '../games/pub/html5Game.html'));
});

// gameService (v5)
app.post(['/gs2c/ge/v5/gameService', '/gs2c/gameService'], async (req, res) => {
  try {
    const params   = req.body;
    const action   = params.action || '';
    const response = await pubGame.handle(action, params);
    res.status(200).type('text/plain').set('Cache-Control', 'no-store').send(response);
  } catch (err) {
    console.error('[gameService]', err.message);
    res.status(500).type('text/plain').send('error=1');
  }
});

// reloadBalance.do
app.get('/gs2c/reloadBalance.do', async (req, res) => {
  const balance = await session.getBalance(req.query.mgckey || 'default');
  res.type('text/plain').send(
    `balance_bonus=0.00&balance=${fmt(balance)}&balance_cash=${fmt(balance)}&stime=${Date.now()}`
  );
});

// saveSettings.do
app.post('/gs2c/saveSettings.do', (_req, res) => res.json({ error: 0 }));

// Telemetry stubs
app.all('/collect',     (_req, res) => res.status(204).end());
app.all('/j/collect',   (_req, res) => res.status(204).end());
app.all('/apps/*',      (_req, res) => res.status(200).send(''));

// All other stubs
const STUBS = ['/gs2c/stats', '/gs2c/clientLog', '/gs2c/jackpot', '/gs2c/regulation',
               '/gs2c/logout', '/gs2c/closeGame', '/gs2c/announcements', '/gs2c/promo'];
app.all('*', (req, res, next) => {
  if (STUBS.some(s => req.path.startsWith(s)) ||
      req.path.includes('customizations.info') ||
      req.path.includes('project_settings')) {
    return res.status(200).send('');
  }
  next();
});

// 404
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Not Found: ${req.originalUrl}`);
});

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
    console.log(`\n  Lucky's Wild Pub 2 → http://localhost:${PORT}/gs2c/html5Game.do\n`);
  });
}

start();
