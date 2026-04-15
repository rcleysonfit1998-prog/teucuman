'use strict';
require('dotenv').config();

const express = require('express');
const path    = require('path');
const { pool } = require('./config/db');

// ── Middlewares ───────────────────────────────────────────────────────────────
const cors         = require('./middlewares/cors');
const logger       = require('./middlewares/logger');
const stripQuery   = require('./middlewares/stripQuery');
const errorHandler = require('./middlewares/errorHandler');

// ── Routes ────────────────────────────────────────────────────────────────────
const gameRoutes  = require('./routes/gameRoutes');
const stubRoutes  = require('./routes/stubRoutes');
const { lobby }   = require('./controllers/lobbyController');

// ── Registry (carrega os jogos) ───────────────────────────────────────────────
const gameRegistry = require('./config/gameRegistry');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000');

// ── Global Middlewares ────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));
app.use(cors);
app.use(logger);
app.use(stripQuery);

// ── Favicon ───────────────────────────────────────────────────────────────────
app.get('/favicon.png', (_req, res) => res.sendFile(path.join(__dirname, '../public/favicon.png')));
app.get('/favicon.ico', (_req, res) => res.sendFile(path.join(__dirname, '../public/favicon.png')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', lobby);
app.use('/api/slots', gameRoutes);
app.use(stubRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Not Found: ${req.originalUrl}`);
});

// ── Error Handler (centralizado) ──────────────────────────────────────────────
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

  const games = gameRegistry.entries();
  app.listen(PORT, () => {
    console.log('');
    games.forEach(([id, { emoji, label }]) => {
      console.log(`  ${emoji} ${label.padEnd(22)} → http://localhost:${PORT}/api/slots/${id}/gs2c/html5Game.html`);
    });
    console.log('');
  });
}

start();
