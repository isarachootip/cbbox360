import React from 'react';
import { Type } from 'lucide-react';
import { FontScaleSelector } from '../common/FontScaleSelector';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FontScale } from '../../domain/layout/typographyPreferences';

const SCALE_LABELS: Record<FontScale, string> = {
  standard: 'มาตรฐาน (100%)',
  comfortable: 'สบายตา (105%)',
  large: 'ใหญ่พิเศษ (112%)',
};

export const TypographySettingsCard: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const handleScaleChanged = (scale: FontScale) => {
    showToast(`เปลี่ยนขนาดตัวอักษรเป็นโหมด "${SCALE_LABELS[scale]}" แล้ว`, 'info');
  };

  return (
    <div className="bg-white rounded-card border border-border p-5 shadow-card space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-tint text-brand flex items-center justify-center shrink-0">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm font-semibold text-text-primary">
                ความสบายตาและขนาดตัวอักษร (Display & Typography)
              </h3>
              <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>IBM Plex Sans Thai · Tabular Figures</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              ปรับขนาดตัวอักษรให้เหมาะกับสายตาและระยะห่างหน้าจอ ระบบจะจดจำค่าแยกตามบัญชีผู้ใช้งาน (
              <span className="font-mono font-medium text-text-primary">
                {currentUser?.username || 'guest'}
              </span>
              ) อัตโนมัติ
            </p>
          </div>
        </div>

        <div className="w-full lg:w-[360px] shrink-0">
          <FontScaleSelector onChangeScale={handleScaleChanged} />
        </div>
      </div>

      {/* Live Preview Strip */}
      <div className="rounded-xl bg-bg-subtle border border-border/80 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="text-2xs text-text-muted font-medium">ตัวอย่างการแสดงผลจริง (Live Preview)</div>
          <p className="text-base text-text-primary">
            ผู้สั่งซื้อสินค้าองค์กรสอบถามรอบจัดส่งพื้นที่กรุงเทพฯ และใบกำกับภาษีเต็มรูปแบบ
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-divider">
          <div>
            <span className="block text-2xs text-text-muted">รหัสอ้างอิง (Mono)</span>
            <span className="font-mono font-medium text-xs text-brand">TK-2310 · C00123</span>
          </div>
          <div className="text-right">
            <span className="block text-2xs text-text-muted">ยอดซื้อสะสม (Tabular)</span>
            <span className="font-semibold tabular-nums text-sm text-text-primary">฿1,284,500</span>
          </div>
        </div>
      </div>
    </div>
  );
};
