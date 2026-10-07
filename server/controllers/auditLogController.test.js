import { describe, it, expect, vi } from 'vitest';
import { getAuditLogs, recordAuditLog } from './auditLogController.js';

describe('auditLogController - ISO 27001 / ISO 29100 Audit Logging', () => {
  describe('recordAuditLog', () => {
    it('returns 400 when userId is missing', async () => {
      const req = { body: { action: 'AUTH_LOGIN' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await recordAuditLog(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('userId and action') })
      );
    });

    it('returns 400 when action is missing', async () => {
      const req = { body: { userId: 'admin' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await recordAuditLog(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('successfully records an audit log and returns 201', async () => {
      const req = {
        body: {
          userId: 'sysadmin',
          userRole: 'sysadmin',
          action: 'AUTH_LOGIN_SUCCESS',
          category: 'security',
          resource: 'User/sysadmin',
          ipAddress: '192.168.1.100',
          status: 'success',
          details: { method: '2FA_TOTP' },
        },
        ip: '192.168.1.100',
        headers: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await recordAuditLog(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          log: expect.objectContaining({
            userId: 'sysadmin',
            action: 'AUTH_LOGIN_SUCCESS',
            category: 'security',
            status: 'success',
          }),
        })
      );
    });
  });

  describe('getAuditLogs', () => {
    it('retrieves recorded audit logs', async () => {
      const req = { query: { limit: 10 } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getAuditLogs(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          logs: expect.any(Array),
        })
      );
    });

    it('filters logs by search term', async () => {
      // Record a unique log first
      const uniqueAction = `EXPORT_CUSTOMER_DATA_${Date.now()}`;
      await recordAuditLog(
        {
          body: { userId: 'auditor_user', action: uniqueAction, category: 'data' },
          headers: {},
        },
        { status: vi.fn().mockReturnThis(), json: vi.fn() }
      );

      const req = { query: { search: 'auditor_user' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getAuditLogs(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0];
      expect(data.logs.some((l) => l.userId === 'auditor_user')).toBe(true);
    });
  });
});
