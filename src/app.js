'use strict';
require('dotenv').config();

const express = require('express');
const path    = require('path');
const session = require('./models/sessionModel');
const sbGame  = require('./engines/sb');
const { pool } = require('./config/db');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// ── Logging ───────────────────────────────────────────────────────────────────
const MUTED = ['/collect', '/stats', '/favicon', '/rum'];
app.use((req, res, next) => {
  if (MUTED.some(p => req.path.includes(p))) return next();
  const start = Date.now();
  res.on('finish', () => {
    const c = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(`${c}${req.method}\x1b[0m ${req.path} → ${res.statusCode} (${Date.now()-start}ms)`);
  });
  next();
});

// ── Strip ?key=... for static files ──────────────────────────────────────────
app.use((req, _res, next) => {
  const keep = ['gameService', 'reloadBalance', 'saveSettings', 'html5Game'];
  if (!keep.some(k => req.path.includes(k))) {
    req.url = req.url.split('?')[0];
  }
  next();
});

// ── Static assets — nusewin serves assets under /gs2c/ ───────────────────────
app.use('/gs2c', express.static(path.join(__dirname, '../public/gs2c'), {
  maxAge: 0, etag: false,
  setHeaders: res => res.setHeader('Cache-Control', 'no-store'),
}));

// ── html5Game.html ────────────────────────────────────────────────────────────
app.get('/gs2c/html5Game.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../games/sb/html5Game.html'));
});

// ── gameService — nusewin uses /api/slots/gs2c_/gameService ──────────────────
app.post('/api/slots/gs2c_/gameService', async (req, res) => {
  try {
    const params   = req.body;
    const action   = params.action || '';
    const response = await sbGame.handle(action, params);
    res.status(200).type('text/plain').set('Cache-Control','no-store').send(response);
  } catch (err) {
    console.error('[gameService]', err.message);
    res.status(500).type('text/plain').send('error=1');
  }
});

// ── API stubs — nusewin uses /api/slots/gs2c/ ─────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

app.get('/api/slots/gs2c/reloadBalance.do', async (req, res) => {
  try {
    const mgckey  = req.query.mgckey || 'default';
    const balance = await session.getBalance(mgckey);
    res.type('text/plain').send(
      `balance_bonus=0.00&balance=${fmt(balance)}&balance_cash=${fmt(balance)}&stime=${Date.now()}`
    );
  } catch (err) {
    res.status(500).send('error=1');
  }
});

const DEFAULT_SETTINGS = 'SoundState=true_true_true_false_false;FastPlay=false;Intro=true;StopMsg=0;TurboSpinMsg=0;BetInfo=0_-1;BatterySaver=false;ShowCCH=false;ShowFPH=false;CustomGameStoredData=;Coins=false;Volume=0.5;GameSpeed=0;HapticFeedback=false';

app.post('/api/slots/gs2c/saveSettings.do', (req, res) => {
  const body     = req.body;
  const settings = body.settings || '';
  if (body.method === 'load') {
    const id = body.id || '';
    if (id === 'vsCommon') return res.type('json').send(JSON.stringify({ MinimizedNotificationTypes: '', HideMetaNotifications: 'false' }));
    return res.type('text/plain').send(DEFAULT_SETTINGS);
  }
  if (!settings) return res.type('text/plain').send(DEFAULT_SETTINGS);
  if (settings.trim().startsWith('{')) {
    try { return res.type('json').send(settings); } catch(e) {}
  }
  res.type('text/plain').send(settings);
});

// ── Remaining stubs ───────────────────────────────────────────────────────────
const stub = (_req, res) => res.status(200).send('');
app.all('/api/slots/gs2c/stats.do',      stub);
app.all('/api/slots/gs2c/clientLog.do',  stub);
app.all('/gs2c/jackpot/*',               stub);
app.all('/gs2c/regulation/*',            stub);
app.all('/gs2c/logout.do',               stub);
app.all('/gs2c/closeGame.do',            stub);
app.all('/gs2c/announcements/*',         stub);
app.all('/gs2c/promo/*',                 stub);
app.all('/collect',                      (_req, res) => res.status(204).end());
app.all('/j/collect',                    (_req, res) => res.status(204).end());
app.all('/cdn-cgi/*',                    (_req, res) => res.status(204).end());
app.all('/apps/*',                       stub);

// ── Lobby index ───────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Sweet Bonanza 1000</title>
  <style>body{background:#111;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;}
  a{color:#fff;background:#f59e0b;padding:16px 32px;border-radius:12px;text-decoration:none;font-size:1.2rem;font-weight:bold;}</style>
  </head><body><a href="/gs2c/html5Game.html">▶ Sweet Bonanza 1000</a></body></html>`);
});

// ── 404 ───────────────────────────────────────────────────────────────────────
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
    console.log(`\n  Sweet Bonanza 1000 → http://localhost:${PORT}\n`);
  });
}

start();
