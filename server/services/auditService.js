/**
 * auditService.js — server-side audit trail writer (ISO 27001 / PDPA).
 * Failures to write are logged but never break the request.
 */
import crypto from 'crypto';
import { query } from '../../db.js';

/**
 * @param {{ userId: string, userRole?: string, action: string, category: string,
 *           resource?: string, ip?: string, status?: 'success'|'warning'|'failure', details?: string }} entry
 */
export const writeAuditLog = async (entry) => {
  try {
    await query(
      `INSERT INTO audit_logs (id, timestamp, user_id, user_role, action, category, resource, ip_address, status, details)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        `audit-${crypto.randomUUID()}`,
        entry.userId,
        entry.userRole ?? null,
        entry.action,
        entry.category,
        entry.resource ?? null,
        entry.ip ?? null,
        entry.status ?? 'success',
        entry.details ?? null,
      ]
    );
  } catch (err) {
    console.error('[Audit Log Write Failed]:', err.message);
  }
};
