import { z } from 'zod';
import type { CallDirection, CtiScreenPopQuery } from '../../types';
import { formatThaiPhoneDisplay, normalizeThaiPhone } from './phoneMatcher';

const DEFAULT_FALLBACK_PATH = '/customers/C00123';

const isUnresolvedPlaceholder = (val: string | undefined): boolean => {
  if (!val) return true;
  const trimmed = val.trim();
  return (
    trimmed.length === 0 ||
    trimmed.includes('%') ||
    trimmed.includes('\uFFFD') ||
    /^\{[^}]+\}$/.test(trimmed)
  );
};

const rawQuerySchema = z.object({
  number: z.string().max(64).optional(),
  ext: z.string().max(32).optional(),
  callId: z.string().max(128).optional(),
  direction: z.enum(['inbound', 'outbound']).catch('inbound'),
});

const pickParam = (params: URLSearchParams, keys: string[]): string | undefined => {
  for (const key of keys) {
    const val = params.get(key);
    if (val !== null && val.trim() !== '') {
      return val.trim();
    }
  }
  return undefined;
};

/**
 * Validates and normalizes incoming 3CX / Telephony URL query parameters at the route boundary.
 */
export const parseScreenPopQuery = (searchParams: URLSearchParams): CtiScreenPopQuery => {
  const rawInput = {
    number: pickParam(searchParams, ['number', 'phone', 'caller', 'ani']),
    ext: pickParam(searchParams, ['ext', 'agent', 'extension']),
    callId: pickParam(searchParams, ['callId', 'callid', 'call_id']),
    direction: pickParam(searchParams, ['direction', 'dir'])?.toLowerCase(),
  };

  const parsed = rawQuerySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      rawNumber: '',
      normalizedNumber: '',
      displayNumber: '',
      direction: 'inbound',
    };
  }

  const cleanRawNumber = isUnresolvedPlaceholder(parsed.data.number)
    ? ''
    : (parsed.data.number ?? '');
  const normalizedNumber = normalizeThaiPhone(cleanRawNumber);
  const displayNumber = normalizedNumber
    ? formatThaiPhoneDisplay(normalizedNumber)
    : cleanRawNumber;

  const cleanExt = isUnresolvedPlaceholder(parsed.data.ext) ? undefined : parsed.data.ext;
  const cleanCallId = isUnresolvedPlaceholder(parsed.data.callId) ? undefined : parsed.data.callId;
  const direction: CallDirection = parsed.data.direction;

  return {
    rawNumber: cleanRawNumber,
    normalizedNumber,
    displayNumber,
    ext: cleanExt,
    callId: cleanCallId,
    direction,
  };
};

/**
 * Ensures post-login redirect targets are strictly internal paths to prevent Open Redirect attacks.
 */
export const sanitizeReturnTo = (
  raw: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK_PATH
): string => {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.startsWith('/login')
  ) {
    return fallback;
  }
  return trimmed;
};
