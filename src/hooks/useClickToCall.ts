import { useCallback } from 'react';
import type { OutboundCallPayload } from '../types';
import { parsePbxConfig, resolveClickToCallTarget } from '../domain/telephony/clickToCall';
import { matchCustomersByPhone } from '../domain/telephony/phoneMatcher';
import { useBot } from '../context/BotContext';
import { useAuth } from '../context/AuthContext';
import { useTelephony } from '../context/TelephonyContext';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';

let activePbxWindowRef: Window | null = null;

export const focusOrReopenPbxWindow = (fallbackUrl: string, windowName: string): boolean => {
  try {
    if (activePbxWindowRef && !activePbxWindowRef.closed) {
      activePbxWindowRef.focus();
      return true;
    }
    const reopened = window.open(fallbackUrl, windowName);
    if (reopened) {
      activePbxWindowRef = reopened;
      reopened.focus();
      return true;
    }
  } catch {
    // Cross-origin window focus error is non-fatal
  }
  return false;
};

export const useClickToCall = () => {
  const { settings } = useBot();
  const { currentUser } = useAuth();
  const { registerOutboundCall } = useTelephony();
  const { customers } = useCustomer();
  const { showToast } = useToast();

  const pbxConfig = parsePbxConfig(settings.pbxConfig);

  const triggerClickToCall = useCallback(
    (payload: OutboundCallPayload): boolean => {
      const userExt = currentUser?.extension?.trim() || '';
      const resolved = resolveClickToCallTarget(payload, pbxConfig, userExt);

      if (!resolved.ok) {
        showToast(resolved.message, 'warning');
        return false;
      }

      // IMPORTANT: Do NOT pass 'noopener' as 3rd param so browser reuses named tab "pbx_360_phone"
      const openedWin = window.open(resolved.url, resolved.windowName);
      if (openedWin) {
        activePbxWindowRef = openedWin;
        try {
          openedWin.focus();
        } catch {
          // Cross-origin focus safe ignore
        }
      } else if (pbxConfig.fallbackTelUri) {
        window.location.href = resolved.telFallbackUri;
        showToast(
          `เบราว์เซอร์บล็อก Pop-up แท็บ WebPhone ระบบจึงสลับเปิดแอปโทรศัพท์ (${resolved.displayPhone}) แทน`,
          'info'
        );
      } else {
        showToast(
          'เบราว์เซอร์บล็อกการเปิดแท็บ WebPhone กรุณาอนุญาต Pop-ups สำหรับเว็บไซต์นี้',
          'error'
        );
        return false;
      }

      let customerId = payload.customerId;
      let customerName = payload.customerName;
      let matchedContactName = payload.matchedContactName;

      if (!customerId) {
        const matches = matchCustomersByPhone(customers, resolved.normalizedNumber);
        if (matches.length > 0) {
          customerId = matches[0].customer.id;
          customerName = matches[0].customer.name;
          matchedContactName = matchedContactName || matches[0].matchedLabel;
        }
      }

      registerOutboundCall({
        displayPhone: resolved.displayPhone,
        normalizedPhone: resolved.normalizedNumber,
        dialUrl: resolved.url,
        ext: userExt || undefined,
        customerId,
        customerName,
        matchedContactName,
      });

      showToast(`กำลังโทรออก ${resolved.displayPhone} ผ่าน PABX WebPhone`, 'success');
      return true;
    },
    [currentUser?.extension, customers, pbxConfig, registerOutboundCall, showToast]
  );

  return {
    pbxConfig,
    triggerClickToCall,
  };
};
