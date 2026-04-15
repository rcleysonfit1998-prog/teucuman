'use strict';

const gameRegistry = require('../config/gameRegistry');

function lobby(_req, res) {
  const links = gameRegistry
    .entries()
    .map(
      ([id, { emoji, label }]) =>
        `<a href="/api/slots/${id}/gs2c/html5Game.html">
          <span class="emoji">${emoji}</span>
          ${label}
        </a>`
    )
    .join('\n      ');

  res.send(`<!DOCTYPE html><html><head><title>Casino</title>
  <link rel="icon" href="/favicon.png">
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#0f0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',sans-serif;gap:24px;}
    h1{color:#fff;font-size:2rem;letter-spacing:2px;}
    .games{display:flex;gap:20px;flex-wrap:wrap;justify-content:center;}
    a{display:flex;flex-direction:column;align-items:center;gap:10px;color:#fff;background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:24px 40px;border-radius:16px;text-decoration:none;font-size:1.1rem;font-weight:bold;transition:transform .2s,box-shadow .2s;box-shadow:0 4px 20px rgba(124,58,237,.4);}
    a:hover{transform:translateY(-4px);box-shadow:0 8px 30px rgba(124,58,237,.6);}
    .emoji{font-size:2.5rem;}
  </style></head>
  <body>
    <h1>🎰 Casino</h1>
    <div class="games">
      ${links}
    </div>
  </body></html>`);
}

module.exports = { lobby };
