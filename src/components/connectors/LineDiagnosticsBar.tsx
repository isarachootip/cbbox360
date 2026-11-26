import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface LineLiveDiagnostics {
  status: 'connected' | 'disconnected' | 'error';
  hasToken: boolean;
  hasChannelSecret: boolean;
  geminiConfigured: boolean;
  geminiModel: string;
  webhookDiagnostics: {
    lastReceivedAt: string | null;
    lastStatus: string;
    lastEventType: string | null;
    lastError: string | null;
    receivedCount: number;
    rejectedCount: number;
  };
}

interface LineDiagnosticsBarProps {
  diag: LineLiveDiagnostics | null;
  onRefresh: () => void;
}

const formatTime = (iso: string | null): string => {
  if (!iso) return 'ยังไม่มี Webhook เข้ามาหลังรีสตาร์ท';
  try {
    return new Date(iso).toLocaleString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return iso;
  }
};

export const LineDiagnosticsBar: React.FC<LineDiagnosticsBarProps> = ({ diag, onRefresh }) => {
  if (!diag) return null;
  const wh = diag.webhookDiagnostics;
  const whFailed =
    wh.lastStatus === 'invalid_signature' ||
    wh.lastStatus === 'missing_secret' ||
    wh.lastStatus === 'missing_signature' ||
    wh.lastStatus === 'db_error' ||
    wh.lastStatus === 'reply_failed';

  return (
    <div className="bg-white rounded-card border border-border shadow-card p-4 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-text-primary">
          สถานะการรับ LINE Webhook &amp; AI Auto-Reply (Live Diagnostics)
        </span>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเฟรช</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className={`inline-flex items-center gap-1.5 font-medium ${diag.hasToken ? 'text-emerald-600' : 'text-rose-600'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${diag.hasToken ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span>Access Token: {diag.hasToken ? 'พร้อมใช้งาน' : 'ยังไม่ตั้งค่า'}</span>
        </span>

        <span className={`inline-flex items-center gap-1.5 font-medium ${diag.hasChannelSecret ? 'text-emerald-600' : 'text-rose-600'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${diag.hasChannelSecret ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span>Channel Secret: {diag.hasChannelSecret ? 'พร้อมตรวจลายเซ็น' : 'ขาด Secret (Webhook จะโดนบล็อก 500)'}</span>
        </span>

        <span className={`inline-flex items-center gap-1.5 font-medium ${diag.geminiConfigured ? 'text-emerald-600' : 'text-amber-600'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${diag.geminiConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span>Gemini AI ({diag.geminiModel}): {diag.geminiConfigured ? 'พร้อมตอบ' : 'ยังไม่ได้ใส่ API Key'}</span>
        </span>

        <span className={`inline-flex items-center gap-1.5 font-medium ${whFailed ? 'text-rose-600' : wh.receivedCount > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${whFailed ? 'bg-rose-500' : wh.receivedCount > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <span className="tabular-nums">
            Webhook ล่าสุด: {formatTime(wh.lastReceivedAt)} (รับแล้ว {wh.receivedCount})
          </span>
        </span>
      </div>

      {wh.lastError && (
        <div className="text-xs text-rose-600 font-medium pt-1 border-t border-divider">
          สาเหตุล่าสุด ({wh.lastStatus}): {wh.lastError}
        </div>
      )}
    </div>
  );
};
