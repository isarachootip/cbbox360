import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db.js
vi.mock('../../db.js', () => ({
  query: vi.fn(),
}));

// Mock lineService.js
vi.mock('../services/lineService.js', () => ({
  sendLinePush: vi.fn(),
}));

import { query } from '../../db.js';
import { sendLinePush } from '../services/lineService.js';
import { sendMessage, toggleBotStatus } from './conversationController.js';

describe('conversationController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleBotStatus', () => {
    it('should return 400 if isBotActive is not boolean', async () => {
      const req = { params: { id: 'conv-1' }, body: {} };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await toggleBotStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should update is_bot_active in database and return success', async () => {
      const req = { params: { id: 'conv-1' }, body: { isBotActive: false } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      query.mockResolvedValueOnce({
        rows: [{ id: 'conv-1', is_bot_active: false }],
      });

      await toggleBotStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          isBotActive: false,
        })
      );
    });
  });

  describe('sendMessage', () => {
    it('should auto-pause bot and record failed delivery if LINE push fails', async () => {
      const req = {
        params: { id: 'conv-1' },
        body: { text: 'Hello customer', isPrivate: false, authorName: 'วิภา ส.' },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      // Existing conversation with line_user_id
      query.mockResolvedValueOnce({
        rows: [{ id: 'conv-1', line_user_id: 'U123456789' }],
      });

      // Line push fails
      sendLinePush.mockResolvedValueOnce({
        success: false,
        status: 429,
        error: 'Monthly quota reached',
      });

      // Insert message
      query.mockResolvedValueOnce({ rows: [] });
      // Update conv
      query.mockResolvedValueOnce({ rows: [] });

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          isBotActive: false,
          message: expect.objectContaining({
            deliveryStatus: 'failed',
            failureReason: 'Monthly quota reached',
          }),
        })
      );
    });
  });
});
