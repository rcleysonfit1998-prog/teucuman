'use strict';

// Endpoints that legitimately use query parameters must not have them stripped.
const KEEP = ['gameService', 'reloadBalance', 'saveSettings', 'html5Game'];

module.exports = function queryStrip(req, _res, next) {
  if (!KEEP.some(k => req.path.includes(k))) {
    req.url = req.url.split('?')[0];
  }
  next();
};
