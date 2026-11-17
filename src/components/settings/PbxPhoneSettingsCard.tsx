import React, { useEffect, useState } from 'react';
import { PhoneOutgoing, Save, ExternalLink, RotateCcw } from 'lucide-react';
import { useBot } from '../../context/BotContext';
import { useToast } from '../../context/ToastContext';
import { useClickToCall } from '../../hooks/useClickToCall';
import {
  DEFAULT_PBX_CONFIG,
  buildPbxWebPhoneDialUrl,
  formatOutboundDialNumber,
  parsePbxConfig,
} from '../../domain/telephony/clickToCall';
import type { PbxClickToCallConfig } from '../../types';

export const PbxPhoneSettingsCard: React.FC = () => {
  const { settings, updateSettings } = useBot();
  const { showToast } = useToast();
  const { triggerClickToCall } = useClickToCall();

  const [draft, setDraft] = useState<PbxClickToCallConfig>(() => parsePbxConfig(settings.pbxConfig));
  const [testPhone, setTestPhone] = useState('081-892-5678');

  useEffect(() => setDraft(parsePbxConfig(settings.pbxConfig)), [settings.pbxConfig]);

  const previewDial = formatOutboundDialNumber(testPhone, draft.outboundPrefix) || '0818925678';
  const previewUrl = buildPbxWebPhoneDialUrl(draft.phoneUrl, previewDial);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) {
      showToast('กรุณาระบุ PABX Phone URL ที่ขึ้นต้นด้วย http:// หรือ https://', 'error');
      return;
    }
    updateSettings(
      { pbxConfig: parsePbxConfig(draft) },
      'บันทึกการตั้งค่า PABX WebPhone (Click-to-Call) เรียบร้อยแล้ว'
    );
  };

  const handleResetDefaults = () => {
    setDraft({ ...DEFAULT_PBX_CONFIG });
    updateSettings({ pbxConfig: { ...DEFAULT_PBX_CONFIG } }, 'รีเซ็ตค่า PABX Phone URL เป็นค่ามาตรฐานแล้ว');
  };

  const handleToggleEnabled = () => {
    const next = { ...draft, enabled: !draft.enabled };
    setDraft(next);
    updateSettings(
      { pbxConfig: parsePbxConfig(next) },
      next.enabled ? 'เปิดใช้งาน Click-to-Call แล้ว' : 'ปิดใช้งาน Click-to-Call ชั่วคราว'
    );
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl border border-border p-5 shadow-card space-y-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-divider pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-bg-subtle border border-border text-brand flex items-center justify-center shrink-0">
            <PhoneOutgoing className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-text-primary">
                ระบบโทรศัพท์ PABX WebPhone (Click-to-Call Settings)
              </h3>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${draft.enabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${draft.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span>{draft.enabled ? 'WebPhone Active' : 'Inactive'}</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              กำหนด URL ของระบบโทรศัพท์เพื่อให้ปุ่มกดโทรเปิดแท็บโทรศัพท์เดิมซ้ำอัตโนมัติ (Reuse Tab)
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={draft.enabled}
          onClick={handleToggleEnabled}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            draft.enabled ? 'bg-brand' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
              draft.enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="md:col-span-2">
          <label className="block text-text-secondary font-medium mb-1">PABX Phone URL (WebPhone Endpoint) *</label>
          <input
            type="url"
            required
            value={draft.phoneUrl}
            onChange={(e) => setDraft({ ...draft, phoneUrl: e.target.value })}
            placeholder="https://pbx01.cb360.online:5001/phone/index.html"
            className="w-full px-3 py-2 border border-border rounded-lg font-mono text-xs text-text-primary focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-text-secondary font-medium mb-1">Window Target Name</label>
          <input
            type="text"
            value={draft.windowName}
            onChange={(e) => setDraft({ ...draft, windowName: e.target.value })}
            placeholder="pbx_360_phone"
            className="w-full px-3 py-2 border border-border rounded-lg font-mono text-xs text-text-primary focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-text-secondary font-medium mb-1">Outbound Prefix</label>
          <input
            type="text"
            maxLength={6}
            value={draft.outboundPrefix}
            onChange={(e) => setDraft({ ...draft, outboundPrefix: e.target.value })}
            placeholder="เว้นว่าง หรือเช่น 9"
            className="w-full px-3 py-2 border border-border rounded-lg font-mono text-xs text-text-primary focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="p-3 rounded-xl bg-bg-subtle border border-border space-y-1">
        <div className="text-[11px] font-semibold text-text-secondary">ตัวอย่างคำสั่งเปิดสายจริง:</div>
        <div className="font-mono text-[11px] text-brand font-semibold break-all">
          {previewUrl
            ? `window.open("${previewUrl}", "${draft.windowName || 'pbx_360_phone'}")`
            : 'รูปแบบ Phone URL ไม่ถูกต้อง'}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 cursor-pointer text-text-primary">
            <input
              type="checkbox"
              checked={draft.requireExtension}
              onChange={(e) => setDraft({ ...draft, requireExtension: e.target.checked })}
              className="rounded border-border text-brand focus:ring-brand"
            />
            <span>บังคับผู้ใช้งานต้องผูกเลข Extension ก่อนโทร</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer text-text-primary">
            <input
              type="checkbox"
              checked={draft.fallbackTelUri}
              onChange={(e) => setDraft({ ...draft, fallbackTelUri: e.target.checked })}
              className="rounded border-border text-brand focus:ring-brand"
            />
            <span>Fallback เปิดลิงก์ tel: หาก Pop-up ถูกบล็อก</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="เบอร์ทดสอบ"
            className="w-32 px-2.5 py-1.5 border border-border rounded-lg font-mono text-xs focus:outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={() => triggerClickToCall({ rawPhone: testPhone })}
            className="px-3 py-1.5 border border-border hover:bg-bg-subtle text-brand rounded-lg font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>ทดสอบโทรออก</span>
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-2.5 py-1.5 border border-border hover:bg-bg-subtle text-text-secondary rounded-lg font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ค่าเริ่มต้น</span>
          </button>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>บันทึก Phone URL</span>
          </button>
        </div>
      </div>
    </form>
  );
};
