'use strict';

const { Router } = require('express');
const path = require('path');
const express = require('express');
const resolveGame = require('../middlewares/resolveGame');
const gameCtrl = require('../controllers/gameController');

const router = Router();

// Rota de captura para pedidos sem `:gameId` (ex.: /api/slots/gs2c_/gameService)
// Retorna erro claro explicando o formato correto da URL.
router.all('/gs2c_/gameService', (_req, res) =>
  res.status(400).json({ error: 'Missing gameId in URL. Expected /api/slots/:gameId/gs2c_/gameService' })
);

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

// Captura a rota de customização para qualquer jogo
router.all('/:gameId/gs2c/common/v1/games-html5/games/vs/:gameName/desktop/customizations.info', (_req, res) => res.status(200).json({}));

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
