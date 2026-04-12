#!/usr/bin/env node
'use strict';

/**
 * Usage:
 *   node scripts/extract-har.js <slug> <path/to/file.har>
 *
 * Example:
 *   node scripts/extract-har.js cult ../cult.har
 *   node scripts/extract-har.js zeus ../zeus.har
 *   node scripts/extract-har.js pub  ../pub.har
 *
 * What it does:
 *   1. Extracts all static assets → public/ (preserving Pragmatic URL paths)
 *   2. Extracts gameService responses → games/{slug}/responses/index.json
 *   3. Creates games/{slug}/game5Html.html (patched to localhost)
 */

const fs   = require('fs');
const path = require('path');

const [,, slug, harPath] = process.argv;

if (!slug || !harPath) {
  console.error('Usage: node scripts/extract-har.js <slug> <path/to/file.har>');
  process.exit(1);
}

const VALID_SLUGS = ['cult', 'zeus', 'pub'];
if (!VALID_SLUGS.includes(slug)) {
  console.error(`Invalid slug. Must be one of: ${VALID_SLUGS.join(', ')}`);
  process.exit(1);
}

const ROOT   = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const GAMES  = path.join(ROOT, 'games', slug);
const LOCAL  = 'http://localhost:3000';

console.log(`\n[extract-har] slug=${slug} har=${harPath}\n`);

// ── Load HAR ──────────────────────────────────────────────────────────────────
let har;
try {
  har = JSON.parse(fs.readFileSync(harPath, 'utf8'));
} catch (err) {
  console.error('Failed to read HAR:', err.message);
  process.exit(1);
}

const entries = har.log.entries;
console.log(`[extract-har] ${entries.length} entries found`);

// ── Extract gameService responses ─────────────────────────────────────────────
const responses = { doInit: null, doSpin: [], doCollect: [] };

for (const entry of entries) {
  const url = entry.request.url;
  if (!url.includes('gameService')) continue;

  const body   = entry.request.postData?.text || '';
  const params = Object.fromEntries(
    body.split('&').filter(p => p.includes('=')).map(p => p.split('='))
  );
  const action = params.action || '';
  const text   = entry.response.content?.text || '';
  if (!text) continue;

  if (action === 'doInit' && !responses.doInit) responses.doInit = text;
  else if (action === 'doSpin')    responses.doSpin.push(text);
  else if (action === 'doCollect') responses.doCollect.push(text);
}

console.log(`[responses] doInit: ${responses.doInit ? '✓' : '✗'} | doSpin: ${responses.doSpin.length} | doCollect: ${responses.doCollect.length}`);

fs.mkdirSync(path.join(GAMES, 'responses'), { recursive: true });
fs.writeFileSync(
  path.join(GAMES, 'responses', 'index.json'),
  JSON.stringify(responses, null, 2)
);
console.log(`[responses] Saved to games/${slug}/responses/index.json`);

// ── Extract + patch game5Html ─────────────────────────────────────────────────
let gameHtml = null;
for (const entry of entries) {
  if (entry.request.url.includes('html5Game.do') || entry.request.url.includes('game5Html')) {
    gameHtml = entry.response.content?.text || '';
    break;
  }
}

