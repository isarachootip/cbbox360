import React, { useState } from 'react';
import { Sparkles, Key, Check, Eye, EyeOff } from 'lucide-react';
import { BotSettings } from '../../types';

interface BotAiSettingsCardProps {
  botSettings: BotSettings;
  updateBotSettings: (partial: Partial<BotSettings>) => void;
}

/**
 * BotAiSettingsCard — Configuration card for Gemini AI Smart Auto-Reply & Fallback
 * Strictly complies with CB360 Clean UI Guidelines:
 * Dot indicator (●) + Colored text, transparent backgrounds
 */
export const BotAiSettingsCard: React.FC<BotAiSettingsCardProps> = ({
  botSettings,
  updateBotSettings,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(botSettings.geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveKey = () => {
    updateBotSettings({ geminiApiKey: apiKeyInput.trim() });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const hasKey = !!(botSettings.geminiApiKey || apiKeyInput.trim());

  return (
    <div className="bg-bg-subtle/70 rounded-xl p-4 border border-border mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold text-text-primary">
            AI Smart Fallback & Off-Hours (Gemini AI)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              hasKey ? 'bg-purple-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span className={hasKey ? 'text-purple-600' : 'text-slate-500'}>
            {hasKey ? '● AI Active' : '● ใช้ Fallback ปกติ (ไม่มี AI Key)'}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-text-secondary mb-3 leading-relaxed">
        เมื่อลูกค้าพิมพ์ข้อความทั่วไปที่ไม่ตรงกับคำสำคัญ หรือทักมานอกเวลาทำการ (เช่น{' '}
        <span className="font-semibold text-text-primary">&quot;ทำไมเงียบ&quot;</span>) ระบบจะใช้ Gemini AI
        ช่วยวิเคราะห์ประวัติการคุยล่าสุดและตอบกลับอย่างสุภาพและแม่นยำอัตโนมัติ
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={(e) => {
              setApiKeyInput(e.target.value);
              setIsSaved(false);
            }}
            placeholder="ใส่ Gemini API Key หรือปล่อยว่างเพื่อใช้ค่าจาก GEMINI_API_KEY ในระบบ"
            className="w-full pl-8 pr-9 py-1.5 text-xs bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            title={showKey ? 'ซ่อน API Key' : 'แสดง API Key'}
          >
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          type="button"
          onClick={handleSaveKey}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
            isSaved
              ? 'bg-emerald-600 text-white'
              : 'bg-brand hover:bg-brand-hover text-white'
          }`}
        >
          {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
          <span>{isSaved ? 'บันทึกแล้ว' : 'บันทึก API Key'}</span>
        </button>
      </div>
    </div>
  );
};
