import { query } from '../../db.js';

/**
 * Ensures required database schema extensions exist on startup
 */
export const ensureDatabaseSchema = async () => {
  try {
    await query(`
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_bot_active BOOLEAN DEFAULT TRUE;
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_reply_token TEXT;
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_reply_token_time TIMESTAMPTZ;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'delivered';
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS failure_reason TEXT;

      CREATE TABLE IF NOT EXISTS connector_settings (
        id TEXT PRIMARY KEY,
        config JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ [DB Schema] Verified conversations, messages, and connector_settings schema');
  } catch (err) {
    console.warn('⚠️ [DB Schema Init Notice]:', err.message);
  }
};
