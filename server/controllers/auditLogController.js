/**
 * auditLogController.js
 * Controller for ISO 27001 / ISO 29100 / PDPA Security Audit Logging
 */

import { query } from '../../db.js';

// In-memory fallback log cache for environments without PostgreSQL
let inMemoryLogs = [];

/**
 * GET /api/audit-logs
 * Retrieves security and access audit logs with optional filtering
 */
export const getAuditLogs = async (req, res) => {
  const { limit = 100, category, search } = req.query;
  const numLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);

  try {
    let sql = `SELECT * FROM audit_logs`;
    const params = [];
    const conditions = [];

    if (category && category !== 'all') {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(user_id) LIKE $${params.length} OR LOWER(action) LIKE $${params.length} OR LOWER(resource) LIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    sql += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
    params.push(numLimit);

    const result = await query(sql, params);
    if (result.rows && result.rows.length > 0) {
      const formatted = result.rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        userId: row.user_id,
        userRole: row.user_role,
        action: row.action,
        category: row.category,
        resource: row.resource,
        ipAddress: row.ip_address,
        status: row.status,
        details: row.details,
      }));
      return res.status(200).json({ success: true, count: formatted.length, logs: formatted });
    }
  } catch (err) {
    console.warn('[Audit Log Query Fallback]:', err.message);
  }

  // Fallback to in-memory logs
  let filtered = [...inMemoryLogs];
  if (category && category !== 'all') {
    filtered = filtered.filter((l) => l.category === category);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.userId.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.resource && l.resource.toLowerCase().includes(q))
    );
  }

  return res.status(200).json({
    success: true,
    count: filtered.length,
    logs: filtered.slice(0, numLimit),
  });
};

/**
 * POST /api/audit-logs
 * Records a new audit log entry
 */
export const recordAuditLog = async (req, res) => {
  const {
    userId,
    userRole,
    action,
    category = 'system',
    resource,
    ipAddress,
    status = 'success',
    details,
  } = req.body;

  if (!userId || !action) {
    return res.status(400).json({ error: 'userId and action are required fields' });
  }

  const id = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = new Date().toISOString();
  const clientIp = ipAddress || req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  const newLog = {
    id,
    timestamp,
    userId: String(userId),
    userRole: userRole ? String(userRole) : undefined,
    action: String(action),
    category,
    resource: resource ? String(resource) : undefined,
    ipAddress: String(clientIp),
    status,
    details: details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : undefined,
  };

  // 1. Try persisting to PostgreSQL
  try {
    await query(
      `INSERT INTO audit_logs (id, timestamp, user_id, user_role, action, category, resource, ip_address, status, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        newLog.id,
        newLog.timestamp,
        newLog.userId,
        newLog.userRole || null,
        newLog.action,
        newLog.category,
        newLog.resource || null,
        newLog.ipAddress,
        newLog.status,
        newLog.details || null,
      ]
    );
  } catch (err) {
    console.warn('[Audit Log Insert Fallback]:', err.message);
  }

  // 2. Always store in in-memory cache
  inMemoryLogs.unshift(newLog);
  if (inMemoryLogs.length > 500) {
    inMemoryLogs.pop();
  }

  return res.status(201).json({ success: true, log: newLog });
};