if (gameHtml) {
  // 1. Remove external domain
  gameHtml = gameHtml.replace(/https?:\/\/demogamesfree\.pragmaticplay\.net/g, '');

  // 2. Force UHT_ALL = true
  gameHtml = gameHtml.replace(/UHT_ALL\s*=\s*(true|false)/g, 'UHT_ALL = true');

  // 3. Patch gameConfig
  const idx = gameHtml.indexOf("Html5GameManager.init(");
  if (idx >= 0) {
    const gcIdx   = gameHtml.indexOf("gameConfig:", idx);
    const gcStart = gameHtml.indexOf("'", gcIdx) + 1;
    const gcEnd   = gameHtml.indexOf("'", gcStart);
    try {
      const cfg = JSON.parse(gameHtml.slice(gcStart, gcEnd));

      // Detect asset path version from existing datapath
      const dpMatch = (cfg.datapath || '').match(/\/(v\d+)\//);
      const version = dpMatch ? dpMatch[1] : 'v2';

      const symbol = cfg.datapath?.match(/vs[\w]+/)?.[0] || 'vs25scolymp';

      cfg.datapath             = `${LOCAL}/gs2c/common/${version}/games-html5/games/vs/${symbol}/`;
      cfg.datapath_alternative = cfg.datapath;
      // Detect gameService version from HAR
      const gsMatch = (cfg.gameService || '').match(/\/ge\/(v\d+)\//);
      const gsVersion = gsMatch ? gsMatch[1] : 'v5';
      cfg.gameService          = `${LOCAL}/gs2c/ge/${gsVersion}/gameService`;
      cfg.statisticsURL        = `${LOCAL}/gs2c/stats.do`;
      cfg.RELOAD_BALANCE       = `${LOCAL}/gs2c/reloadBalance.do`;
      cfg.RELOAD_JACKPOT       = `${LOCAL}/gs2c/jackpot/reload.do`;
      cfg.SETTINGS             = `${LOCAL}/gs2c/saveSettings.do`;
      cfg.LOGOUT               = `${LOCAL}/gs2c/logout.do`;
      cfg.REGULATION           = `${LOCAL}/gs2c/regulation/process.do?symbol=${symbol}`;

      gameHtml = gameHtml.slice(0, gcStart) + JSON.stringify(cfg) + gameHtml.slice(gcEnd);
      console.log(`[html5Game] gameConfig patched (${symbol}, ${version})`);
    } catch (e) {
      console.warn('[html5Game] Could not parse gameConfig:', e.message);
    }
  }

  // 4. Inject stubs before last </script>
  const stubs = `
// ── Local stubs (injected by extract-har.js) ──────────────────────────────────
window.ga   = function() {};
window.gtag = function() {};
function SendTrackingIfQueued() {}
var globalTracking = {
  StopTimerAndSend: function() {},
  SendEvent:        function() {},
  StartTimer:       function() {},
  GetTimerValue:    function() { return 0; }
};
window.onbeforeunload = function() { return; };
// ── Fix: ParseConfigFile crashes when configFile=false ───────────────────────
(function() {
  var _i = setInterval(function() {
    if (typeof ServerInterface === 'undefined' || !ServerInterface.prototype) return;
    clearInterval(_i);
    var _orig = ServerInterface.prototype.ParseConfigFile;
    ServerInterface.prototype.ParseConfigFile = function() {
      if (!this.configFile || !this.configFile.text) {
        try {
          ServerOptions.isOnline = (typeof UHT_ONLINE !== 'undefined') ? UHT_ONLINE : true;
          ServerOptions.isArcadeGame = this.isArcadeGame;
          if (typeof UHT_GAME_CONFIG_SRC !== 'undefined' && UHT_GAME_CONFIG_SRC['replayMode'] === true) {
            ServerOptions.isOnline = false; ServerOptions.isReplay = true;
          }
        } catch(e) {}
        return;
      }
      try { _orig.call(this); } catch(e) {
        ServerOptions.isOnline = (typeof UHT_ONLINE !== 'undefined') ? UHT_ONLINE : true;
        ServerOptions.isArcadeGame = this.isArcadeGame;
      }
    };
  }, 10);
})();

// Redirect any remaining external XHR to localhost
(function() {
  var LOCAL = location.origin;
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && /^https?:\\/\\/(?!localhost)/.test(url)) {
      try { var u = new URL(url); url = LOCAL + u.pathname + u.search; } catch(e) {}
    }
    return _open.apply(this, arguments);
  };
  function patchXDomain() {
    if (window.XDomainRequestProvider) {
      XDomainRequestProvider.GetOrigin = function() { return LOCAL; };
    } else { setTimeout(patchXDomain, 50); }
  }
  patchXDomain();
})();
`;

  const lastScript = gameHtml.lastIndexOf('</script>');
  if (lastScript >= 0) {
    gameHtml = gameHtml.slice(0, lastScript) + stubs + '</script>' + gameHtml.slice(lastScript + 9);
  }

  fs.writeFileSync(path.join(GAMES, 'game5Html.html'), gameHtml);
  console.log(`[html5Game] Saved to games/${slug}/game5Html.html`);
} else {
  console.warn('[html5Game] Not found in HAR — skipping');
}

// ── Extract static assets ─────────────────────────────────────────────────────
let saved = 0;
let skipped = 0;

for (const entry of entries) {
  const url = entry.request.url;

  // Only Pragmatic CDN assets
  if (!url.includes('pragmaticplay.net')) continue;

  // Skip dynamic endpoints
  const skip = ['gameService', 'html5Game.do', 'reloadBalance', 'saveSettings', 'stats.do', 'collect'];
  if (skip.some(s => url.includes(s))) continue;

  const content  = entry.response.content;
  const text     = content?.text || '';
  const encoding = content?.encoding || '';

  if (!text) { skipped++; continue; }

  // Strip query string from path
  let assetPath = url.split('pragmaticplay.net')[1]?.split('?')[0];
  if (!assetPath) { skipped++; continue; }
  if (assetPath.endsWith('/')) assetPath = assetPath.slice(0, -1);

  const dest = path.join(PUBLIC, assetPath);

  // Skip if this would overwrite a directory
  if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) { skipped++; continue; }

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (encoding === 'base64') {
    fs.writeFileSync(dest, Buffer.from(text, 'base64'));
  } else {
    fs.writeFileSync(dest, text, 'utf8');
  }
  saved++;
}

console.log(`[assets] Saved: ${saved} | Skipped: ${skipped}`);
console.log(`\n[extract-har] Done ✓\n`);
