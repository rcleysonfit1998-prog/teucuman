'use strict';

const { query } = require('../config/db');

async function lobby(req, res) {
  try {
    const { rows: games } = await query(
      `SELECT slug, symbol, name, gs_version, enabled
       FROM games
       ORDER BY id ASC`
    );

    const PORT = process.env.PORT || 3000;
    const base = `http://localhost:${PORT}`;

    const cards = games.map(g => `
      <div class="card ${g.enabled ? '' : 'disabled'}">
        <div class="badge">${g.gs_version.toUpperCase()}</div>
        <div class="symbol">${g.symbol}</div>
        <h2>${g.name}</h2>
        <a class="btn ${g.enabled ? '' : 'btn-disabled'}"
           href="${g.enabled ? `/gs2c/game5Html.html?slug=${g.slug}` : '#'}">
          ${g.enabled ? 'Jogar' : 'Indisponível'}
        </a>
      </div>`).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pragmatic Play — Local Server</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0d0d0d;
      color: #f0f0f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
    }

    header {
      text-align: center;
      margin-bottom: 48px;
    }

    header h1 {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #fff;
    }

    header p {
      margin-top: 8px;
      font-size: 0.875rem;
      color: #666;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      width: 100%;
      max-width: 960px;
    }

    .card {
      position: relative;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 16px;
      padding: 32px 24px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.2s, transform 0.2s;
    }

    .card:hover:not(.disabled) {
      border-color: #f59e0b;
      transform: translateY(-2px);
    }

    .card.disabled {
      opacity: 0.45;
    }

    .badge {
      position: absolute;
      top: 16px;
      right: 16px;
      background: #f59e0b22;
      color: #f59e0b;
      border: 1px solid #f59e0b44;
      border-radius: 6px;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      letter-spacing: 1px;
    }

    .symbol {
      font-size: 0.7rem;
      color: #555;
      letter-spacing: 0.5px;
      font-family: monospace;
    }

    .card h2 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
      line-height: 1.3;
    }

    .btn {
      margin-top: auto;
      display: inline-block;
      text-align: center;
      padding: 12px 0;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      background: #f59e0b;
      color: #000;
      transition: background 0.2s;
    }

    .btn:hover { background: #fbbf24; }

    .btn-disabled {
      background: #2a2a2a;
      color: #444;
      cursor: not-allowed;
      pointer-events: none;
    }

    footer {
      margin-top: 64px;
      font-size: 0.75rem;
      color: #333;
    }
  </style>
</head>
<body>
  <header>
    <h1>Pragmatic Play</h1>
    <p>Local development server — ${base}</p>
  </header>

  <div class="grid">
    ${cards}
  </div>

  <footer>${games.length} game${games.length !== 1 ? 's' : ''} registrado${games.length !== 1 ? 's' : ''}</footer>
</body>
</html>`;

    res.status(200).type('html').send(html);

  } catch (err) {
    console.error('[lobby] Error:', err.message);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = { lobby };
