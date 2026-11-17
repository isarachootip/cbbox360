import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Customer } from '../../types';
import { useTelephony } from '../../context/TelephonyContext';
import { normalizeThaiPhone, formatThaiPhoneDisplay } from '../../domain/telephony/phoneMatcher';

interface ActiveCallBannerProps {
  customer: Customer;
  className?: string;
}

/**
 * Hydrates inbound 3CX Screen-Pop query parameters (?callNumber=...) into TelephonyContext
 * when deep-linking directly to /customers/:id. Visual display is handled globally by GlobalActiveCallBar.
 */
export const ActiveCallBanner: React.FC<ActiveCallBannerProps> = ({ customer }) => {
  const [searchParams] = useSearchParams();
  const { activeCall, registerScreenPopCall } = useTelephony();

  const urlCallNumber = searchParams.get('callNumber');
  const urlExt = searchParams.get('ext') || undefined;
  const urlCallId = searchParams.get('callId') || undefined;

  useEffect(() => {
    if (!urlCallNumber || activeCall?.customerId === customer.id) return;
    const normalized = normalizeThaiPhone(urlCallNumber);
    if (!normalized) return;

    registerScreenPopCall(
      {
        rawNumber: urlCallNumber,
        normalizedNumber: normalized,
        displayNumber: formatThaiPhoneDisplay(normalized),
        ext: urlExt,
        callId: urlCallId,
        direction: 'inbound',
      },
      {
        customer,
        matchedField: 'primary',
        matchedLabel: customer.name,
        matchedRawPhone: urlCallNumber,
        normalizedPhone: normalized,
      }
    );
  }, [urlCallNumber, urlExt, urlCallId, activeCall?.customerId, customer, registerScreenPopCall]);

  return null;
};
