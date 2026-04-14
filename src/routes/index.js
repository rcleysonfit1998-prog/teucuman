'use strict';

const path    = require('path');
const express = require('express');
const { Router } = require('express');

const gameRoutes             = require('./gameRoutes');
const stubRoutes             = require('./stubRoutes');
const { lobbyIndex }         = require('../controllers/lobbyController');
const registry               = require('../engines/registry');

const router = Router();

// ── Static assets ─────────────────────────────────────────────────────────────
// Served without caching so local file changes are reflected immediately.
router.use('/gs2c', express.static(path.join(__dirname, '../../public/gs2c'), {
  maxAge: 0,
  etag: false,
  setHeaders: res => res.setHeader('Cache-Control', 'no-store'),
}));

// ── Game HTML shell ───────────────────────────────────────────────────────────
// ?gameId=sb (default) selects which game's html5Game.html to serve.
// gameId is validated against the registry to prevent path traversal.
router.get('/gs2c/html5Game.html', (req, res) => {
  const gameId = registry.has(req.query.gameId) ? req.query.gameId : 'sb';
  res.sendFile(path.join(__dirname, '../../games', gameId, 'html5Game.html'));
});

// ── Game API — dynamic per :gameId ────────────────────────────────────────────
// Adding a new engine to registry.js is enough to expose it here automatically.
router.use('/api/slots/:gameId', gameRoutes);

// ── Provider infrastructure stubs ─────────────────────────────────────────────
router.use(stubRoutes);

// ── Lobby ─────────────────────────────────────────────────────────────────────
router.get('/', lobbyIndex);

// ── 404 fallback ──────────────────────────────────────────────────────────────
router.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Not Found: ${req.originalUrl}`);
});

module.exports = router;
