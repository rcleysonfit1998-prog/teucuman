'use strict';

/**
 * Game Registry — maps gameId → engine instance.
 *
 * Each engine MUST export:
 *   handle(action: string, params: object): Promise<string>
 *
 * To add a new game:
 *   1. Create src/engines/<id>.js implementing the handle() contract
 *   2. Add one line below: registry.set('<id>', require('./<id>'));
 *
 * Current mapping:
 *   sb    → Sweet Bonanza 1000  (vs20fruitsw)
 *   sr    → Sugar Rush          (vs20sugarrush) — uncomment when ready
 *   gates → Gates of Olympus    (vs20olympgate) — uncomment when ready
 */
const registry = new Map([
  ['sb', require('./sb')],
  // ['sr',    require('./sr')],
  // ['gates', require('./gates')],
]);

module.exports = registry;
