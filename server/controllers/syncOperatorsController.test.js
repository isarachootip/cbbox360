import { describe, it, expect, vi } from 'vitest';
import { createSyncOperatorsHandler } from './syncOperatorsController.js';

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

describe('syncOperatorsController', () => {
  it('provisions missing default agent accounts, returns refreshed users, and writes audit log', async () => {
    const ensureColumns = vi.fn(async () => true);
    const seedOperators = vi.fn(async () => [
      { username: 'tel_agent1', action: 'inserted' },
      { username: 'chat_agent1', action: 'inserted' },
    ]);
    const listUsers = vi.fn(async () => [
      { id: 'usr-tel-1', username: 'tel_agent1', role: 'SF_2' },
      { id: 'usr-chat-1', username: 'chat_agent1', role: 'SF_1' },
    ]);
    const audit = vi.fn(async () => {});

    const handler = createSyncOperatorsHandler({
      ensureColumns,
      seedOperators,
      listUsers,
      audit,
    });

    const req = { user: { username: 'tumtum', role: 'admin' }, ip: '127.0.0.1' };
    const res = createMockRes();

    await handler(req, res);

    expect(ensureColumns).toHaveBeenCalledOnce();
    expect(seedOperators).toHaveBeenCalledOnce();
    expect(listUsers).toHaveBeenCalledOnce();
    expect(audit).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      createdUsernames: ['tel_agent1', 'chat_agent1'],
      users: [
        { id: 'usr-tel-1', username: 'tel_agent1', role: 'SF_2' },
        { id: 'usr-chat-1', username: 'chat_agent1', role: 'SF_1' },
      ],
    });
  });

  it('returns empty createdUsernames cleanly when all operator accounts already exist', async () => {
    const handler = createSyncOperatorsHandler({
      ensureColumns: async () => true,
      seedOperators: async () => [],
      listUsers: async () => [{ id: 'usr-tumtum', username: 'tumtum', role: 'admin' }],
      audit: async () => {},
    });

    const req = { user: { username: 'sysadmin', role: 'sysadmin' }, ip: '127.0.0.1' };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.createdUsernames).toEqual([]);
  });

  it('fails closed with 503 USER_SERVICE_UNAVAILABLE when seeding throws unexpectedly', async () => {
    const handler = createSyncOperatorsHandler({
      ensureColumns: async () => true,
      seedOperators: async () => {
        throw new Error('DB down');
      },
      listUsers: async () => [],
      audit: async () => {},
    });

    const req = { user: { username: 'sysadmin', role: 'sysadmin' }, ip: '127.0.0.1' };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ success: false, error: 'USER_SERVICE_UNAVAILABLE' });
  });
});
