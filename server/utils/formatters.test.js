import { describe, it, expect } from 'vitest';
import { getThaiTime, rowToConversation, rowToMessage } from './formatters.js';

describe('Server Formatters Utility', () => {
  it('should format time as HH:mm', () => {
    const testDate = new Date(2026, 8, 30, 9, 5);
    expect(getThaiTime(testDate)).toBe('09:05');
  });

  it('should map DB row to conversation object', () => {
    const dbRow = {
      id: 'conv-1',
      customer_id: 'cust-101',
      customer_name: 'คุณสมศักดิ์',
      customer_avatar: 'https://avatar.png',
      customer_tier: 'GOLD',
      channel: 'LINE',
      channel_account: '@cb360',
      time: '10:30',
      last_message_preview: 'สวัสดีครับ',
      label: 'New Lead',
      unread_count: 2,
      status: 'open',
      assigned_to: 'agent-1',
      team: 'Support',
      tab_group: 'vip',
      line_user_id: 'U123456789',
    };

    const result = rowToConversation(dbRow, [{ id: 'm-1', text: 'Hi' }]);
    expect(result.id).toBe('conv-1');
    expect(result.customerId).toBe('cust-101');
    expect(result.customerName).toBe('คุณสมศักดิ์');
    expect(result.messages.length).toBe(1);
    expect(result.tabGroup).toBe('vip');
    expect(result.isBotActive).toBe(true);
  });

  it('should map DB row to message object with delivery status', () => {
    const row = {
      id: 'msg-1',
      sender: 'agent',
      author_name: 'Customer A',
      text: 'สอบถามราคาครับ',
      time: '10:00',
      tracking_number: 'TH123456',
      is_private_note: false,
      delivery_status: 'failed',
      failure_reason: 'LINE Quota exceeded',
    };

    const msg = rowToMessage(row);
    expect(msg.id).toBe('msg-1');
    expect(msg.trackingNumber).toBe('TH123456');
    expect(msg.isPrivateNote).toBe(false);
    expect(msg.deliveryStatus).toBe('failed');
    expect(msg.failureReason).toBe('LINE Quota exceeded');
  });
});
