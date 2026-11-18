/**
 * conversationRepository.js — Tenant-isolated persistence for `conversations` and `messages`.
 */
import { query as defaultDbQuery } from '../../db.js';
import { getCurrentTenantId, DEFAULT_TENANT_ID } from '../../core/server/tenancy/tenantContext.js';
import { rowToConversation, rowToMessage } from '../utils/formatters.js';

export const createInMemoryConversationStore = () => {
  const convMap = new Map(); // key: `${tenantId}::${convId}`

  return {
    async listByTenant(explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const list = [];
      for (const [k, conv] of convMap.entries()) {
        if (k.startsWith(`${tid}::`)) list.push(conv);
      }
      return list;
    },

    async seedConversation(tenantId, conv) {
      const tid = tenantId || DEFAULT_TENANT_ID;
      const key = `${tid}::${conv.id}`;
      if (!convMap.has(key)) {
        convMap.set(key, {
          ...conv,
          messages: Array.isArray(conv.messages) ? [...conv.messages] : [],
        });
      }
      return convMap.get(key);
    },
  };
};

export const createPgConversationRepository = ({ query = defaultDbQuery } = {}) => {
  const mem = createInMemoryConversationStore();

  return {
    async listByTenant(explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      try {
        const convResult = await query(
          `SELECT * FROM conversations WHERE tenant_id = $1 ORDER BY updated_at DESC`,
          [tid]
        );
        const msgResult = await query(
          `SELECT * FROM messages WHERE tenant_id = $1 ORDER BY created_at ASC`,
          [tid]
        );
        if (convResult?.rows) {
          const msgMap = {};
          for (const msg of msgResult?.rows || []) {
            if (!msgMap[msg.conversation_id]) msgMap[msg.conversation_id] = [];
            msgMap[msg.conversation_id].push(rowToMessage(msg));
          }
          return convResult.rows.map((row) => rowToConversation(row, msgMap[row.id] || []));
        }
      } catch { /* fallback to mem */ }
      return mem.listByTenant(tid);
    },

    async seedConversation(tenantId, conv) {
      const tid = tenantId || DEFAULT_TENANT_ID;
      await mem.seedConversation(tid, conv);
      try {
        await query(
          `INSERT INTO conversations (
             tenant_id, id, customer_id, customer_name, customer_tier, channel, channel_account,
             time, last_message_preview, label, unread_count, status, assigned_to, team, tab_group, is_bot_active
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,TRUE)
           ON CONFLICT (tenant_id, id) DO NOTHING`,
          [
            tid,
            conv.id,
            conv.customerId,
            conv.customerName,
            conv.customerTier || 'MEMBER',
            conv.channel || 'LINE',
            conv.channelAccount || 'Official Account',
            conv.time || '10:00',
            conv.lastMessagePreview || '',
            conv.label || '',
            Number(conv.unreadCount || 0),
            conv.status || 'Open',
            conv.assignedTo || 'วิภา ส.',
            conv.team || 'Service Desk',
            conv.tabGroup || 'Mine',
          ]
        );
        for (const m of conv.messages || []) {
          await query(
            `INSERT INTO messages (tenant_id, id, conversation_id, sender, author_name, text, time, is_private_note)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (tenant_id, id) DO NOTHING`,
            [
              tid,
              m.id,
              conv.id,
              m.sender || 'customer',
              m.authorName || null,
              m.text || '',
              m.time || '10:00',
              Boolean(m.isPrivateNote),
            ]
          );
        }
      } catch { /* retained in mem when DB unavailable */ }
    },
  };
};

export const conversationRepository = createPgConversationRepository();
