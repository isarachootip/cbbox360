/**
 * caseController.js — Zod-validated tenant-scoped Service Case CRUD & Activity Log handlers.
 */
import crypto from 'crypto';
import { caseRepository as defaultCaseRepo } from '../repositories/caseRepository.js';
import { getCurrentTenantId } from '../../core/server/tenancy/tenantContext.js';
import {
  addLogSchema,
  createCaseSchema,
  defaultSlaByPriority,
  patchCaseSchema,
} from '../utils/caseSchemas.js';

const formatNowTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const buildPatchSystemLogs = (existing, patch, actor) => {
  const logs = [];
  const time = formatNowTime();
  if (patch.status && patch.status !== existing.status) {
    logs.push({ time, author: actor, text: `เปลี่ยนสถานะเคสจาก ${existing.status} เป็น ${patch.status}`, type: 'system' });
  }
  if (patch.assignee && patch.assignee !== existing.assignee) {
    logs.push({ time, author: actor, text: `มอบหมายผู้รับผิดชอบจาก ${existing.assignee} เป็น ${patch.assignee}`, type: 'system' });
  }
  if (patch.resolutionSummary && patch.resolutionSummary !== existing.resolutionSummary) {
    logs.push({ time, author: actor, text: `บันทึกสรุปวิธีแก้ไข: ${patch.resolutionSummary}`, type: 'agent' });
  }
  if (patch.externalTicketId !== undefined && patch.externalTicketId !== existing.externalTicketId) {
    logs.push({
      time,
      author: actor,
      text: patch.externalTicketId ? `เชื่อมเลขอ้างอิง Helpdesk ภายนอก: ${patch.externalTicketId}` : 'ยกเลิกเลขอ้างอิง Helpdesk ภายนอก',
      type: 'system',
    });
  }
  return logs;
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
      const generatedId = input.id || `CS-${crypto.randomInt(1000, 9999)}`;

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
            text: `เปิดเคสใหม่ (${input.category}${input.systemName ? ` · ${input.systemName}` : ''} · ${input.serviceMode}): ${input.title}`,
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
      const addedLogs = buildPatchSystemLogs(existing, patch, actor);

      const updated = await caseRepo.upsert(
        {
          ...existing,
          ...patch,
          externalTicketId: patch.externalTicketId === null ? undefined : (patch.externalTicketId ?? existing.externalTicketId),
          externalSystem: patch.externalSystem === null ? undefined : (patch.externalSystem ?? existing.externalSystem),
          externalUrl: patch.externalUrl === null ? undefined : (patch.externalUrl ?? existing.externalUrl),
          activityLogs: [...(existing.activityLogs || []), ...addedLogs],
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
