'use strict';

const db = require('../config/db');
const { DEFAULT_BALANCE, fmt } = require('../utils/constants');

async function getBalance(mgckey) {
  const { rows } = await db.query('SELECT balance FROM sessions WHERE mgckey=$1', [mgckey]);
  return rows[0] ? parseFloat(rows[0].balance) : DEFAULT_BALANCE;
}

function formatBalanceResponse(balance) {
  return (
    `balance_bonus=0.00&balance=${fmt(balance)}` +
    `&balance_cash=${fmt(balance)}&stime=${Date.now()}`
  );
}

module.exports = { getBalance, formatBalanceResponse };
