'use strict';

const MUTED = ['/stats', '/favicon', '/rum', '/collect'];

function logger(req, res, next) {
  if (MUTED.some((p) => req.path.includes(p))) return next();

  const start = Date.now();
  res.on('finish', () => {
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(
      `${color}${req.method}\x1b[0m ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`
    );
  });
  next();
}

module.exports = logger;
