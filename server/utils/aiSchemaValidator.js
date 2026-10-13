/**
 * JSON Schema Validator for Gemini AI Responses
 * Validates suggest-reply and summary payloads against strict contracts.
 */

const VALID_INTENTS = [
  'order_status',
  'purchase',
  'claim',
  'complaint',
  'billing',
  'credit',
  'pdpa_request',
  'general',
];

const VALID_SENTIMENTS = ['positive', 'neutral', 'negative', 'angry'];
const VALID_URGENCIES = ['low', 'medium', 'high'];

const stripMarkdownFences = (raw) => {
  if (typeof raw !== 'string') return '';
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
};

export const parseAndValidateSuggestReply = (rawText) => {
  try {
    const clean = stripMarkdownFences(rawText);
    const parsed = JSON.parse(clean);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Root payload must be a JSON object' };
    }

    if (!Array.isArray(parsed.replies) || parsed.replies.length === 0 || parsed.replies.length > 4) {
      return { valid: false, error: 'replies must be a non-empty array (1-3 items)' };
    }

    for (const item of parsed.replies) {
      if (
        !item ||
        typeof item.label !== 'string' ||
        !item.label.trim() ||
        typeof item.text !== 'string' ||
        !item.text.trim()
      ) {
        return { valid: false, error: 'Each reply must contain non-empty label and text strings' };
      }
    }

    if (!Array.isArray(parsed.used_canned) || !parsed.used_canned.every((s) => typeof s === 'string')) {
      return { valid: false, error: 'used_canned must be an array of strings' };
    }

    if (!Array.isArray(parsed.missing_info) || !parsed.missing_info.every((s) => typeof s === 'string')) {
      return { valid: false, error: 'missing_info must be an array of strings' };
    }

    if (typeof parsed.needs_human_check !== 'boolean') {
      return { valid: false, error: 'needs_human_check must be a boolean' };
    }

    if (typeof parsed.escalate !== 'boolean') {
      return { valid: false, error: 'escalate must be a boolean' };
    }

    return {
      valid: true,
      data: {
        replies: parsed.replies.slice(0, 3).map((r) => ({
          label: r.label.trim(),
          text: r.text.trim(),
        })),
        used_canned: parsed.used_canned,
        missing_info: parsed.missing_info,
        needs_human_check: parsed.needs_human_check,
        escalate: parsed.escalate,
      },
    };
  } catch (err) {
    return { valid: false, error: `JSON Parse Error: ${err.message}` };
  }
};

export const parseAndValidateSummary = (rawText) => {
  try {
    const clean = stripMarkdownFences(rawText);
    const parsed = JSON.parse(clean);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Root payload must be a JSON object' };
    }

    if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
      return { valid: false, error: 'summary must be a non-empty string' };
    }

    if (!VALID_INTENTS.includes(parsed.intent)) {
      return { valid: false, error: `intent must be one of: ${VALID_INTENTS.join(', ')}` };
    }

    if (!VALID_SENTIMENTS.includes(parsed.sentiment)) {
      return { valid: false, error: `sentiment must be one of: ${VALID_SENTIMENTS.join(', ')}` };
    }

    if (!VALID_URGENCIES.includes(parsed.urgency)) {
      return { valid: false, error: `urgency must be one of: ${VALID_URGENCIES.join(', ')}` };
    }

    if (!Array.isArray(parsed.done) || !parsed.done.every((s) => typeof s === 'string')) {
      return { valid: false, error: 'done must be an array of strings' };
    }

    if (!Array.isArray(parsed.pending) || !parsed.pending.every((s) => typeof s === 'string')) {
      return { valid: false, error: 'pending must be an array of strings' };
    }

    if (typeof parsed.next_step !== 'string') {
      return { valid: false, error: 'next_step must be a string' };
    }

    if (
      !parsed.suggest_ticket ||
      typeof parsed.suggest_ticket.create !== 'boolean' ||
      typeof parsed.suggest_ticket.type !== 'string' ||
      typeof parsed.suggest_ticket.title !== 'string'
    ) {
      return { valid: false, error: 'suggest_ticket must have create (boolean), type (string), title (string)' };
    }

    if (
      !parsed.suggest_lead ||
      typeof parsed.suggest_lead.create !== 'boolean' ||
      typeof parsed.suggest_lead.title !== 'string' ||
      (parsed.suggest_lead.est_value !== null && typeof parsed.suggest_lead.est_value !== 'number')
    ) {
      return { valid: false, error: 'suggest_lead must have create (boolean), title (string), est_value (number|null)' };
    }

    if (
      !Array.isArray(parsed.labels) ||
      parsed.labels.length > 3 ||
      !parsed.labels.every((s) => typeof s === 'string')
    ) {
      return { valid: false, error: 'labels must be an array of up to 3 strings' };
    }

    return {
      valid: true,
      data: {
        summary: parsed.summary.trim(),
        intent: parsed.intent,
        sentiment: parsed.sentiment,
        urgency: parsed.urgency,
        done: parsed.done,
        pending: parsed.pending,
        next_step: parsed.next_step.trim(),
        suggest_ticket: {
          create: parsed.suggest_ticket.create,
          type: parsed.suggest_ticket.type,
          title: parsed.suggest_ticket.title,
        },
        suggest_lead: {
          create: parsed.suggest_lead.create,
          title: parsed.suggest_lead.title,
          est_value: parsed.suggest_lead.est_value,
        },
        labels: parsed.labels,
      },
    };
  } catch (err) {
    return { valid: false, error: `JSON Parse Error: ${err.message}` };
  }
};
