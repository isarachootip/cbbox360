// =====================================================
// db.js — PostgreSQL Connection Pool
// Uses DATABASE_URL environment variable (Coolify style)
// =====================================================
import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL.includes('localhost') ||
    process.env.DATABASE_URL.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ [DB Pool Error]:', err.message);
});

pool.on('connect', () => {
  console.log('✅ [DB] Connected to PostgreSQL');
});

/**
 * Helper: run a single query
 * @param {string} text - SQL query
 * @param {Array}  params - query parameters
 */
export const query = (text, params) => pool.query(text, params);

export default pool;
