'use strict';

const path = require('path');
const fs   = require('fs');
const { GAMES, slugFromSymbol } = require('../config/games');

const GAMES_DIR = path.join(__dirname, '../../games');
const LOCAL     = `http://localhost:${process.env.PORT || 3000}`;

/**
 * GET /gs2c/game5Html.html?slug=cult
 * Mirrors what html5Game.do does on Pragmatic's CDN.
 */
function html5Game(req, res) {
  const slug = req.query.slug;
  const game = GAMES[slug];

  if (!game) {
    return res.status(404).send(`Unknown slug: ${slug}`);
  }

  const filePath = path.join(GAMES_DIR, slug, 'game5Html.html');
  if (!fs.existsSync(filePath)) {
    return res.status(404).send(`game5Html.html not found for: ${slug}`);
  }

  res
    .status(200)
    .type('html')
    .set('Cache-Control', 'no-cache')
    .sendFile(filePath);
}

module.exports = { html5Game };
