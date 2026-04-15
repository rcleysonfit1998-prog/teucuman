'use strict';

const { Router } = require('express');

const router = Router();

const stub      = (_req, res) => res.status(200).send('');
const noContent = (_req, res) => res.status(204).end();

router.all('/gs2c/jackpot/*',       stub);
router.all('/gs2c/regulation/*',    stub);
router.all('/gs2c/logout.do',       stub);
router.all('/gs2c/closeGame.do',    stub);
router.all('/gs2c/announcements/*', stub);
router.all('/gs2c/promo/*',         stub);
router.all('/collect',              noContent);
router.all('/j/collect',            noContent);
router.all('/cdn-cgi/*',            noContent);
router.all('/apps/*',               stub);

module.exports = router;
