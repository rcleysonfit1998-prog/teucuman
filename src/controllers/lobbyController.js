'use strict';

const registry = require('../engines/registry');

/**
 * GET /
 * Auto-generates a lobby listing every registered game.
 * Adding a new game to registry.js is enough to make it appear here.
 */
function lobbyIndex(_req, res) {
  const items = [...registry.keys()]
    .map(id => `<li><a href="/gs2c/html5Game.html?gameId=${id}">&#9654; ${id.toUpperCase()}</a></li>`)
    .join('\n    ');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pragmatic Play — Local Lobby</title>
  <style>
    body { background: #111; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
    ul   { list-style: none; padding: 0; text-align: center; }
    li   { margin: 12px 0; }
    a    { color: #fff; background: #f59e0b; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 1.2rem; font-weight: bold; display: inline-block; }
    a:hover { background: #d97706; }
  </style>
</head>
<body>
  <ul>
    ${items}
  </ul>
</body>
</html>`);
}

module.exports = { lobbyIndex };
