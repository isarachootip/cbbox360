import React from 'react';
import {
  Stethoscope,
  Truck,
  Car,
  Building2,
  Eye,
  Sparkles,
  Network,
  Bot,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { BusinessTemplatePreset } from '../../types';

interface BusinessTemplateCardProps {
  template: BusinessTemplatePreset;
  isActive: boolean;
  isApplied: boolean;
  onPreview: (template: BusinessTemplatePreset) => void;
  onApply: (templateId: BusinessTemplatePreset['id']) => void;
  onConfigureApi: () => void;
}

export const BusinessTemplateCard: React.FC<BusinessTemplateCardProps> = ({
  template,
  isActive,
  isApplied,
  onPreview,
  onApply,
  onConfigureApi,
}) => {
  const renderIcon = (iconName: BusinessTemplatePreset['iconName']) => {
    switch (iconName) {
      case 'hospital':
        return <Stethoscope className="w-5 h-5 text-emerald-600" />;
      case 'truck':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'car':
        return <Car className="w-5 h-5 text-amber-600" />;
      default:
        return <Building2 className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div
      className={`p-5 rounded-xl border transition-all bg-white flex flex-col justify-between space-y-4 ${
        isActive
          ? 'border-brand ring-1 ring-brand/20 shadow-xs'
          : 'border-border hover:border-slate-300 shadow-2xs'
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-border bg-slate-50 flex items-center justify-center shrink-0">
              {renderIcon(template.iconName)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">{template.name}</h3>
              <p className="text-xs font-medium text-text-secondary">{template.thaiTitle}</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 ${
              isActive ? 'text-emerald-600' : isApplied ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isActive
                  ? 'bg-emerald-500 animate-pulse'
                  : isApplied
                  ? 'bg-blue-500'
                  : 'bg-slate-400'
              }`}
            />
            <span>
              {isActive ? 'กำลังใช้งานหลัก' : isApplied ? 'ติดตั้งเสริมแล้ว' : 'พร้อมติดตั้ง'}
            </span>
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">{template.description}</p>

        <div className="space-y-1.5 pt-1">
          {template.workflowHighlights.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-text-primary">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-blue-600" />
            <strong className="text-text-primary">{template.connectors.length}</strong> Industry API
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <strong className="text-text-primary">{template.cannedResponses.length}</strong> ข้อความด่วน
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-purple-600" />
            <strong className="text-text-primary">{template.botRules.length}</strong> กฎ Auto-Reply
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => onPreview(template)}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-slate-50 text-xs font-semibold text-text-primary flex items-center gap-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-text-secondary" />
            <span>ดูรายละเอียด Blueprint</span>
          </button>

          <div className="flex items-center gap-2">
            {isApplied && template.connectors.length > 0 && (
              <button
                type="button"
                onClick={onConfigureApi}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand hover:underline flex items-center gap-1"
              >
                <span>ตั้งค่า API</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onApply(template.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                isActive
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-brand hover:bg-brand-hover text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isApplied ? 'ซิงก์ซ้ำ (Re-Merge)' : 'เลือกใช้เทมเพลตนี้'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
