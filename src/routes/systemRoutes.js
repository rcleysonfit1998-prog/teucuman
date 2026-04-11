'use strict';

const express = require('express');
const router  = express.Router();
const { lobby } = require('../controllers/index');

// ── Lobby ────────────────────────────────────────────────────────────────────
router.get('/', lobby);

// ── Grafana Faro telemetry (silenced) ─────────────────────────────────────────
router.post('/collect', (_req, res) => res.status(204).end());
router.all('/collect',  (_req, res) => res.status(204).end());

// ── Lobby (game triggers a GET for meta.html — return empty) ──────────────────
router.all('/apps/*', (_req, res) => res.status(200).send(''));

module.exports = router;
