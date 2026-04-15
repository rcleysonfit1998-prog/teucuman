'use strict';

const { Router } = require('express');
const path = require('path');
const express = require('express');
const resolveGame = require('../middlewares/resolveGame');
const gameCtrl = require('../controllers/gameController');

const router = Router();

// Todas as rotas abaixo exigem :gameId válido
router.use('/:gameId', resolveGame);

// ── HTML do jogo ──────────────────────────────────────────────────────────────
// Mapeamento symbol → pasta dentro de /games/
const SYMBOL_TO_FOLDER = {
  vs20fruitswx:   'sb',
  vs20sugarrushx: 'sr',
};

router.get('/:gameId/gs2c/html5Game.html', (req, res) => {
  const folder = SYMBOL_TO_FOLDER[req.game.symbol];
  if (!folder) return res.status(404).send('Game HTML not found');
  res.sendFile(path.join(__dirname, '../../games', folder, 'html5Game.html'));
});

// ── Game Service (com underscore no path, padrão Pragmatic) ───────────────────
router.post('/:gameId/gs2c_/gameService', gameCtrl.gameService);

// ── Balance & Settings (compartilhados) ───────────────────────────────────────
router.get('/:gameId/gs2c/reloadBalance.do', gameCtrl.reloadBalance);
router.post('/:gameId/gs2c/saveSettings.do', gameCtrl.saveSettings);

// ── Stats stub ────────────────────────────────────────────────────────────────
router.all('/:gameId/gs2c/stats.do', (_req, res) => res.status(200).send(''));

// ── Assets estáticos do jogo (unificados) ─────────────────────────────────────
router.use(
  '/:gameId/gs2c',
  express.static(path.join(__dirname, '../../public/gs2c'), {
    maxAge: 0,
    etag: false,
    setHeaders: (res) => res.setHeader('Cache-Control', 'no-store'),
  })
);

module.exports = router;
