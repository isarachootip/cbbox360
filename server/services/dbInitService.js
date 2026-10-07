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

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        user_id TEXT NOT NULL,
        user_role TEXT,
        action TEXT NOT NULL,
        category TEXT NOT NULL,
        resource TEXT,
        ip_address TEXT,
        status TEXT DEFAULT 'success',
        details TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    `);
    console.log('✅ [DB Schema] Verified conversations, messages, connector_settings, and audit_logs schema');
  } catch (err) {
    console.warn('⚠️ [DB Schema Init Notice]:', err.message);
  }
};
