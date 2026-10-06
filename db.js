// =====================================================
// db.js — PostgreSQL Connection Pool
// Uses DATABASE_URL environment variable (Coolify style)
// =====================================================
import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ [DB Warning]: DATABASE_URL environment variable is not set. Database operations will fallback gracefully.');
}

const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/cb360_test';
const useSsl =
  process.env.DB_SSL === 'true' ||
  dbUrl.includes('sslmode=require') ||
  dbUrl.includes('neon.tech') ||
  dbUrl.includes('supabase.co');

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
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
