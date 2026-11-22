/**
 * caseController.js — Zod-validated tenant-scoped Service Case CRUD & Activity Log handlers.
 */
import crypto from 'crypto';
import { z } from 'zod';
import { caseRepository as defaultCaseRepo } from '../repositories/caseRepository.js';
import { getCurrentTenantId } from '../../core/server/tenancy/tenantContext.js';

const CASE_STATUSES = ['Open', 'In Progress', 'Pending', 'Waiting', 'Resolved', 'Closed'];
const CASE_PRIORITIES = ['Critical', 'High', 'Normal', 'Low'];

const createCaseSchema = z.object({
  id: z.string().trim().min(2).max(40).optional(),
  customerId: z.string().trim().min(1).max(60),
  customerName: z.string().trim().min(1).max(160),
  customerTier: z.enum(['MEMBER', 'SILVER', 'GOLD', 'PLATINUM']).default('MEMBER'),
  title: z.string().trim().min(2).max(240),
  description: z.string().trim().max(2000).optional().default(''),
  category: z.string().trim().min(1).max(120).default('Inquiry'),
  systemName: z.string().trim().max(120).optional().default(''),
  priority: z.enum(CASE_PRIORITIES).optional().default('Normal'),
  channel: z.string().trim().min(1).max(40).default('LINE'),
  status: z.enum(CASE_STATUSES).optional().default('Open'),
  assignee: z.string().trim().max(120).optional(),
  conversationId: z.string().trim().max(80).optional(),
  externalTicketId: z.string().trim().max(80).optional(),
  externalSystem: z.string().trim().max(60).optional(),
  externalUrl: z.string().trim().max(300).optional(),
  slaHoursLeft: z.number().optional(),
  slaFormatted: z.string().trim().max(60).optional(),
  slaStatus: z.enum(['normal', 'warning', 'danger']).optional(),
  slaTargetNote: z.string().trim().max(240).optional(),
});

const patchCaseSchema = z.object({
  title: z.string().trim().min(2).max(240).optional(),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  systemName: z.string().trim().max(120).optional(),
  priority: z.enum(CASE_PRIORITIES).optional(),
  status: z.enum(CASE_STATUSES).optional(),
  assignee: z.string().trim().min(1).max(120).optional(),
  externalTicketId: z.string().trim().max(80).nullable().optional(),
  externalSystem: z.string().trim().max(60).nullable().optional(),
  externalUrl: z.string().trim().max(300).nullable().optional(),
  slaStatus: z.enum(['normal', 'warning', 'danger']).optional(),
});

const addLogSchema = z.object({
  text: z.string().trim().min(1).max(1500),
  author: z.string().trim().max(120).optional(),
  type: z.enum(['system', 'workflow', 'agent']).optional().default('agent'),
});

const formatNowTime = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const defaultSlaByPriority = (priority) => {
  if (priority === 'Critical') {
    return { slaHoursLeft: 2, slaFormatted: '2 ชม.', slaStatus: 'warning', slaTargetNote: 'Critical: ตอบใน 15 นาที · แก้ไขใน 2 ชม.' };
  }
  if (priority === 'High') {
    return { slaHoursLeft: 4, slaFormatted: '4 ชม.', slaStatus: 'normal', slaTargetNote: 'High: ตอบใน 30 นาที · แก้ไขใน 4 ชม.' };
  }
  return { slaHoursLeft: 8, slaFormatted: '8 ชม.', slaStatus: 'normal', slaTargetNote: 'Standard: ตอบใน 1 ชม. · แก้ไขใน 1 วันทำการ' };
};

