import { describe, it, expect, vi } from 'vitest';
import { createRateLimiter } from './rateLimit.js';

const mockRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() });

describe('createRateLimiter', () => {
  it('allows up to max requests per IP within the window, then returns 429', () => {
    let now = 0;
    const limiter = createRateLimiter({ windowMs: 1000, max: 2, now: () => now });
    const next = vi.fn();
    limiter({ ip: '1.1.1.1' }, mockRes(), next);
    limiter({ ip: '1.1.1.1' }, mockRes(), next);
    const blocked = mockRes();
    limiter({ ip: '1.1.1.1' }, blocked, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(blocked.status).toHaveBeenCalledWith(429);

    limiter({ ip: '2.2.2.2' }, mockRes(), next);
    expect(next).toHaveBeenCalledTimes(3);

    now = 1001;
    limiter({ ip: '1.1.1.1' }, mockRes(), next);
    expect(next).toHaveBeenCalledTimes(4);
  });
});
