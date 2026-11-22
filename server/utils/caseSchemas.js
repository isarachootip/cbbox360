/**
 * caseSchemas.js — Zod validation schemas & SLA defaults for tenant-scoped Service Cases.
 */
import { z } from 'zod';

export const CASE_STATUSES = ['Open', 'In Progress', 'Pending', 'Waiting', 'Resolved', 'Closed'];
export const CASE_PRIORITIES = ['Critical', 'High', 'Normal', 'Low'];
export const SERVICE_MODES = ['Remote', 'On-site', 'In-Center'];

export const createCaseSchema = z.object({
  id: z.string().trim().min(2).max(40).optional(),
  customerId: z.string().trim().min(1).max(60),
  customerName: z.string().trim().min(1).max(160),
  customerTier: z.enum(['MEMBER', 'SILVER', 'GOLD', 'PLATINUM']).default('MEMBER'),
  title: z.string().trim().min(2).max(240),
  description: z.string().trim().max(2000).optional().default(''),
  category: z.string().trim().min(1).max(120).default('Inquiry'),
  systemName: z.string().trim().max(120).optional().default(''),
  serviceMode: z.enum(SERVICE_MODES).optional().default('Remote'),
  assetSerial: z.string().trim().max(120).optional().default(''),
  siteLocation: z.string().trim().max(200).optional().default(''),
  reporterName: z.string().trim().max(120).optional().default(''),
  reporterPhone: z.string().trim().max(60).optional().default(''),
  rootCause: z.string().trim().max(2000).optional().default(''),
  resolutionSummary: z.string().trim().max(2000).optional().default(''),
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

export const patchCaseSchema = z.object({
  title: z.string().trim().min(2).max(240).optional(),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  systemName: z.string().trim().max(120).optional(),
  serviceMode: z.enum(SERVICE_MODES).optional(),
  assetSerial: z.string().trim().max(120).optional(),
  siteLocation: z.string().trim().max(200).optional(),
  reporterName: z.string().trim().max(120).optional(),
  reporterPhone: z.string().trim().max(60).optional(),
  rootCause: z.string().trim().max(2000).optional(),
  resolutionSummary: z.string().trim().max(2000).optional(),
  priority: z.enum(CASE_PRIORITIES).optional(),
  status: z.enum(CASE_STATUSES).optional(),
  assignee: z.string().trim().min(1).max(120).optional(),
  externalTicketId: z.string().trim().max(80).nullable().optional(),
  externalSystem: z.string().trim().max(60).nullable().optional(),
  externalUrl: z.string().trim().max(300).nullable().optional(),
  slaStatus: z.enum(['normal', 'warning', 'danger']).optional(),
});

export const addLogSchema = z.object({
  text: z.string().trim().min(1).max(1500),
  author: z.string().trim().max(120).optional(),
  type: z.enum(['system', 'workflow', 'agent']).optional().default('agent'),
});

export const defaultSlaByPriority = (priority) => {
  if (priority === 'Critical') {
    return { slaHoursLeft: 2, slaFormatted: '2 ชม.', slaStatus: 'warning', slaTargetNote: 'Critical: ตอบใน 15 นาที · แก้ไขใน 2 ชม.' };
  }
  if (priority === 'High') {
    return { slaHoursLeft: 4, slaFormatted: '4 ชม.', slaStatus: 'normal', slaTargetNote: 'High: ตอบใน 30 นาที · แก้ไขใน 4 ชม.' };
  }
  return { slaHoursLeft: 8, slaFormatted: '8 ชม.', slaStatus: 'normal', slaTargetNote: 'Standard: ตอบใน 1 ชม. · แก้ไขใน 1 วันทำการ' };
};
