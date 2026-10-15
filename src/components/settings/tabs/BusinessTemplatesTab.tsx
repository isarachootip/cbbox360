import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Network,
  Bot,
  MessageSquare,
} from 'lucide-react';
import { BusinessTemplatePreset, TemplateApplyOptions } from '../../../types';
import { useBusinessTemplate } from '../../../hooks/useBusinessTemplate';
import { BusinessTemplateCard } from '../BusinessTemplateCard';
import { TemplatePreviewModal } from '../TemplatePreviewModal';

interface BusinessTemplatesTabProps {
  onSwitchToBotTab: () => void;
}

export const BusinessTemplatesTab: React.FC<BusinessTemplatesTabProps> = ({
  onSwitchToBotTab,
}) => {
  const navigate = useNavigate();
  const {
    templates,
    activeTemplateId,
    appliedTemplateIds,
    lastAppliedAt,
    applyTemplate,
    resetToDefaultTemplate,
  } = useBusinessTemplate();

  const [previewTemplate, setPreviewTemplate] = useState<BusinessTemplatePreset | null>(null);

  const handleConfirmApply = async (options: TemplateApplyOptions) => {
    if (!previewTemplate) return;
    await applyTemplate(previewTemplate.id, options);
    setPreviewTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl border border-border bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-text-primary">
              เทมเพลตตั้งค่าธุรกิจสำเร็จรูป (Industry Setup Blueprints)
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>โหมด Non-Destructive Merge</span>
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            เลือกประเภทธุรกิจเพื่อเพิ่ม API Connectors เฉพาะอุตสาหกรรม (เช่น HIS โรงพยาบาล, ระบบพัสดุ Logistics, ศูนย์บริการรถยนต์ DMS) พร้อมชุดข้อความตอบกลับด่วนและกฎแชทบอทโดยไม่ลบข้อมูลเดิม
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {lastAppliedAt && (
            <span className="text-[11px] text-text-muted">อัปเดตล่าสุด: {lastAppliedAt}</span>
          )}
          <button
            type="button"
            onClick={resetToDefaultTemplate}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-slate-50 text-xs font-semibold text-text-secondary flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตค่าเริ่มต้น</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {templates.map((tpl) => (
          <BusinessTemplateCard
            key={tpl.id}
            template={tpl}
            isActive={activeTemplateId === tpl.id}
            isApplied={appliedTemplateIds.includes(tpl.id)}
            onPreview={setPreviewTemplate}
            onApply={(id) => applyTemplate(id)}
            onConfigureApi={() => navigate('/connectors')}
          />
        ))}
      </div>

      <div className="p-4 rounded-xl border border-border bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-text-secondary">
          หลังจากกดติดตั้งเทมเพลตแล้ว คุณสามารถเข้าไปปรับแต่ง API Token, ข้อความตอบกลับ และคีย์เวิร์ดบอทต่อได้ทันที:
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/connectors')}
            className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
          >
            <Network className="w-3.5 h-3.5" />
            <span>ไปที่หน้า Connectors</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/canned-responses')}
            className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ไปที่ข้อความตอบกลับด่วน</span>
          </button>
          <button
            type="button"
            onClick={onSwitchToBotTab}
            className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>ไปที่กฎ Bot Auto-Reply</span>
          </button>
        </div>
      </div>

      <TemplatePreviewModal
        isOpen={Boolean(previewTemplate)}
        template={previewTemplate}
        isApplied={previewTemplate ? appliedTemplateIds.includes(previewTemplate.id) : false}
        onClose={() => setPreviewTemplate(null)}
        onConfirmApply={handleConfirmApply}
      />
    </div>
  );
};
