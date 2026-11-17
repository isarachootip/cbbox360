import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Network,
  Bot,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { BusinessTemplatePreset, TemplateApplyOptions } from '../../../types';
import { useBusinessTemplate } from '../../../hooks/useBusinessTemplate';
import { BusinessTemplateCard } from '../BusinessTemplateCard';
import { BusinessModeLockCard } from '../BusinessModeLockCard';
import { TemplatePreviewModal } from '../TemplatePreviewModal';

interface BusinessTemplatesTabProps {
  onSwitchToBotTab: () => void;
  onSwitchToKnowledgeTab?: () => void;
}

export const BusinessTemplatesTab: React.FC<BusinessTemplatesTabProps> = ({
  onSwitchToBotTab,
  onSwitchToKnowledgeTab,
}) => {
  const navigate = useNavigate();
  const {
    templates,
    activeTemplateId,
    deploymentMode,
    isLocked,
    isSysAdmin,
    appliedTemplateIds,
    lastAppliedAt,
    applyTemplate,
    setDeploymentMode,
    resetToDefaultTemplate,
  } = useBusinessTemplate();

  const [previewTemplate, setPreviewTemplate] = useState<BusinessTemplatePreset | null>(null);
  const activePreset = templates.find((t) => t.id === activeTemplateId) ?? templates[0];

  const handleConfirmApply = async (options: TemplateApplyOptions) => {
    if (!previewTemplate) return;
    await applyTemplate(previewTemplate.id, options);
    setPreviewTemplate(null);
  };

  return (
    <div className="space-y-6">
      <BusinessModeLockCard
        activeTemplate={activePreset}
        deploymentMode={deploymentMode}
        isSysAdmin={isSysAdmin}
        onChangeMode={setDeploymentMode}
      />

      <div className="p-5 rounded-xl border border-border bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-text-primary">
              คลังเทมเพลตธุรกิจแยกตามอุตสาหกรรม (Scoped Industry Blueprints)
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>แยกชุดข้อมูลรายธุรกิจ ไม่ปนกัน</span>
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            แต่ละธุรกิจมีชุดข้อความตอบกลับด่วน, Keyword บอท, คลังความรู้ AI และเมนูเฉพาะทางของตนเอง การปรับแก้ในธุรกิจหนึ่งจะไม่กระทบธุรกิจอื่น
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {lastAppliedAt && (
            <span className="text-[11px] text-text-muted">อัปเดตล่าสุด: {lastAppliedAt}</span>
          )}
          <button
            type="button"
            disabled={isLocked}
            onClick={resetToDefaultTemplate}
            className={`px-3 py-1.5 rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isLocked
                ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                : 'hover:bg-slate-50 text-text-secondary'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตค่ามาตรฐานธุรกิจนี้</span>
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
            isLocked={isLocked}
            onPreview={setPreviewTemplate}
            onApply={(id) => applyTemplate(id)}
            onConfigureApi={() => navigate('/connectors')}
          />
        ))}
      </div>

      <div className="p-4 rounded-xl border border-border bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-text-secondary">
          ปรับแต่งข้อมูลองค์กร/คลังความรู้ AI, API Token, ข้อความตอบกลับ และคีย์เวิร์ดบอทของธุรกิจที่กำลังเลือกอยู่:
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {onSwitchToKnowledgeTab && (
            <button
              type="button"
              onClick={onSwitchToKnowledgeTab}
              className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>ไปที่ข้อมูลองค์กร & คลังความรู้ AI (KM)</span>
            </button>
          )}
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
