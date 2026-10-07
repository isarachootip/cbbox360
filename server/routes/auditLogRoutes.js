import { Router } from 'express';
import { getAuditLogs, recordAuditLog } from '../controllers/auditLogController.js';

const router = Router();

// GET /api/audit-logs
router.get('/', getAuditLogs);

// POST /api/audit-logs
router.post('/', recordAuditLog);

export default router;
