import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ShieldAlert, X, Loader2 } from 'lucide-react';
import {
  Customer,
  ChatMessage,
  SuggestedReplyResult,
  SuggestedReplyOption,
} from '../../types';
import { useCustomer } from '../../context/CustomerContext';
import { useCannedResponses } from '../../context/CannedResponseContext';
import { useBot } from '../../context/BotContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  requestSuggestedReply,
  updateAiUsageLog,
} from '../../services/aiAssistantApi';

interface AiSuggestedReplyPanelProps {
  conversationId: string;
  customer: Customer;
  messages: ChatMessage[];
  onSelectReply: (text: string, logId?: string) => void;
}

export const AiSuggestedReplyPanel: React.FC<AiSuggestedReplyPanelProps> = ({
  conversationId,
  customer,
  messages,
  onSelectReply,
}) => {
  const { tickets } = useCustomer();
  const { cannedResponses } = useCannedResponses();
  const { settings } = useBot();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [result, setResult] = useState<SuggestedReplyResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isEnabled = settings.aiSuggestReplyEnabled !== false;
  if (!isEnabled) return null;

  const openTickets = tickets.filter((t) => t.customerId === customer.id && t.status !== 'Closed');

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const data = await requestSuggestedReply({
        conversationId,
        customer,
        messages,
        openTickets,
        cannedResponses,
        agentName: currentUser?.name,
        userId: currentUser?.id,
      });
      setResult(data);
    } catch (_err) {
      showToast('ไม่สามารถสร้างคำแนะนำคำตอบได้ในขณะนี้', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickOption = (opt: SuggestedReplyOption) => {
    if (result?.logId) {
      updateAiUsageLog(result.logId, {
        selectedLabel: opt.label,
        selectedText: opt.text,
      });
    }
    onSelectReply(opt.text, result?.logId);
    showToast(`นำข้อความ "${opt.label}" ใส่กล่องพิมพ์แล้ว สามารถแก้ไขก่อนส่งได้`, 'info');
  };

  return (
    <div className="space-y-2">
      {/* Trigger button row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border border-brand/40 bg-brand-tint/40 hover:bg-brand-tint text-brand transition-all shadow-2xs disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{isLoading ? 'กำลังร่างคำตอบ...' : '✨ แนะนำคำตอบ'}</span>
        </button>

        {result && (
          <button
            type="button"
            onClick={() => setResult(null)}
            className="text-[11px] text-text-secondary hover:text-text-primary flex items-center gap-0.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>ซ่อนคำแนะนำ</span>
          </button>
        )}
      </div>

      {/* Results panel */}
      {result && (
        <div className="p-3 rounded-xl bg-bg-subtle border border-border space-y-2.5 text-xs">
          {/* Header & Escalation / Human Check Notices */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-primary text-[11px]">
                เลือกคำตอบเพื่อนำไปแก้ไขในกล่องพิมพ์ (ไม่ส่งอัตโนมัติ):
              </span>
              {result.used_canned.length > 0 && (
                <span className="text-[10px] font-mono text-brand">
                  อ้างอิง: {result.used_canned.join(', ')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {result.needs_human_check && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>ต้องตรวจสอบก่อนส่ง</span>
                </span>
              )}
              {result.escalate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>ควรส่งต่อหัวหน้า</span>
                </span>
              )}
            </div>
          </div>

          {/* Missing Info Yellow Warning */}
          {result.missing_info.length > 0 && (
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">ข้อมูลที่ควรตรวจสอบก่อนส่ง: </span>
                <span>{result.missing_info.join(' · ')}</span>
              </div>
            </div>
          )}

          {/* 2-3 Suggested Reply Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {result.replies.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePickOption(item)}
                className="text-left p-2.5 rounded-lg bg-white border border-border hover:border-brand hover:shadow-xs transition-all flex flex-col justify-between gap-1.5 group"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-[11px] text-brand group-hover:underline">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-text-secondary">คลิกเพื่อใช้</span>
                </div>
                <p className="text-[11px] text-text-primary leading-relaxed line-clamp-3">
                  {item.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
