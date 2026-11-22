/**
 * caseRepository.js — Tenant-isolated PostgreSQL & in-memory data access for Service Cases / Tickets.
 */
import { query as defaultDbQuery } from '../../db.js';
import { getCurrentTenantId, DEFAULT_TENANT_ID } from '../../core/server/tenancy/tenantContext.js';

const mapRowToCase = (row) => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  customerTier: row.customer_tier || 'MEMBER',
  title: row.title,
  description: row.description || '',
  category: row.category || 'Inquiry',
  systemName: row.system_name || '',
  priority: row.priority || 'Normal',
  channel: row.channel || 'LINE',
  status: row.status || 'Open',
  assignee: row.assignee || 'Unassigned',
  conversationId: row.conversation_id || undefined,
  externalTicketId: row.external_ticket_id || undefined,
  externalSystem: row.external_system || undefined,
  externalUrl: row.external_url || undefined,
  slaHoursLeft: Number(row.sla_hours_left ?? 4),
  slaFormatted: row.sla_formatted || '4 ชม.',
  slaStatus: row.sla_status || 'normal',
  slaTargetNote: row.sla_target_note || undefined,
  orderRef: row.order_ref || undefined,
  orderAmount: row.order_amount != null ? Number(row.order_amount) : undefined,
  activityLogs: Array.isArray(row.activity_logs) ? row.activity_logs : [],
  createdAt: row.created_at_label || 'วันนี้',
});

export const createInMemoryCaseRepository = () => {
  const store = new Map(); // key: `${tenantId}::${upperId}`
  const makeKey = (tenantId, id) => `${tenantId || DEFAULT_TENANT_ID}::${String(id).toUpperCase()}`;

  return {
    async listAll(explicitTenantId, filters = {}) {
      const tid = explicitTenantId || getCurrentTenantId();
      const out = [];
      for (const [k, rec] of store.entries()) {
        if (!k.startsWith(`${tid}::`)) continue;
        if (filters.customerId && String(rec.customerId).toUpperCase() !== String(filters.customerId).toUpperCase()) continue;
        if (filters.status && rec.status !== filters.status) continue;
        if (filters.category && rec.category !== filters.category) continue;
        out.push(rec);
      }
      return out.reverse();
    },

    async findById(caseId, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      return store.get(makeKey(tid, caseId)) ?? null;
    },

    async upsert(record, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const normalized = {
        ...record,
        activityLogs: Array.isArray(record.activityLogs) ? record.activityLogs : [],
      };
      store.set(makeKey(tid, normalized.id), normalized);
      return normalized;
    },

    async appendLog(caseId, logEntry, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const existing = store.get(makeKey(tid, caseId));
      if (!existing) return null;
      const updated = {
        ...existing,
        activityLogs: [...(existing.activityLogs || []), logEntry],
      };
      store.set(makeKey(tid, caseId), updated);
      return updated;
    },
  };
};

export const createPgCaseRepository = ({ query = defaultDbQuery } = {}) => {
  const mem = createInMemoryCaseRepository();

  return {
    async listAll(explicitTenantId, filters = {}) {
      const tid = explicitTenantId || getCurrentTenantId();
      try {
        const clauses = ['tenant_id = $1'];
        const params = [tid];
        if (filters.customerId) {
          params.push(String(filters.customerId).toUpperCase());
          clauses.push(`UPPER(customer_id) = $${params.length}`);
        }
        if (filters.status) {
          params.push(filters.status);
          clauses.push(`status = $${params.length}`);
        }
        if (filters.category) {
          params.push(filters.category);
          clauses.push(`category = $${params.length}`);
        }
        const r = await query(
          `SELECT * FROM service_cases WHERE ${clauses.join(' AND ')} ORDER BY updated_at DESC, created_at DESC`,
          params
        );
        if (r?.rows) return r.rows.map(mapRowToCase);
      } catch { /* fallback to mem */ }
      return mem.listAll(tid, filters);
    },

    async findById(caseId, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      try {
        const r = await query(
          `SELECT * FROM service_cases WHERE tenant_id = $1 AND UPPER(id) = $2 LIMIT 1`,
          [tid, String(caseId).toUpperCase()]
        );
        if (r?.rows?.[0]) return mapRowToCase(r.rows[0]);
      } catch { /* fallback */ }
      return mem.findById(caseId, tid);
    },

    async upsert(record, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const saved = await mem.upsert(record, tid);
      try {
        await query(
          `INSERT INTO service_cases (
             tenant_id, id, customer_id, customer_name, customer_tier,
             title, description, category, system_name, priority,
             channel, status, assignee, conversation_id,
             external_ticket_id, external_system, external_url,
             sla_hours_left, sla_formatted, sla_status, sla_target_note,
             order_ref, order_amount, activity_logs, created_at_label, created_at, updated_at
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24::jsonb,$25,NOW(),NOW()
           )
           ON CONFLICT (tenant_id, id) DO UPDATE SET
             customer_name = EXCLUDED.customer_name,
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             category = EXCLUDED.category,
             system_name = EXCLUDED.system_name,
             priority = EXCLUDED.priority,
             status = EXCLUDED.status,
             assignee = EXCLUDED.assignee,
             external_ticket_id = EXCLUDED.external_ticket_id,
             external_system = EXCLUDED.external_system,
             external_url = EXCLUDED.external_url,
             sla_hours_left = EXCLUDED.sla_hours_left,
             sla_formatted = EXCLUDED.sla_formatted,
             sla_status = EXCLUDED.sla_status,
             sla_target_note = EXCLUDED.sla_target_note,
             activity_logs = EXCLUDED.activity_logs,
             updated_at = NOW()`,
          [
            tid, saved.id, saved.customerId, saved.customerName, saved.customerTier || 'MEMBER',
            saved.title, saved.description || '', saved.category || 'Inquiry', saved.systemName || '',
            saved.priority || 'Normal', saved.channel || 'LINE', saved.status || 'Open',
            saved.assignee || 'Unassigned', saved.conversationId || null,
            saved.externalTicketId || null, saved.externalSystem || null, saved.externalUrl || null,
            saved.slaHoursLeft ?? 4, saved.slaFormatted || '4 ชม.', saved.slaStatus || 'normal',
            saved.slaTargetNote || null, saved.orderRef || null, saved.orderAmount ?? null,
            JSON.stringify(saved.activityLogs || []), saved.createdAt || 'วันนี้',
          ]
        );
      } catch { /* retained in mem when DB unavailable */ }
      return saved;
    },

    async appendLog(caseId, logEntry, explicitTenantId) {
      const tid = explicitTenantId || getCurrentTenantId();
      const existing = await this.findById(caseId, tid);
      if (!existing) return null;
      const updated = {
        ...existing,
        activityLogs: [...(existing.activityLogs || []), logEntry],
      };
      return this.upsert(updated, tid);
    },
  };
};

export const caseRepository = createPgCaseRepository();
