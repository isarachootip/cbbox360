-- 004_tenant_scoped_customers_and_chats.up.sql
-- Ensures customers, conversations, and messages are strictly isolated per tenant_id with composite primary keys.

CREATE TABLE IF NOT EXISTS conversations (
  id                    TEXT NOT NULL,
  tenant_id             TEXT NOT NULL DEFAULT 'default',
  customer_id           TEXT,
  customer_name         TEXT,
  customer_avatar       TEXT,
  customer_tier         TEXT DEFAULT 'MEMBER',
  channel               TEXT DEFAULT 'LINE',
  channel_account       TEXT,
  time                  TEXT,
  last_message_preview  TEXT,
  label                 TEXT,
  unread_count          INTEGER DEFAULT 0,
  status                TEXT DEFAULT 'Open',
  assigned_to           TEXT,
  team                  TEXT,
  tab_group             TEXT DEFAULT 'Mine',
  line_user_id          TEXT,
  is_bot_active         BOOLEAN DEFAULT TRUE,
  last_reply_token      TEXT,
  last_reply_token_time TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS messages (
  id               TEXT NOT NULL,
  tenant_id        TEXT NOT NULL DEFAULT 'default',
  conversation_id  TEXT NOT NULL,
  sender           TEXT,
  author_name      TEXT,
  text             TEXT,
  time             TEXT,
  tracking_number  TEXT,
  is_private_note  BOOLEAN DEFAULT FALSE,
  delivery_status  TEXT DEFAULT 'delivered',
  failure_reason   TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

ALTER TABLE IF EXISTS messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE IF EXISTS messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS messages ADD PRIMARY KEY (tenant_id, id);

ALTER TABLE IF EXISTS conversations DROP CONSTRAINT IF EXISTS conversations_pkey;
ALTER TABLE IF EXISTS conversations ADD PRIMARY KEY (tenant_id, id);

ALTER TABLE IF EXISTS customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS customers ADD PRIMARY KEY (tenant_id, id);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_created ON customers(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_updated ON conversations(tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_conv ON messages(tenant_id, conversation_id, created_at ASC);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_customers ON customers;
CREATE POLICY tenant_isolation_customers ON customers
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_conversations ON conversations;
CREATE POLICY tenant_isolation_conversations ON conversations
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_messages ON messages;
CREATE POLICY tenant_isolation_messages ON messages
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), ''), 'default'));
