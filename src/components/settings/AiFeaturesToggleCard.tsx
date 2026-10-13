import React from 'react';
import { Sparkles, FileText, Building2 } from 'lucide-react';
import { useBot } from '../../context/BotContext';

export const AiFeaturesToggleCard: React.FC = () => {
  const { settings, updateSettings } = useBot();

  const suggestReplyEnabled = settings.aiSuggestReplyEnabled !== false;
  const summaryEnabled = settings.aiSummaryEnabled !== false;
  const companyName = settings.companyName || 'CusBox360';

  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-divider pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-text-primary">
              ✨ ฟีเจอร์ผู้ช่วย AI สำหรับเจ้าหน้าที่ (Omnichannel Inbox Copilot)
            </h3>
            <p className="text-xs text-text-secondary">
              เปิด/ปิดฟีเจอร์ร่างคำตอบ (Suggested Reply) และสรุปบทสนทนา (AI Summary) โดยไม่กระทบลำดับการทำงานของ Bot Auto-Reply
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-xs text-text-secondary whitespace-nowrap">ชื่อบริษัท ({'{company_name}'}):</span>
          <input
            type="text"
            value={companyName}
            onChange={(e) => updateSettings({ companyName: e.target.value })}
            placeholder="CusBox360"
            className="px-2.5 py-1 text-xs border border-border rounded-lg focus:outline-none focus:border-brand w-36 font-medium text-text-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Toggle 1: Suggested Reply */}
        <div className="p-3.5 rounded-xl bg-bg-subtle border border-border flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <span className="font-bold text-xs text-text-primary">
                1. แนะนำคำตอบอัตโนมัติ (Suggested Reply)
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                  suggestReplyEnabled ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    suggestReplyEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span>{suggestReplyEnabled ? 'Active' : 'Inactive'}</span>
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              แสดงปุ่ม &quot;✨ แนะนำคำตอบ&quot; ข้างกล่องพิมพ์ ร่างตัวเลือก 2–3 แบบให้เจ้าหน้าที่ตรวจและแก้ไขก่อนส่ง (Temperature 0.4)
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={suggestReplyEnabled}
            onClick={() => updateSettings({ aiSuggestReplyEnabled: !suggestReplyEnabled })}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              suggestReplyEnabled ? 'bg-brand' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                suggestReplyEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: AI Summary */}
        <div className="p-3.5 rounded-xl bg-bg-subtle border border-border flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand" />
              <span className="font-bold text-xs text-text-primary">
                2. สรุปบทสนทนาในแผงขวา (AI Summary)
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                  summaryEnabled ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    summaryEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span>{summaryEnabled ? 'Active' : 'Inactive'}</span>
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              แสดงการ์ด AI Summary บนสุดของแผง CDP ด้านขวา สรุปเรื่อง 10 วินาที พร้อมปุ่มลัดสร้าง Ticket/Lead (Temperature 0.2)
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={summaryEnabled}
            onClick={() => updateSettings({ aiSummaryEnabled: !summaryEnabled })}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              summaryEnabled ? 'bg-brand' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                summaryEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
