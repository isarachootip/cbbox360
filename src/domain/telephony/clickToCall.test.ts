import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PBX_CONFIG,
  buildPbxWebPhoneDialUrl,
  formatOutboundDialNumber,
  parsePbxConfig,
  resolveClickToCallTarget,
} from './clickToCall';

describe('clickToCall domain logic', () => {
  it('exposes PABX WebPhone defaults matching PABX dev team specification', () => {
    expect(DEFAULT_PBX_CONFIG.phoneUrl).toBe(
      'https://pbx01.cb360.online:5001/phone/index.html'
    );
    expect(DEFAULT_PBX_CONFIG.windowName).toBe('pbx_360_phone');
    expect(DEFAULT_PBX_CONFIG.enabled).toBe(true);
  });

  describe('formatOutboundDialNumber', () => {
    it('normalizes domestic and +66 phone numbers into clean dial digits', () => {
      expect(formatOutboundDialNumber('081-892-5678')).toBe('0818925678');
      expect(formatOutboundDialNumber('+66 81 892 5678')).toBe('0818925678');
      expect(formatOutboundDialNumber('0066-2-123-4567')).toBe('021234567');
    });

    it('prepends outbound trunk prefix for external numbers but leaves short extensions untouched', () => {
      expect(formatOutboundDialNumber('081-892-5678', '9')).toBe('90818925678');
      expect(formatOutboundDialNumber('102', '9')).toBe('102');
    });

    it('rejects masked or placeholder phone strings', () => {
      expect(formatOutboundDialNumber('081-xxx-5678')).toBe('');
      expect(formatOutboundDialNumber('%CallerNumber%')).toBe('');
      expect(formatOutboundDialNumber('')).toBe('');
    });
  });

  describe('buildPbxWebPhoneDialUrl', () => {
    it('appends ?dial=<number> to the standard PABX phone/index.html URL', () => {
      expect(
        buildPbxWebPhoneDialUrl(
          'https://pbx01.cb360.online:5001/phone/index.html',
          '0818925678'
        )
      ).toBe('https://pbx01.cb360.online:5001/phone/index.html?dial=0818925678');
    });

    it('auto-completes /phone/index.html when only bare PBX origin is provided', () => {
      expect(buildPbxWebPhoneDialUrl('https://pbx01.cb360.online:5001', '0818925678')).toBe(
        'https://pbx01.cb360.online:5001/phone/index.html?dial=0818925678'
      );
      expect(buildPbxWebPhoneDialUrl('https://pbx01.cb360.online:5001/', '0818925678')).toBe(
        'https://pbx01.cb360.online:5001/phone/index.html?dial=0818925678'
      );
    });

    it('replaces existing ?dial= query parameter without duplicating it', () => {
      expect(
        buildPbxWebPhoneDialUrl(
          'https://pbx01.cb360.online:5001/phone/index.html?dial=',
          '0818925678'
        )
      ).toBe('https://pbx01.cb360.online:5001/phone/index.html?dial=0818925678');
    });

    it('supports explicit {dial} or <เบอร์> placeholders', () => {
      expect(
        buildPbxWebPhoneDialUrl(
          'https://pbx01.cb360.online:5001/phone/index.html?dial=<เบอร์>',
          '0818925678'
        )
      ).toBe('https://pbx01.cb360.online:5001/phone/index.html?dial=0818925678');
    });

    it('rejects non-http(s) protocols or empty URLs', () => {
      expect(buildPbxWebPhoneDialUrl('javascript:alert(1)', '0818925678')).toBe('');
      expect(buildPbxWebPhoneDialUrl('', '0818925678')).toBe('');
    });
  });

  describe('resolveClickToCallTarget', () => {
    it('uses fullPhone when display rawPhone is masked and returns named window target', () => {
      const res = resolveClickToCallTarget(
        { rawPhone: '081-xxx-5678', fullPhone: '081-892-5678' },
        DEFAULT_PBX_CONFIG,
        '101'
      );
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.url).toBe(
          'https://pbx01.cb360.online:5001/phone/index.html?dial=0818925678'
        );
        expect(res.windowName).toBe('pbx_360_phone');
        expect(res.displayPhone).toBe('081-892-5678');
        expect(res.telFallbackUri).toBe('tel:0818925678');
      }
    });

    it('blocks call when requireExtension is true and user has no extension', () => {
      const res = resolveClickToCallTarget(
        { rawPhone: '081-892-5678' },
        { ...DEFAULT_PBX_CONFIG, requireExtension: true },
        ''
      );
      expect(res).toEqual({
        ok: false,
        code: 'EXTENSION_REQUIRED',
        message: 'บัญชีของคุณยังไม่ได้ผูกเลขคู่สายภายใน (Extension) กรุณาตั้งค่าในเมนูผู้ใช้งาน',
      });
    });

    it('blocks call when click-to-call is disabled in CRM settings', () => {
      const res = resolveClickToCallTarget(
        { rawPhone: '081-892-5678' },
        { ...DEFAULT_PBX_CONFIG, enabled: false },
        '101'
      );
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('DISABLED');
      }
    });

    it('sanitizes untrusted config inputs via Zod schema', () => {
      const parsed = parsePbxConfig({ phoneUrl: '  https://pbx01.cb360.online:5001  ' });
      expect(parsed.windowName).toBe('pbx_360_phone');
      expect(parsed.phoneUrl).toBe('https://pbx01.cb360.online:5001');
    });
  });
});
