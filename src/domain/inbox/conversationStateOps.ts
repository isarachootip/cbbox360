import type { Conversation } from '../../types';

export const EMPTY_CONVERSATION: Conversation = {
  id: 'empty',
  customerId: 'EMPTY',
  customerName: 'ยังไม่มีการสนทนา',
  customerTier: 'MEMBER',
  channel: 'LINE',
  channelAccount: '-',
  time: '--:--',
  lastMessagePreview: '',
  unreadCount: 0,
  status: 'Open',
  assignedTo: '-',
  team: '-',
  tabGroup: 'All',
  messages: [],
};

export const formatCurrentChatTime = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

export const applyMessageDeliveryOutcome = (
  list: Conversation[],
  convId: string,
  messageId: string,
  ok: boolean,
  opts?: { serverId?: string; isPrivate?: boolean; error?: string }
): Conversation[] =>
  list.map((c) => {
    if (c.id !== convId) return c;
    return {
      ...c,
      isBotActive: opts?.isPrivate ? c.isBotActive : ok ? false : c.isBotActive,
      messages: c.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              id: opts?.serverId || m.id,
              deliveryStatus: ok ? 'delivered' : 'failed',
              failureReason: ok ? undefined : opts?.error || 'LINE Push delivery failed',
            }
          : m
      ),
    };
  });

export const appendOptimisticMessage = (
  list: Conversation[],
  convId: string,
  tempMsgId: string,
  text: string,
  timeStr: string,
  isPrivate: boolean
): Conversation[] =>
  list.map((c) =>
    c.id === convId
      ? {
          ...c,
          lastMessagePreview: isPrivate ? c.lastMessagePreview : text,
          time: timeStr,
          isBotActive: isPrivate ? c.isBotActive : false,
          messages: [
            ...c.messages,
            {
              id: tempMsgId,
              sender: isPrivate ? 'note' : 'agent',
              authorName: 'วิภา ส.',
              text,
              time: timeStr,
              isPrivateNote: isPrivate,
              deliveryStatus: 'delivered',
            },
          ],
        }
      : c
  );
