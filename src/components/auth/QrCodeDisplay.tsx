import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  showCenterIcon?: boolean;
}

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
  value,
  size = 180,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!value) {
      setDataUrl('');
      return;
    }

    QRCode.toDataURL(value, {
      width: Math.max(size * 2, 360),
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0F2B4D',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setError(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR Code:', err);
        if (isMounted) setError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (error || !dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-gray-100 rounded-xl text-xs text-text-secondary ${className}`}
      >
        {error ? 'ไม่สามารถสร้าง QR Code ได้' : 'กำลังโหลด QR Code...'}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center p-2.5 bg-white rounded-2xl border border-border shadow-xs ${className}`}
    >
      <img
        src={dataUrl}
        alt="2FA QR Code"
        style={{ width: size, height: size }}
        className="rounded-lg object-contain select-none"
      />
    </div>
  );
};
