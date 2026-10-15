import React, { useState } from 'react';
import {
  Network,
  MessageSquare,
  Layers,
  Code,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { BusinessTemplatePreset, TemplateApplyOptions } from '../../types';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  template: BusinessTemplatePreset | null;
  isApplied: boolean;
  onClose: () => void;
  onConfirmApply: (options: TemplateApplyOptions) => void;
}

const OPTION_ITEMS: { key: keyof TemplateApplyOptions; title: string; subtitle: string }[] = [
  { key: 'mergeConnectors', title: 'Industry Connectors', subtitle: 'API & Webhook เฉพาะอุตสาหกรรม' },
  { key: 'mergeCannedResponses', title: 'Canned Responses', subtitle: 'ชุดข้อความตอบกลับด่วน' },
  { key: 'mergeBotRules', title: 'Bot Auto-Reply Rules', subtitle: 'คีย์เวิร์ดบอทตอบอัตโนมัติ' },
  { key: 'enableRecommendedMenus', title: 'Sidebar & Role Preset', subtitle: 'เปิดสิทธิ์เมนูหลักที่เกี่ยวข้อง' },
];

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  template,
  isApplied,
  onClose,
  onConfirmApply,
}) => {
  const [options, setOptions] = useState<TemplateApplyOptions>({
    mergeConnectors: true,
    mergeCannedResponses: true,
    mergeBotRules: true,
    enableRecommendedMenus: true,
  });

  if (!template) return null;

  const toggleOption = (key: keyof TemplateApplyOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Blueprint: ${template.name} (${template.thaiTitle})`}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
        <div className="p-3.5 rounded-xl border border-border bg-slate-50/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary">{template.tagline}</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                isApplied ? 'text-emerald-600' : 'text-blue-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isApplied ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <span>{isApplied ? 'ติดตั้งแล้ว (Merged)' : 'พร้อมติดตั้ง (Non-Destructive)'}</span>
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{template.description}</p>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand" />
            <span>เลือกโมดูลที่ต้องการ Merge เข้าสู่ระบบ (ไม่ลบข้อมูลเดิม)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OPTION_ITEMS.map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-white cursor-pointer hover:border-brand/50"
              >
                <input
                  type="checkbox"
                  checked={options[item.key]}
                  onChange={() => toggleOption(item.key)}
                  className="rounded text-brand focus:ring-brand"
                />
                <div className="text-xs">
                  <div className="font-semibold text-text-primary">{item.title}</div>
                  <div className="text-[11px] text-text-muted">{item.subtitle}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {template.connectors.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-blue-600" />
              <span>1. ระบบเชื่อมต่อภายนอก (Industry API & Webhooks)</span>
            </div>
            <div className="space-y-2">
              {template.connectors.map((conn) => (
                <div key={conn.id} className="p-3 rounded-lg border border-border bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">{conn.name}</span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Webhook Ready</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary">{conn.description}</p>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    Endpoint: {conn.webhookUrl}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {template.cannedResponses.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. ข้อความตอบกลับด่วน & กฎแชทบอท (Canned & Auto-Reply)</span>
            </div>
            <div className="space-y-1.5">
              {template.cannedResponses.map((cr) => (
                <div key={cr.id} className="p-2.5 rounded-lg border border-border bg-white text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">{cr.title}</span>
                    <span className="font-mono text-[11px] text-brand font-bold">{cr.shortcut}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-2">{cr.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-purple-600" />
            <span>3. ตัวแปรไดนามิกเฉพาะธุรกิจ (Template Variables)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {template.customVariables.map((v) => (
              <div key={v.key} className="px-2.5 py-1 rounded-md border border-border bg-white text-[11px]">
                <span className="font-mono font-bold text-brand">{`{${v.key}}`}</span>
                <span className="text-text-secondary ml-1.5">{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => onConfirmApply(options)}
            className="px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ติดตั้งและ Merge เข้าสู่ระบบ</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
