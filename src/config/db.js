'use strict';

require('dotenv').config();
const { Pool } = require('pg');

// Railway provides DATABASE_URL, local uses individual vars
const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host:     process.env.DB_HOST || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'pragmatic',
      user:     process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
    };

const pool = new Pool({
  ...connectionConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Run a parameterized query.
 * @param {string} text  - SQL string with $1, $2... placeholders
 * @param {any[]}  params
 */
async function query(text, params) {
  const start = Date.now();
  const res   = await pool.query(text, params);
  const ms    = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] ${ms}ms | ${text.slice(0, 80).replace(/\s+/g, ' ')}`);
  }
  return res;
}

/**
 * Grab a client from the pool for transactions.
 */
async function getClient() {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);
  client.release = () => {
    client.release = originalRelease;
    return originalRelease();
  };
  return client;
}

module.exports = { query, getClient, pool };
