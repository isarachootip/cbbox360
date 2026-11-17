import { z } from 'zod';
import type { OutboundCallPayload, PbxClickToCallConfig } from '../../types';
import { formatThaiPhoneDisplay, normalizeThaiPhone } from './phoneMatcher';

export const DEFAULT_PBX_PHONE_URL = 'https://pbx01.cb360.online:5001/phone/index.html';
export const DEFAULT_PBX_WINDOW_NAME = 'pbx_360_phone';

export const DEFAULT_PBX_CONFIG: PbxClickToCallConfig = {
  enabled: true,
  phoneUrl: DEFAULT_PBX_PHONE_URL,
  windowName: DEFAULT_PBX_WINDOW_NAME,
  outboundPrefix: '',
  requireExtension: false,
  fallbackTelUri: true,
};

export const pbxConfigSchema = z.object({
  enabled: z.boolean().default(true),
  phoneUrl: z.string().trim().default(DEFAULT_PBX_PHONE_URL),
  windowName: z.string().trim().min(1).default(DEFAULT_PBX_WINDOW_NAME),
  outboundPrefix: z.string().trim().max(10).default(''),
  requireExtension: z.boolean().default(false),
  fallbackTelUri: z.boolean().default(true),
});

export const parsePbxConfig = (raw?: Partial<PbxClickToCallConfig> | null): PbxClickToCallConfig => {
  const result = pbxConfigSchema.safeParse(raw ?? {});
  if (!result.success) {
    return { ...DEFAULT_PBX_CONFIG };
  }
  return {
    ...result.data,
    phoneUrl: result.data.phoneUrl || DEFAULT_PBX_PHONE_URL,
    windowName: result.data.windowName || DEFAULT_PBX_WINDOW_NAME,
  };
};

/**
 * Formats a raw Thai/international phone string into PBX-dialable digits,
 * applying the configured outbound trunk prefix only for external numbers (>= 7 digits).
 */
export const formatOutboundDialNumber = (rawPhone: string, outboundPrefix = ''): string => {
  const normalized = normalizeThaiPhone(rawPhone);
  if (!normalized) {
    return '';
  }
  const cleanPrefix = outboundPrefix.replace(/[^\d*#+]/g, '');
  if (!cleanPrefix || normalized.length < 7) {
    return normalized;
  }
  return `${cleanPrefix}${normalized}`;
};

/**
 * Builds the PABX WebPhone Click-to-Call URL:
 * e.g. https://pbx01.cb360.online:5001/phone/index.html?dial=0818925678
 */
export const buildPbxWebPhoneDialUrl = (phoneUrlConfig: string, dialNumber: string): string => {
  const trimmedUrl = phoneUrlConfig.trim();
  const cleanDial = dialNumber.trim();
  if (!trimmedUrl || !cleanDial) {
    return '';
  }

  const placeholderReplaced = trimmedUrl.replace(
    /(\{dial\}|\{number\}|<เบอร์>|%3C%E0%B9%80%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%3E)/gi,
    encodeURIComponent(cleanDial)
  );
  const usedPlaceholder = placeholderReplaced !== trimmedUrl;

  try {
    const parsed = new URL(placeholderReplaced);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    if (!usedPlaceholder) {
      if (parsed.pathname === '' || parsed.pathname === '/') {
        parsed.pathname = '/phone/index.html';
      }
      parsed.searchParams.set('dial', cleanDial);
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

export type ClickToCallValidationCode =
  | 'DISABLED'
  | 'EXTENSION_REQUIRED'
  | 'INVALID_PHONE'
  | 'INVALID_URL';

export type ClickToCallResolution =
  | {
      ok: true;
      url: string;
      dialNumber: string;
      normalizedNumber: string;
      displayPhone: string;
      windowName: string;
      telFallbackUri: string;
    }
  | {
      ok: false;
      code: ClickToCallValidationCode;
      message: string;
    };

export const resolveClickToCallTarget = (
  payload: OutboundCallPayload,
  rawConfig?: Partial<PbxClickToCallConfig> | null,
  userExtension?: string
): ClickToCallResolution => {
  const config = parsePbxConfig(rawConfig);

  if (!config.enabled) {
    return {
      ok: false,
      code: 'DISABLED',
      message: 'ฟีเจอร์ Click-to-Call ถูกปิดใช้งานอยู่ในหน้าตั้งค่าระบบ',
    };
  }

  if (config.requireExtension && !userExtension?.trim()) {
    return {
      ok: false,
      code: 'EXTENSION_REQUIRED',
      message: 'บัญชีของคุณยังไม่ได้ผูกเลขคู่สายภายใน (Extension) กรุณาตั้งค่าในเมนูผู้ใช้งาน',
    };
  }

  const candidatePhone =
    (payload.fullPhone && normalizeThaiPhone(payload.fullPhone) ? payload.fullPhone : '') ||
    payload.rawPhone;
  const normalizedNumber = normalizeThaiPhone(candidatePhone);
  const dialNumber = formatOutboundDialNumber(candidatePhone, config.outboundPrefix);

  if (!normalizedNumber || !dialNumber) {
    return {
      ok: false,
      code: 'INVALID_PHONE',
      message: 'ไม่สามารถโทรออกได้เนื่องจากหมายเลขโทรศัพท์ไม่สมบูรณ์หรือถูกปกปิด (Masked)',
    };
  }

  const url = buildPbxWebPhoneDialUrl(config.phoneUrl, dialNumber);
  if (!url) {
    return {
      ok: false,
      code: 'INVALID_URL',
      message: 'ค่า PABX Phone URL ไม่ถูกต้อง กรุณาตรวจสอบในเมนูตั้งค่าระบบ (Settings)',
    };
  }

  return {
    ok: true,
    url,
    dialNumber,
    normalizedNumber,
    displayPhone: formatThaiPhoneDisplay(normalizedNumber),
    windowName: config.windowName,
    telFallbackUri: `tel:${dialNumber}`,
  };
};
