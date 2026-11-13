import React, { useState } from 'react';
import { Copy, PhoneIncoming, ExternalLink } from 'lucide-react';
import type { ConnectorConfig } from '../../types';
import { buildScreenPopUrlTemplate } from '../../domain/telephony/phoneMatcher';

interface ThreeCxConfigPanelProps {
  editForm: ConnectorConfig;
  onChange: (next: ConnectorConfig) => void;
  onToggleFeature: (featureKey: string) => void;
  onCopyUrl: (url: string) => void;
  onTestScreenPop: (phone: string, ext: string) => void;
}

export const ThreeCxConfigPanel: React.FC<ThreeCxConfigPanelProps> = ({
  editForm,
  onChange,
  onToggleFeature,
  onCopyUrl,
  onTestScreenPop,
}) => {
  const [samplePhone, setSamplePhone] = useState('0823451122');
  const [sampleExt, setSampleExt] = useState('101');
  const liveTemplateUrl = buildScreenPopUrlTemplate(window.location.origin);

  return (
    <div className="space-y-4 text-xs">
      <div className="p-3.5 bg-bg-subtle rounded-xl border border-border space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-bold text-text-primary block">
              3CX / Telephony Screen-Pop Action URL
            </span>
            <span className="text-[11px] text-text-secondary">
              นำไปวางในเมนู 3CX Desktop/Web Client → Settings → Integration (Launch URL)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onCopyUrl(liveTemplateUrl)}
            className="px-2.5 py-1 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold flex items-center gap-1 flex-shrink-0 cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            <span>คัดลอก URL</span>
          </button>
        </div>
        <input
          type="text"
          readOnly
          value={liveTemplateUrl}
          className="w-full px-3 py-2 bg-white border border-border rounded-lg font-mono text-[11px] text-brand font-semibold"
        />
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-text-secondary font-mono">
          <div>%CallerNumber% = เบอร์โทรเข้า</div>
          <div>%Agent% = เลขภายใน (Ext)</div>
          <div>%CallID% = รหัสอ้างอิงสาย</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-text-secondary font-medium mb-1">ชื่อระบบตู้สาขา (PBX Name)</label>
          <input
            type="text"
            value={editForm.accountName}
            onChange={(e) => onChange({ ...editForm, accountName: e.target.value })}
            className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand font-medium"
          />
        </div>
        <div>
          <label className="block text-text-secondary font-medium mb-1">3CX Server URL</label>
          <input
            type="text"
            value={editForm.appId || ''}
            onChange={(e) => onChange({ ...editForm, appId: e.target.value })}
            placeholder="https://pbx.company.co.th:5001"
            className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
          />
        </div>
      </div>

      <div className="p-3 bg-white rounded-xl border border-border space-y-2.5">
        <div className="font-bold text-text-primary flex items-center gap-1.5">
          <PhoneIncoming className="w-3.5 h-3.5 text-brand" />
          <span>ทดสอบยิงลิงก์ Screen-Pop จำลองทันที</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={samplePhone}
            onChange={(e) => setSamplePhone(e.target.value)}
            placeholder="เบอร์โทรทดสอบ เช่น 0823451122"
            className="flex-1 px-3 py-1.5 border border-border rounded-lg font-mono focus:outline-none focus:border-brand"
          />
          <input
            type="text"
            value={sampleExt}
            onChange={(e) => setSampleExt(e.target.value)}
            placeholder="Ext"
            className="w-24 px-3 py-1.5 border border-border rounded-lg font-mono focus:outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={() => onTestScreenPop(samplePhone, sampleExt)}
            className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>จำลองสายเรียกเข้า</span>
          </button>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-divider">
        <div className="font-bold text-text-primary">ฟังก์ชันการทำงาน</div>
        {editForm.features.map((feat) => (
          <label
            key={feat.key}
            className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-bg-subtle cursor-pointer transition-colors"
          >
            <span className="text-text-primary font-medium">{feat.label}</span>
            <input
              type="checkbox"
              checked={feat.enabled}
              onChange={() => onToggleFeature(feat.key)}
              className="w-4 h-4 text-brand rounded border-border focus:ring-brand"
            />
          </label>
        ))}
      </div>
    </div>
  );
};
