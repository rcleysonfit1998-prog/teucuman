'use strict';

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}

module.exports = errorHandler;
