import { useEffect, useState } from 'react';
import type { Conversation } from '../types';
import { mockConversations } from '../data/conversations';
import { useTenantRuntime } from '../../core/client/providers/TenantRuntimeContext';
import {
  appendOptimisticMessage,
  applyMessageDeliveryOutcome,
  formatCurrentChatTime,
} from '../domain/inbox/conversationStateOps';

export const useInboxConversationsState = () => {
  const { tenantId, isLoaded } = useTenantRuntime();
  const isDefaultTenant = tenantId === 'default';
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);

  useEffect(() => {
    if (!isDefaultTenant) {
      setConversations([]);
    } else {
      setConversations(mockConversations);
    }

    const fetchLiveConversations = async () => {
      try {
        const res = await fetch('/api/conversations', { credentials: 'include' });
        if (res.ok) {
          const json: { data?: Conversation[] } = await res.json();
          if (Array.isArray(json?.data)) {
            if (isDefaultTenant && json.data.length === 0) {
              setConversations(mockConversations);
            } else {
              setConversations(json.data);
            }
          }
        }
      } catch {
        // Fallback to local mock data only on default tenant when offline
      }
    };

    void fetchLiveConversations();
    const interval = setInterval(fetchLiveConversations, 2500);
    return () => clearInterval(interval);
  }, [tenantId, isLoaded, isDefaultTenant]);

  const markMessageOutcome = (
    convId: string,
    messageId: string,
    ok: boolean,
    opts?: { serverId?: string; isPrivate?: boolean; error?: string }
  ) => {
    setConversations((prev) => applyMessageDeliveryOutcome(prev, convId, messageId, ok, opts));
  };

  const addMessageToConversation = async (
    convId: string,
    text: string,
    isPrivate: boolean = false
  ): Promise<{ success: boolean; lineDelivery?: { success: boolean; error?: string } }> => {
    const timeStr = formatCurrentChatTime();
    const tempMsgId = `m-${Date.now()}`;
    setConversations((prev) => appendOptimisticMessage(prev, convId, tempMsgId, text, timeStr, isPrivate));

    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
                m.id === messageId ? { ...m, deliveryStatus: 'sending', failureReason: undefined } : m
              ),
            }
          : c
      )
    );
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        credentials: 'include',
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
      markMessageOutcome(convId, messageId, false, {
        error: err instanceof Error ? err.message : 'เชื่อมต่อล้มเหลว',
      });
    }
  };

  return {
    conversations,
    setConversations,
    updateConversationStatus: (convId: string, status: Conversation['status']) =>
      setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, status } : c))),
    addMessageToConversation,
    toggleBotStatus,
    updateConversationLineUserId,
    retrySendMessage,
  };
};
