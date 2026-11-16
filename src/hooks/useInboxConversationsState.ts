import { useEffect, useState } from 'react';
import type { Conversation } from '../types';
import { mockConversations } from '../data/conversations';

const formatCurrentTime = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

export const useInboxConversationsState = () => {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);

  useEffect(() => {
    const fetchLiveConversations = async () => {
      try {
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const json: { data?: Conversation[] } = await res.json();
          if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
            setConversations(json.data);
          }
        }
      } catch {
        // Fallback to local mock data when offline
      }
    };

    void fetchLiveConversations();
    const interval = setInterval(fetchLiveConversations, 2500);
    return () => clearInterval(interval);
  }, []);

  const updateConversationStatus = (convId: string, status: Conversation['status']) => {
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, status } : c)));
  };

  const markMessageOutcome = (
    convId: string,
    messageId: string,
    ok: boolean,
    opts?: { serverId?: string; isPrivate?: boolean; error?: string }
  ) => {
    setConversations((prev) =>
      prev.map((c) => {
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
      })
    );
  };

  const addMessageToConversation = async (
    convId: string,
    text: string,
    isPrivate: boolean = false
  ): Promise<{ success: boolean; lineDelivery?: { success: boolean; error?: string } }> => {
    const timeStr = formatCurrentTime();
    const tempMsgId = `m-${Date.now()}`;

    setConversations((prev) =>
      prev.map((c) =>
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
      )
    );

    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, isPrivate, authorName: 'วิภา ส.' }),
      });

      if (res.ok) {
        const json: {
          message?: { id?: string };
          lineDelivery?: { success: boolean; error?: string };
        } = await res.json();
        const lineSuccess = json?.lineDelivery?.success !== false;
        markMessageOutcome(convId, tempMsgId, lineSuccess, {
          serverId: json?.message?.id,
          isPrivate,
          error: json?.lineDelivery?.error,
        });
        return { success: true, lineDelivery: json?.lineDelivery };
      }

      const errJson: { error?: string } = await res.json().catch(() => ({}));
      const errMsg = errJson?.error || `HTTP ${res.status}`;
      markMessageOutcome(convId, tempMsgId, false, { isPrivate, error: errMsg });
      return { success: false, lineDelivery: { success: false, error: errMsg } };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ขัดข้อง';
      markMessageOutcome(convId, tempMsgId, false, { isPrivate, error: errMsg });
      return { success: false, lineDelivery: { success: false, error: errMsg } };
    }
  };

  const toggleBotStatus = async (convId: string, isBotActive: boolean) => {
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, isBotActive } : c)));
    try {
      await fetch(`/api/conversations/${convId}/bot-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBotActive }),
      });
    } catch (err) {
      console.error('Failed to toggle bot status on server', err);
    }
  };

  const updateConversationLineUserId = async (
    convId: string,
    lineUserId: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/conversations/${convId}/line-user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUserId: lineUserId.trim() }),
      });
      if (!res.ok) return false;
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, lineUserId: lineUserId.trim() } : c))
      );
      return true;
    } catch (err) {
      console.error('Failed to update line user id on server', err);
      return false;
    }
  };

  const retrySendMessage = async (convId: string, messageId: string, text: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, deliveryStatus: 'sending', failureReason: undefined }
                  : m
              ),
            }
          : c
      )
    );

    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, isPrivate: false, authorName: 'วิภา ส.' }),
      });
      if (res.ok) {
        const json: { lineDelivery?: { success: boolean; error?: string } } = await res.json();
        markMessageOutcome(convId, messageId, json?.lineDelivery?.success !== false, {
          error: json?.lineDelivery?.error,
        });
      } else {
        markMessageOutcome(convId, messageId, false, { error: `HTTP ${res.status}` });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'เชื่อมต่อล้มเหลว';
      markMessageOutcome(convId, messageId, false, { error: errorMsg });
    }
  };

  return {
    conversations,
    setConversations,
    updateConversationStatus,
    addMessageToConversation,
    toggleBotStatus,
    updateConversationLineUserId,
    retrySendMessage,
  };
};
