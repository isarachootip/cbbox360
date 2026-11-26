import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runWithTenantContext } from '../../core/server/tenancy/tenantContext.js';
import {
  getWebhookDiagnostics,
  _resetWebhookDiagnosticsForTesting,
} from '../services/lineWebhookDiagnostics.js';

const dbQueryMock = vi.fn();
vi.mock('../../db.js', () => ({ query: (...args) => dbQueryMock(...args) }));
vi.mock('../services/lineService.js', () => ({
  fetchLineProfile: vi.fn().mockResolvedValue({ displayName: 'คุณออย', pictureUrl: null }),
  sendLineReply: vi.fn().mockResolvedValue(true),
  sendLinePush: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock('../services/botEngineService.js', () => ({
  matchBotReply: vi.fn().mockResolvedValue({ replyText: 'ตอบกลับอัตโนมัติสำเร็จ', type: 'ai', isAi: true }),
}));

const { handleLineWebhook } = await import('./webhookController.js');

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};

describe('webhookController — Tenant-Scoped LINE Incoming & Bot Reply', () => {
  beforeEach(() => {
    dbQueryMock.mockReset();
    _resetWebhookDiagnosticsForTesting();
  });

  it('records ok diagnostic on empty LINE Verify ping (events: [])', async () => {
    const res = makeRes();
    await runWithTenantContext({ tenantId: 'default' }, () =>
      handleLineWebhook({ params: { channelId: '2011580063' }, body: { events: [] } }, res)
    );
    expect(res.statusCode).toBe(200);
    expect(getWebhookDiagnostics()).toMatchObject({
      lastStatus: 'ok',
      lastEventType: 'verify',
      receivedCount: 1,
    });
  });

  it('passes tenant_id on EVERY query including bot reply insert and conversation update', async () => {
    dbQueryMock
      .mockResolvedValueOnce({ rows: [] }) // SELECT existing conv
      .mockResolvedValueOnce({ rows: [] }) // INSERT conv
      .mockResolvedValueOnce({ rows: [] }) // INSERT customer msg
      .mockResolvedValueOnce({ rows: [{ sender: 'customer', text: 'สวัสดี' }] }) // SELECT recent msgs
      .mockResolvedValueOnce({ rows: [] }) // INSERT bot reply msg
      .mockResolvedValueOnce({ rows: [] }); // UPDATE conv preview

    const res = makeRes();
    await runWithTenantContext({ tenantId: 'tnt_support_fix' }, () =>
      handleLineWebhook(
        {
          params: { channelId: '2011580063' },
          body: {
            events: [
              {
                type: 'message',
                replyToken: 'tok-123',
                source: { userId: 'U99887766' },
                message: { type: 'text', text: 'สวัสดีครับ' },
              },
            ],
          },
        },
        res
      )
    );

    expect(res.statusCode).toBe(200);
    // Every single SQL call must include tenant_id and pass 'tnt_support_fix'
    expect(dbQueryMock).toHaveBeenCalledTimes(6);
    for (const [sql, params] of dbQueryMock.mock.calls) {
      expect(sql).toMatch(/tenant_id/i);
      expect(params).toContain('tnt_support_fix');
    }
    expect(getWebhookDiagnostics()).toMatchObject({
      lastStatus: 'ok',
      lastEventType: 'message:ai',
      receivedCount: 1,
    });
  });
});
