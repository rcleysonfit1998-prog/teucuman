'use strict';
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }
    : { host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'pragmatic_pub',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'postgres' }
);

pool.on('error', err => console.error('[DB] Pool error:', err.message));

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, pool };
