'use strict';
require('dotenv').config();

const express = require('express');
const path    = require('path');
const { pool } = require('./config/db');
const sbGame  = require('./engines/sb');
const srGame  = require('./engines/sr');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000');
const fmt  = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
const MUTED = ['/stats', '/favicon', '/rum', '/collect'];
app.use((req, res, next) => {
  if (MUTED.some(p => req.path.includes(p))) return next();
  const start = Date.now();
  res.on('finish', () => {
    const c = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(`${c}${req.method}\x1b[0m ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ── Strip ?key=... for static files ──────────────────────────────────────────
app.use((req, _res, next) => {
  const keep = ['gameService', 'reloadBalance', 'saveSettings', 'html5Game'];
  if (!keep.some(k => req.path.includes(k))) req.url = req.url.split('?')[0];
  next();
});

// ── Favicon ───────────────────────────────────────────────────────────────────
app.get('/favicon.png', (_req, res) => res.sendFile(path.join(__dirname, '../public/favicon.png')));
app.get('/favicon.ico', (_req, res) => res.sendFile(path.join(__dirname, '../public/favicon.png')));

// ── Static assets ─────────────────────────────────────────────────────────────
// Both games share the same /gs2c/ static tree (common assets, logo_info.js)
app.use('/api/slots/SweetBonanza1000/gs2c', express.static(path.join(__dirname, '../public/gs2c'), {
  maxAge: 0, etag: false,
  setHeaders: res => res.setHeader('Cache-Control', 'no-store'),
}));

// Sugar Rush also served under its own route prefix
app.use('/api/slots/SugarRush1000/gs2c', express.static(path.join(__dirname, '../public/gs2c'), {
  maxAge: 0, etag: false,
}));

// ── ═══════════════════════════ SWEET BONANZA 1000 ═══════════════════════════ ─
app.get('/api/slots/SweetBonanza1000/gs2c/html5Game.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../games/sb/html5Game.html'));
});

app.post('/api/slots/SweetBonanza1000/gs2c_/gameService', async (req, res) => {
  try {
    const response = await sbGame.handle(req.body.action || '', req.body);
    res.status(200).type('text/plain').set('Cache-Control', 'no-store').send(response);
  } catch (err) {
    console.error('[SB gameService]', err.message);
    res.status(500).type('text/plain').send('error=1');
  }
});

app.get('/api/slots/SweetBonanza1000/gs2c/reloadBalance.do', async (req, res) => {
  try {
    const mgckey  = req.query.mgckey || 'default';
    const { rows } = await pool.query('SELECT balance FROM sessions WHERE mgckey=$1', [mgckey]);
    const balance = rows[0] ? parseFloat(rows[0].balance) : parseFloat(process.env.DEFAULT_BALANCE || '50000');
    res.type('text/plain').send(
      `balance_bonus=0.00&balance=${fmt(balance)}&balance_cash=${fmt(balance)}&stime=${Date.now()}`
    );
  } catch { res.status(500).send('error=1'); }
});

// ── ════════════════════════════ SUGAR RUSH 1000 ════════════════════════════ ─
app.get('/api/slots/SugarRush1000/gs2c/html5Game.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../games/sr/html5Game.html'));
});

app.post('/api/slots/SugarRush1000/gs2c_/gameService', async (req, res) => {
  try {
    const response = await srGame.handle(req.body.action || '', req.body);
    res.status(200).type('text/plain').set('Cache-Control', 'no-store').send(response);
  } catch (err) {
    console.error('[SR gameService]', err.message);
    res.status(500).type('text/plain').send('error=1');
  }
});

app.get('/api/slots/SugarRush1000/gs2c/reloadBalance.do', async (req, res) => {
  try {
    const mgckey  = req.query.mgckey || 'default';
    const { rows } = await pool.query('SELECT balance FROM sessions WHERE mgckey=$1', [mgckey]);
    const balance = rows[0] ? parseFloat(rows[0].balance) : parseFloat(process.env.DEFAULT_BALANCE || '50000');
    res.type('text/plain').send(
      `balance_bonus=0.00&balance=${fmt(balance)}&balance_cash=${fmt(balance)}&stime=${Date.now()}`
    );
  } catch { res.status(500).send('error=1'); }
});

// ── Shared saveSettings ───────────────────────────────────────────────────────
const DEFAULT_SETTINGS = 'SoundState=true_true_true_false_false;FastPlay=false;Intro=true;StopMsg=0;TurboSpinMsg=0;BetInfo=0_-1;BatterySaver=false;ShowCCH=false;ShowFPH=false;CustomGameStoredData=;Coins=false;Volume=0.5;GameSpeed=0;HapticFeedback=false';

function handleSaveSettings(req, res) {
  const body = req.body;
  const settings = body.settings || '';
  if (body.method === 'load') {
    const id = body.id || '';
    if (id === 'vsCommon') return res.type('json').send(JSON.stringify({ MinimizedNotificationTypes: '', HideMetaNotifications: 'false' }));
    return res.type('text/plain').send(DEFAULT_SETTINGS);
  }
  if (!settings) return res.type('text/plain').send(DEFAULT_SETTINGS);
  if (settings.trim().startsWith('{')) {
    try { return res.type('json').send(settings); } catch (_) {}
  }
  res.type('text/plain').send(settings);
}

app.post('/api/slots/SweetBonanza1000/gs2c/saveSettings.do', handleSaveSettings);
app.post('/api/slots/SugarRush1000/gs2c/saveSettings.do', handleSaveSettings);

// ── Stubs ─────────────────────────────────────────────────────────────────────
const stub = (_req, res) => res.status(200).send('');
const noContent = (_req, res) => res.status(204).end();

app.all('/api/slots/SweetBonanza1000/gs2c/stats.do', stub);
app.all('/api/slots/SugarRush1000/gs2c/stats.do', stub);
app.all('/gs2c/jackpot/*',       stub);
app.all('/gs2c/regulation/*',    stub);
app.all('/gs2c/logout.do',       stub);
app.all('/gs2c/closeGame.do',    stub);
app.all('/gs2c/announcements/*', stub);
app.all('/gs2c/promo/*',         stub);
app.all('/collect',              noContent);
app.all('/j/collect',            noContent);
app.all('/cdn-cgi/*',            noContent);
app.all('/apps/*',               stub);

// ── Lobby ─────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Casino</title>
  <link rel="icon" href="/favicon.png">
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#0f0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',sans-serif;gap:24px;}
    h1{color:#fff;font-size:2rem;letter-spacing:2px;}
    .games{display:flex;gap:20px;flex-wrap:wrap;justify-content:center;}
    a{display:flex;flex-direction:column;align-items:center;gap:10px;color:#fff;background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:24px 40px;border-radius:16px;text-decoration:none;font-size:1.1rem;font-weight:bold;transition:transform .2s,box-shadow .2s;box-shadow:0 4px 20px rgba(124,58,237,.4);}
    a:hover{transform:translateY(-4px);box-shadow:0 8px 30px rgba(124,58,237,.6);}
    .emoji{font-size:2.5rem;}
  </style></head>
  <body>
    <h1>🎰 Casino</h1>
    <div class="games">
      <a href="/api/slots/SweetBonanza1000/gs2c/html5Game.html">
        <span class="emoji">🍬</span>
        Sweet Bonanza 1000
      </a>
      <a href="/api/slots/SugarRush1000/gs2c/html5Game.html">
        <span class="emoji">🍭</span>
        Sugar Rush 1000
      </a>
    </div>
  </body></html>`);
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
    console.log(`
  🍬 Sweet Bonanza 1000  → http://localhost:${PORT}/api/slots/SweetBonanza1000/gs2c/html5Game.html
  🍭 Sugar Rush 1000     → http://localhost:${PORT}/api/slots/SugarRush1000/gs2c/html5Game.html
  `);
  });
}

start();
