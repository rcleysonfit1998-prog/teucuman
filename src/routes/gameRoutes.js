'use strict';

const { Router }                      = require('express');
const gameRegistryMiddleware          = require('../middlewares/gameRegistry');
const { gameService }                 = require('../controllers/gameController');
const { reloadBalance, saveSettings } = require('../controllers/balanceController');

/**
 * Mounted at: /api/slots/:gameId
 * mergeParams: true  → makes :gameId visible inside this router.
 *
 * All routes here first pass through gameRegistryMiddleware which:
 *   - Validates :gameId exists in the registry
 *   - Attaches req.engine for the gameController to use
 *   - Returns 404 automatically for unknown game IDs
 */
const router = Router({ mergeParams: true });

router.use(gameRegistryMiddleware);

// Game engine — provider posts every game action here
router.post('/gs2c_/gameService', gameService);

// Shared balance & settings — identical contract for every game
router.get( '/gs2c/reloadBalance.do', reloadBalance);
router.post('/gs2c/saveSettings.do',  saveSettings);

// Provider telemetry stubs — silently acknowledged
const stub = (_req, res) => res.status(200).send('');
router.all('/gs2c/stats.do',     stub);
router.all('/gs2c/clientLog.do', stub);

module.exports = router;
