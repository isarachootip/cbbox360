import { Router } from 'express';
import { getAuditLogs, recordAuditLog } from '../controllers/auditLogController.js';
import { requireRole } from '../services/authContainer.js';

const router = Router();

// GET /api/audit-logs
router.get('/', requireRole('sysadmin', 'admin', 'supervisor'), getAuditLogs);

// POST /api/audit-logs
router.post('/', recordAuditLog);

export default router;
