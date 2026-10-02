import React, { useMemo } from 'react';
import { generateQrMatrix } from '../../utils/qr/qrMatrix';
import { Shield } from 'lucide-react';

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  showCenterIcon?: boolean;
}

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
  value,
  size = 200,
  className = '',
  showCenterIcon = true,
}) => {
  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(value);
    } catch (e) {
      console.error('Failed to generate QR Matrix:', e);
      return [];
    }
  }, [value]);

  if (matrix.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-gray-100 rounded-lg text-xs text-text-secondary ${className}`}
      >
        กำลังโหลด QR Code...
      </div>
    );
  }

  const moduleCount = matrix.length;
  const padding = 4; // Quiet zone
  const totalGridSize = moduleCount + padding * 2;
  const cellSize = 10;
  const viewBoxSize = totalGridSize * cellSize;

  return (
    <div
      className={`relative inline-flex items-center justify-center p-3 bg-white rounded-xl border border-border shadow-xs ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full"
        shapeRendering="crispEdges"
      >
        <rect width={viewBoxSize} height={viewBoxSize} fill="#FFFFFF" />
        {matrix.map((row, r) =>
          row.map((isDark, c) => {
            if (!isDark) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={(c + padding) * cellSize}
                y={(r + padding) * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0F2B4D"
              />
            );
          })
        )}
      </svg>

      {/* Center Shield Badge for authentic professional look */}
      {showCenterIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-lg bg-white border border-border shadow-sm flex items-center justify-center p-1">
            <div className="w-full h-full bg-brand-tint rounded flex items-center justify-center text-brand">
              <Shield className="w-4 h-4 fill-brand/20 stroke-brand" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
