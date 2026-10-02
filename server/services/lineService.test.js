import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db.js
vi.mock('../../db.js', () => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
}));

import { sendLinePush, _resetCachedTokenForTesting } from './lineService.js';
import { env } from '../config/env.js';

describe('lineService - sendLinePush', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetCachedTokenForTesting();
    env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
  });

  it('should return error when userId is missing', async () => {
    const result = await sendLinePush(null, 'Hello');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/User ID/i);
  });

  it('should return error when LINE_CHANNEL_ACCESS_TOKEN is missing', async () => {
    env.LINE_CHANNEL_ACCESS_TOKEN = '';
    const result = await sendLinePush('U12345', 'Hello');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/TOKEN/i);
  });

  it('should return success: true when LINE API returns 200 OK', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    const result = await sendLinePush('U12345', 'Hello customer');
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
  });

  it('should parse error message and status code when LINE API returns 429 quota exceeded', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        message: 'You have reached your monthly push message limit',
      }),
    });

    const result = await sendLinePush('U12345', 'Hello customer');
    expect(result.success).toBe(false);
    expect(result.status).toBe(429);
    expect(result.error).toContain('monthly push message limit');
  });

  it('should handle network/fetch throw errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));

    const result = await sendLinePush('U12345', 'Hello customer');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network connection timeout');
  });
});
