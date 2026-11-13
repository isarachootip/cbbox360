import React, { useState } from 'react';
import { Copy, PhoneIncoming, Sparkles } from 'lucide-react';
import { buildScreenPopUrlTemplate } from '../../domain/telephony/phoneMatcher';

interface VoiceSimulatorCardProps {
  onCopyUrl: (url: string) => void;
  onTriggerScreenPop: (number: string, ext: string, callId: string) => void;
}

const PRESET_SCENARIOS = [
  {
    label: 'ลูกค้าทั่วไป (สมชาย C00123)',
    phone: '0818925678',
    ext: '101',
  },
  {
    label: 'ผู้ติดต่อองค์กร B2B (+66)',
    phone: '+66823451122',
    ext: '102',
  },
  {
    label: 'ช่างหน้างานคลังสินค้า (C00124)',
    phone: '089-771-4567',
    ext: '103',
  },
  {
    label: 'เบอร์ใหม่ยังไม่พบใน CDP',
    phone: '0899998888',
    ext: '101',
  },
];

export const VoiceSimulatorCard: React.FC<VoiceSimulatorCardProps> = ({
  onCopyUrl,
  onTriggerScreenPop,
}) => {
  const [phoneInput, setPhoneInput] = useState('0823451122');
  const [extInput, setExtInput] = useState('101');
  const [callIdInput, setCallIdInput] = useState('3cx-live-901');

  const templateUrl = buildScreenPopUrlTemplate(window.location.origin);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    onTriggerScreenPop(phoneInput.trim(), extInput.trim(), callIdInput.trim());
  };

  return (
    <div className="bg-white border border-border rounded-card p-5 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-text-primary">
            ลิงก์เชื่อมต่อ 3CX Screen-Pop & เครื่องมือทดสอบสายเรียกเข้า
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            คัดลอก URL ด้านล่างไปตั้งค่าใน 3CX Client หรือกดปุ่มจำลองสายเพื่อทดสอบการเปิดหน้าลูกค้าอัตโนมัติ
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCopyUrl(templateUrl)}
          className="px-3 py-1.5 bg-bg-subtle hover:bg-bg-muted border border-border rounded-lg text-xs font-semibold text-brand flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>คัดลอก URL สำหรับ 3CX</span>
        </button>
      </div>

      <div className="p-3 bg-bg-subtle border border-border rounded-lg font-mono text-xs text-text-primary break-all">
        {templateUrl}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="sm:col-span-2">
          <label className="block text-text-secondary font-medium mb-1">
            เบอร์โทรสายเรียกเข้า (<code className="font-mono">number</code>)
          </label>
          <input
            type="text"
            required
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="เช่น 0823451122 หรือ +66818925678"
            className="w-full px-3 py-2 border border-border rounded-lg font-mono focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-text-secondary font-medium mb-1">
            เลขภายใน (<code className="font-mono">ext</code>)
          </label>
          <input
            type="text"
            value={extInput}
            onChange={(e) => setExtInput(e.target.value)}
            placeholder="101"
            className="w-full px-3 py-2 border border-border rounded-lg font-mono focus:outline-none focus:border-brand"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full py-2 px-4 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <PhoneIncoming className="w-4 h-4" />
            <span>จำลองยิง Screen-Pop</span>
          </button>
        </div>
      </form>

      <div className="pt-2 border-t border-divider flex flex-wrap items-center gap-2 text-xs">
        <span className="text-text-secondary font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span>สถานการณ์ทดสอบด่วน:</span>
        </span>
        {PRESET_SCENARIOS.map((preset) => (
          <button
            key={preset.phone}
            type="button"
            onClick={() => {
              setPhoneInput(preset.phone);
              setExtInput(preset.ext);
              const nextCallId = `3cx-${Math.floor(10000 + Math.random() * 90000)}`;
              setCallIdInput(nextCallId);
              onTriggerScreenPop(preset.phone, preset.ext, nextCallId);
            }}
            className="px-2.5 py-1 bg-bg-subtle hover:bg-brand-tint hover:text-brand border border-border rounded-md text-[11px] font-medium text-text-primary transition-colors cursor-pointer"
          >
            {preset.label} (<span className="font-mono">{preset.phone}</span>)
          </button>
        ))}
      </div>
    </div>
  );
};
