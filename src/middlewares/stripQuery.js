'use strict';

const KEEP = ['gameService', 'reloadBalance', 'saveSettings', 'html5Game'];

function stripQuery(req, _res, next) {
  if (!KEEP.some((k) => req.path.includes(k))) {
    req.url = req.url.split('?')[0];
  }
  next();
}

module.exports = stripQuery;
