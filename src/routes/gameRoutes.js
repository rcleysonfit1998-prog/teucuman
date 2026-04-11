'use strict';

const express    = require('express');
const router     = express.Router();

const { gameService }               = require('../controllers/gameService');
const { html5Game }                 = require('../controllers/html5Game');
const { reloadBalance, saveSettings } = require('../controllers/balance');

// ── Entry point ───────────────────────────────────────────────────────────────
router.get('/game5Html.html', html5Game);

// ── gameService (v4 and v5) ───────────────────────────────────────────────────
router.post('/ge/v4/gameService', gameService);
router.post('/ge/v5/gameService', gameService);
router.post('/gameService',       gameService);   // fallback without version

// ── Balance / settings ────────────────────────────────────────────────────────
router.get('/reloadBalance.do', reloadBalance);
router.post('/saveSettings.do', saveSettings);

// ── Pragmatic stubs (return 200 empty so the engine doesn't block) ────────────
const stub200 = (_req, res) => res.status(200).send('');
router.get('/stats.do',                stub200);
router.post('/stats.do',               stub200);
router.get('/clientLog.do',            stub200);
router.post('/clientLog.do',           stub200);
router.all('/jackpot/*',               stub200);
router.all('/regulation/*',            stub200);
router.all('/logout.do',               stub200);
router.all('/closeGame.do',            stub200);
router.all('/announcements/*',         stub200);
router.all('/promo/*',                 stub200);
router.get(/customizations\.info/,     stub200);
router.get(/project_settings/,         stub200);

module.exports = router;
