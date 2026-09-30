import { query } from '../../db.js';

/**
 * Ensures required database schema extensions exist on startup
 */
export const ensureDatabaseSchema = async () => {
  try {
    await query(`
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_bot_active BOOLEAN DEFAULT TRUE;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'delivered';
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS failure_reason TEXT;
    `);
    console.log('✅ [DB Schema] Verified conversations and messages columns');
  } catch (err) {
    // If tables don't exist yet, migrate.js will create them
    console.warn('⚠️ [DB Schema Init Notice]:', err.message);
  }
};
