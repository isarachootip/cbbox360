import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Plus } from 'lucide-react';
import {
  Customer,
  ChatMessage,
  AiSummaryResult,
  AiSummarySentiment,
  AiSummaryUrgency,
} from '../../types';
import { useCustomer } from '../../context/CustomerContext';
import { useCannedResponses } from '../../context/CannedResponseContext';
import { useBot } from '../../context/BotContext';
import { useAuth } from '../../context/AuthContext';
import { requestAiSummary } from '../../services/aiAssistantApi';
import { AiQuickActionModal } from './AiQuickActionModal';

interface AiSummaryCardProps {
  conversationId: string;
  customer: Customer;
  messages: ChatMessage[];
  onAddSuggestedLabel?: (label: string) => void;
}

const getSentimentStyle = (sentiment: AiSummarySentiment) => {
  switch (sentiment) {
    case 'positive':
      return { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Positive (บวก)' };
    case 'negative':
      return { dot: 'bg-amber-500', text: 'text-amber-600', label: 'Negative (ไม่พอใจ)' };
    case 'angry':
      return { dot: 'bg-rose-500', text: 'text-rose-600', label: 'Angry (โกรธ)' };
    default:
      return { dot: 'bg-blue-500', text: 'text-blue-600', label: 'Neutral (ปกติ)' };
  }
};

const getUrgencyStyle = (urgency: AiSummaryUrgency) => {
  switch (urgency) {
    case 'high':
      return { dot: 'bg-rose-500', text: 'text-rose-600', label: 'เร่งด่วนสูง' };
    case 'medium':
      return { dot: 'bg-amber-500', text: 'text-amber-600', label: 'ปานกลาง' };
    default:
      return { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'ทั่วไป' };
  }
};

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  conversationId,
  customer,
  messages,
  onAddSuggestedLabel,
}) => {
  const { tickets } = useCustomer();
  const { cannedResponses } = useCannedResponses();
  const { settings } = useBot();
  const { currentUser } = useAuth();

  const [summaryData, setSummaryData] = useState<AiSummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'ticket' | 'lead' | null>(null);

  const isEnabled = settings.aiSummaryEnabled !== false;
  const openTickets = tickets.filter((t) => t.customerId === customer.id && t.status !== 'Closed');

  const fetchSummary = async (forceRefresh = false) => {
    if (!isEnabled || !conversationId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await requestAiSummary({
        conversationId,
        customer,
        messages,
        openTickets,
        cannedResponses,
        agentName: currentUser?.name,
        userId: currentUser?.id,
        forceRefresh,
      });
      setSummaryData(res);
    } catch (_err) {
      setErrorMsg('ไม่สามารถสร้างสรุปแชทได้ในขณะนี้');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate when opening conversation or when message count changes
  useEffect(() => {
    fetchSummary(false);
  }, [conversationId, messages.length, isEnabled]);

  if (!isEnabled) return null;

  const sentimentCfg = summaryData ? getSentimentStyle(summaryData.sentiment) : null;
  const urgencyCfg = summaryData ? getUrgencyStyle(summaryData.urgency) : null;

  return (
    <div className="mb-3 p-3 rounded-xl bg-bg-subtle border border-border space-y-2.5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-brand">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Summary</span>
          {summaryData?.cached && (
            <span className="text-[10px] font-normal text-text-secondary">(แคชล่าสุด)</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fetchSummary(true)}
          disabled={isLoading}
          title="สรุปใหม่"
          className="text-text-secondary hover:text-brand p-1 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-brand' : ''}`} />
        </button>
      </div>

      {isLoading && !summaryData ? (
        <div className="py-3 text-center text-[11px] text-text-secondary animate-pulse">
          กำลังวิเคราะห์และสรุปบทสนทนา...
        </div>
      ) : errorMsg ? (
        <div className="text-[11px] text-rose-600">{errorMsg}</div>
      ) : summaryData ? (
        <>
          <p className="text-text-primary leading-relaxed text-[12px]">{summaryData.summary}</p>

          {/* Sentiment & Urgency (CB360 Clean Status Indicator: Dot + Colored Text, No Pill Box) */}
          <div className="flex items-center justify-between py-1.5 border-y border-divider text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-text-secondary">อารมณ์:</span>
              {sentimentCfg && (
                <span className={`inline-flex items-center gap-1 font-semibold ${sentimentCfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sentimentCfg.dot}`} />
                  <span>{sentimentCfg.label}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-text-secondary">ความเร่งด่วน:</span>
              {urgencyCfg && (
                <span className={`inline-flex items-center gap-1 font-semibold ${urgencyCfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${urgencyCfg.dot}`} />
                  <span>{urgencyCfg.label}</span>
                </span>
              )}
            </div>
          </div>

          {/* Pending items */}
          {summaryData.pending.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-text-secondary mb-1">สิ่งที่ยังค้าง:</div>
              <ul className="space-y-0.5 text-[11px] text-text-primary list-disc list-inside">
                {summaryData.pending.map((item, idx) => (
                  <li key={idx} className="leading-snug">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Step */}
          {summaryData.next_step && (
            <div className="p-2 rounded-lg bg-white border border-border">
              <span className="font-bold text-brand text-[11px]">ทำต่อ: </span>
              <span className="text-[11px] text-text-primary">{summaryData.next_step}</span>
            </div>
          )}

          {/* Suggested Labels */}
          {summaryData.labels.length > 0 && onAddSuggestedLabel && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-text-secondary">แนะนำป้าย:</span>
              {summaryData.labels.map((lbl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onAddSuggestedLabel(lbl)}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-white hover:border-brand text-text-secondary hover:text-brand flex items-center gap-0.5 transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>{lbl}</span>
                </button>
              ))}
            </div>
          )}

          {/* Pre-filled Action Buttons: สร้าง Ticket / สร้าง Lead */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setModalMode('ticket')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all flex items-center justify-center gap-1 ${
                summaryData.suggest_ticket.create
                  ? 'border-brand bg-white text-brand hover:bg-brand hover:text-white shadow-2xs'
                  : 'border-border bg-white text-text-secondary hover:text-text-primary'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>สร้าง Ticket</span>
            </button>
            <button
              type="button"
              onClick={() => setModalMode('lead')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all flex items-center justify-center gap-1 ${
                summaryData.suggest_lead.create
                  ? 'border-brand bg-white text-brand hover:bg-brand hover:text-white shadow-2xs'
                  : 'border-border bg-white text-text-secondary hover:text-text-primary'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>สร้าง Lead</span>
            </button>
          </div>

          <AiQuickActionModal
            isOpen={modalMode !== null}
            mode={modalMode || 'ticket'}
            customer={customer}
            initialTitle={
              modalMode === 'ticket'
                ? summaryData.suggest_ticket.title || `ติดตามเรื่อง ${summaryData.intent} (${customer.name})`
                : summaryData.suggest_lead.title || `โอกาสการขายใหม่ (${customer.name})`
            }
            initialTicketType={summaryData.suggest_ticket.type || summaryData.intent}
            initialEstValue={summaryData.suggest_lead.est_value}
            onClose={() => setModalMode(null)}
          />
        </>
      ) : null}
    </div>
  );
};
