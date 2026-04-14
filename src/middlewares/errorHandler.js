'use strict';

/**
 * Centralized Express error handler (4-argument signature required by Express).
 * All controllers forward errors via next(err) — never let them send 500 responses
 * individually, as that would bypass this handler.
 */
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);
  res.status(status).type('text/plain').send('error=1');
};
