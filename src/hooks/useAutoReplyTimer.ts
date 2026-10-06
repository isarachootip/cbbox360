/**
 * useAutoReplyTimer.ts
 * Per-conversation 30-second countdown hook.
 *
 * Rules:
 * - Timer starts when a NEW customer message arrives (lastCustomerMessageId changes)
 * - Timer RESETS if customer sends another message before timeout
 * - Timer CANCELS immediately when an agent replies (call cancelTimer())
 * - Timer does NOT run when isBotActive is false
 * - onTimeout fires once when countdown reaches zero
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoReplyTimerOptions {
  conversationId: string;
  lastCustomerMessageId: string | null;
  isBotActive: boolean;
  timeoutSeconds: number;
  onTimeout: () => void;
}

export function useAutoReplyTimer({
  conversationId,
  lastCustomerMessageId,
  isBotActive,
  timeoutSeconds,
  onTimeout,
}: UseAutoReplyTimerOptions): { cancelTimer: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConvRef = useRef<string>(conversationId);
  const activeMessageRef = useRef<string | null>(null);

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Track conversation switches — cancel previous timer
  useEffect(() => {
    if (activeConvRef.current !== conversationId) {
      cancelTimer();
      activeConvRef.current = conversationId;
      activeMessageRef.current = null;
    }
  }, [conversationId, cancelTimer]);

  useEffect(() => {
    // Only run when bot is active and there is a new unanswered customer message
    if (!isBotActive || !lastCustomerMessageId) {
      cancelTimer();
      return;
    }

    // Same message — timer already running, don't restart
    if (activeMessageRef.current === lastCustomerMessageId) {
      return;
    }

    // New customer message: reset and start fresh
    cancelTimer();
    activeMessageRef.current = lastCustomerMessageId;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onTimeout();
    }, timeoutSeconds * 1000);

    return () => {
      cancelTimer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCustomerMessageId, isBotActive, timeoutSeconds, conversationId]);

  return { cancelTimer };
}
