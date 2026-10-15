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

      CREATE TABLE IF NOT EXISTS ai_summaries (
        conversation_id TEXT PRIMARY KEY,
        message_count INTEGER NOT NULL DEFAULT 0,
        result JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_usage_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        feature TEXT NOT NULL,
        response_time_ms INTEGER DEFAULT 0,
        status TEXT DEFAULT 'success',
        selected_label TEXT,
        selected_text TEXT,
        final_sent_text TEXT,
        was_edited BOOLEAN,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_conv ON ai_usage_logs(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('sysadmin', 'admin', 'SF_1', 'SF_2', 'SF_3', 'supervisor')),
        department TEXT,
        initials TEXT,
        avatar_bg TEXT DEFAULT '#CFE2F8',
        password_hash TEXT NOT NULL,
        must_change_password BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        totp_secret_encrypted TEXT,
        totp_enabled BOOLEAN DEFAULT FALSE,
        totp_enrolled_at TIMESTAMPTZ,
        failed_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMPTZ,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username));

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        auth_stage TEXT NOT NULL DEFAULT 'AUTHENTICATED',
        temp_totp_secret_encrypted TEXT,
        ip_address TEXT,
        user_agent TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

      CREATE TABLE IF NOT EXISTS menu_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT UNIQUE NOT NULL,
        active_match TEXT,
        icon TEXT NOT NULL,
        section TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 1,
        badge TEXT,
        description TEXT,
        is_system BOOLEAN DEFAULT TRUE,
        allowed_roles JSONB NOT NULL DEFAULT '["sysadmin","admin"]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ [DB Schema] Verified conversations, messages, connector_settings, audit_logs, ai_summaries, ai_usage_logs, users, sessions, and menu_configs');
  } catch (err) {
    console.warn('⚠️ [DB Schema Init Notice]:', err.message);
  }
};

