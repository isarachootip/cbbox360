/**
 * lineWebhookDiagnostics.js — Lightweight in-memory tracker for live LINE Webhook health.
 * Exposes last received timestamp, verification status, and error details to /api/connectors/line.
 */

const createInitialState = () => ({
  lastReceivedAt: null,
  lastStatus: 'idle',
  lastEventType: null,
  lastError: null,
  receivedCount: 0,
  verifiedCount: 0,
  rejectedCount: 0,
});

let state = createInitialState();

export const recordWebhookDiagnostic = ({
  status,
  eventType = null,
  error = null,
  incrementReceived = false,
} = {}) => {
  state = {
    ...state,
    lastReceivedAt: new Date().toISOString(),
    lastStatus: status || state.lastStatus,
    lastEventType: eventType ?? state.lastEventType,
    lastError: error ? String(error) : null,
    receivedCount: state.receivedCount + (incrementReceived ? 1 : 0),
    verifiedCount: state.verifiedCount + (status === 'ok' ? 1 : 0),
    rejectedCount:
      state.rejectedCount +
      (status === 'missing_signature' || status === 'missing_secret' || status === 'invalid_signature'
        ? 1
        : 0),
  };
  return state;
};

export const getWebhookDiagnostics = () => ({ ...state });

export const _resetWebhookDiagnosticsForTesting = () => {
  state = createInitialState();
};