export const createCaseController = ({ caseRepo = defaultCaseRepo } = {}) => ({
  async listCases(req, res) {
    try {
      const tenantId = getCurrentTenantId();
      const filters = {
        customerId: typeof req.query.customerId === 'string' ? req.query.customerId.trim() : undefined,
        status: typeof req.query.status === 'string' ? req.query.status.trim() : undefined,
        category: typeof req.query.category === 'string' ? req.query.category.trim() : undefined,
      };
      const cases = await caseRepo.listAll(tenantId, filters);
      return res.status(200).json({ cases });
    } catch {
      return res.status(500).json({ error: 'CASE_SERVICE_UNAVAILABLE' });
    }
  },

  async createCase(req, res) {
    const parsed = createCaseSchema.safeParse(req.body?.case ?? req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'INVALID_CASE_PAYLOAD', details: parsed.error.issues });
    }
    try {
      const tenantId = getCurrentTenantId();
      const input = parsed.data;
      const slaDefaults = defaultSlaByPriority(input.priority);
      const actor = req.user?.displayName || req.user?.username || 'ระบบ';
      const generatedId =
        input.id || `CS-${crypto.randomInt(1000, 9999)}`;

      const record = {
        ...slaDefaults,
        ...input,
        id: generatedId,
        assignee: input.assignee || actor,
        createdAt: `วันนี้ ${formatNowTime()}`,
        activityLogs: [
          {
            time: formatNowTime(),
            author: actor,
            text: `เปิดเคสใหม่ (${input.category}${input.systemName ? ` · ${input.systemName}` : ''}): ${input.title}`,
            type: 'system',
          },
        ],
      };

      const saved = await caseRepo.upsert(record, tenantId);
      return res.status(201).json({ case: saved });
    } catch {
      return res.status(500).json({ error: 'CASE_SERVICE_UNAVAILABLE' });
    }
  },

  async updateCase(req, res) {
    const caseId = String(req.params.id || '').trim();
    const parsed = patchCaseSchema.safeParse(req.body?.patch ?? req.body);
    if (!caseId || !parsed.success) {
      return res.status(400).json({ error: 'INVALID_CASE_PAYLOAD' });
    }
    try {
      const tenantId = getCurrentTenantId();
      const existing = await caseRepo.findById(caseId, tenantId);
      if (!existing) return res.status(404).json({ error: 'CASE_NOT_FOUND' });

      const patch = parsed.data;
      const actor = req.user?.displayName || req.user?.username || 'ระบบ';
      const nextLogs = [...(existing.activityLogs || [])];

      if (patch.status && patch.status !== existing.status) {
        nextLogs.push({
          time: formatNowTime(),
          author: actor,
          text: `เปลี่ยนสถานะเคสจาก ${existing.status} เป็น ${patch.status}`,
          type: 'system',
        });
      }
      if (patch.externalTicketId !== undefined && patch.externalTicketId !== existing.externalTicketId) {
        nextLogs.push({
          time: formatNowTime(),
          author: actor,
          text: patch.externalTicketId
            ? `เชื่อมเลขอ้างอิง Helpdesk ภายนอก: ${patch.externalTicketId}`
            : 'ยกเลิกเลขอ้างอิง Helpdesk ภายนอก',
          type: 'system',
        });
      }

      const updated = await caseRepo.upsert(
        {
          ...existing,
          ...patch,
          externalTicketId: patch.externalTicketId === null ? undefined : (patch.externalTicketId ?? existing.externalTicketId),
          externalSystem: patch.externalSystem === null ? undefined : (patch.externalSystem ?? existing.externalSystem),
          externalUrl: patch.externalUrl === null ? undefined : (patch.externalUrl ?? existing.externalUrl),
          activityLogs: nextLogs,
        },
        tenantId
      );
      return res.status(200).json({ case: updated });
    } catch {
      return res.status(500).json({ error: 'CASE_SERVICE_UNAVAILABLE' });
    }
  },

  async addCaseLog(req, res) {
    const caseId = String(req.params.id || '').trim();
    const parsed = addLogSchema.safeParse(req.body);
    if (!caseId || !parsed.success) {
      return res.status(400).json({ error: 'INVALID_LOG_PAYLOAD' });
    }
    try {
      const tenantId = getCurrentTenantId();
      const actor = parsed.data.author || req.user?.displayName || req.user?.username || 'เจ้าหน้าที่';
      const updated = await caseRepo.appendLog(
        caseId,
        { time: formatNowTime(), author: actor, text: parsed.data.text, type: parsed.data.type },
        tenantId
      );
      if (!updated) return res.status(404).json({ error: 'CASE_NOT_FOUND' });
      return res.status(200).json({ case: updated });
    } catch {
      return res.status(500).json({ error: 'CASE_SERVICE_UNAVAILABLE' });
    }
  },
});

export const caseController = createCaseController();
