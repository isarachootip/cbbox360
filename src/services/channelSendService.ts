/**
 * channelSendService.ts
 * Dispatches outbound messages through the correct channel (LINE, Facebook, Instagram).
 * Each channel uses its own API and token.
 */

export type SupportedChannel = 'LINE' | 'Facebook' | 'Instagram';

export interface ChannelSendPayload {
  channel: SupportedChannel;
  recipientId: string;   // LINE userId / FB PSID / IG userId
  text: string;
  accessToken: string;   // Channel-specific access token
}

export interface ChannelSendResult {
  success: boolean;
  channel: SupportedChannel;
  error?: string;
}

/** Send a message via LINE Messaging API (Push Message). */
async function sendViaLine(recipientId: string, text: string, token: string): Promise<ChannelSendResult> {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: recipientId,
        messages: [{ type: 'text', text }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, channel: 'LINE', error: `LINE Error ${res.status}: ${err.slice(0, 150)}` };
    }
    return { success: true, channel: 'LINE' };
  } catch (e) {
    return { success: false, channel: 'LINE', error: e instanceof Error ? e.message : 'Unknown' };
  }
}

/** Send a message via Facebook Messenger Send API. */
async function sendViaFacebook(recipientId: string, text: string, token: string): Promise<ChannelSendResult> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return { success: false, channel: 'Facebook', error: `FB Error ${res.status}: ${err.slice(0, 150)}` };
    }
    return { success: true, channel: 'Facebook' };
  } catch (e) {
    return { success: false, channel: 'Facebook', error: e instanceof Error ? e.message : 'Unknown' };
  }
}

/** Send a message via Instagram Messenger API (same as Facebook Graph). */
async function sendViaInstagram(recipientId: string, text: string, token: string): Promise<ChannelSendResult> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return { success: false, channel: 'Instagram', error: `IG Error ${res.status}: ${err.slice(0, 150)}` };
    }
    return { success: true, channel: 'Instagram' };
  } catch (e) {
    return { success: false, channel: 'Instagram', error: e instanceof Error ? e.message : 'Unknown' };
  }
}

/**
 * sendViaChannel — Public dispatch function.
 * Routes to the correct channel handler based on payload.channel.
 */
export async function sendViaChannel(payload: ChannelSendPayload): Promise<ChannelSendResult> {
  switch (payload.channel) {
    case 'LINE':
      return sendViaLine(payload.recipientId, payload.text, payload.accessToken);
    case 'Facebook':
      return sendViaFacebook(payload.recipientId, payload.text, payload.accessToken);
    case 'Instagram':
      return sendViaInstagram(payload.recipientId, payload.text, payload.accessToken);
    default:
      return { success: false, channel: payload.channel, error: `Channel '${payload.channel}' ยังไม่รองรับ` };
  }
}
