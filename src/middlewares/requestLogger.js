'use strict';

const MUTED = ['/collect', '/gs2c/stats.do', '/gs2c/clientLog.do', '/favicon.ico'];

function requestLogger(req, res, next) {
  // Skip noisy telemetry endpoints in logs
  if (MUTED.some(p => req.path.startsWith(p))) return next();

  const start = Date.now();
  res.on('finish', () => {
    const ms     = Date.now() - start;
    const color  = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const reset  = '\x1b[0m';
    console.log(`${color}${req.method}${reset} ${req.path} → ${res.statusCode} (${ms}ms)`);
  });
  next();
}

module.exports = requestLogger;
