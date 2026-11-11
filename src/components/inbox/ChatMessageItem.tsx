import React from 'react';
import {
  Lock,
  Clock,
  User,
  Check,
  CheckCircle,
  CheckSquare,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { ChatMessage, TaskDetails } from '../../types';

interface ChatMessageItemProps {
  msg: ChatMessage;
  onRetry?: (messageId: string, text: string) => void;
  onUpdateTaskStatus?: (messageId: string, status: TaskDetails['status']) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  onRetry,
  onUpdateTaskStatus,
}) => {
  // 1. Task Card
  if (msg.task) {
    const task = msg.task;
    const prConfig =
      task.priority === 'ด่วนที่สุด'
        ? { dot: 'bg-rose-500', text: 'text-rose-600' }
        : task.priority === 'ด่วน'
        ? { dot: 'bg-amber-500', text: 'text-amber-600' }
        : { dot: 'bg-blue-500', text: 'text-blue-600' };

    return (
      <div className="w-full bg-white border border-border rounded-xl p-4 space-y-2.5 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-800">
            <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>{task.title}</span>
          </div>
          <span className="font-mono text-[11px] text-text-secondary tabular-nums">#{task.id}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-2.5 px-3 rounded-lg bg-bg-subtle border border-divider text-xs">
          <div>
            <span className="text-text-secondary block text-[11px]">ผู้รับมอบหมาย</span>
            <span className="font-semibold text-text-primary flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-text-secondary" />
              <span>{task.assignee}</span>
            </span>
          </div>
          <div>
            <span className="text-text-secondary block text-[11px]">กำหนดเสร็จ (Due Date)</span>
            <span className="font-mono text-text-primary tabular-nums flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-text-secondary" />
              <span>{task.dueDate}</span>
            </span>
          </div>
          <div>
            <span className="text-text-secondary block text-[11px]">ระดับความสำคัญ</span>
            <span className={`inline-flex items-center gap-1.5 font-semibold mt-0.5 ${prConfig.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${prConfig.dot}`} />
              <span>{task.priority}</span>
            </span>
          </div>
        </div>

        {onUpdateTaskStatus && (
          <div className="flex items-center justify-between pt-1.5 border-t border-divider select-none">
            <span className="text-[11px] text-text-secondary">อัปเดตสถานะงานได้ทันที</span>
            <div className="flex items-center gap-2">
              {task.status !== 'Completed' ? (
                <>
                  {task.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => onUpdateTaskStatus(msg.id, 'In Progress')}
                      className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-bg-subtle text-blue-600 font-semibold transition-colors"
                    >
                      เริ่มทำ (In Progress)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onUpdateTaskStatus(msg.id, 'Completed')}
                    className="text-xs px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Check className="w-3 h-3" />
                    <span>ทำเสร็จแล้ว</span>
                  </button>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>งานเสร็จสมบูรณ์เรียบร้อยแล้ว</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Private Note
  if (msg.isPrivateNote) {
    return (
      <div className="w-full bg-warn-bg border border-dashed border-warn-border rounded-xl p-3.5 text-warn-text shadow-2xs">
        <div className="flex items-center justify-between text-[11px] font-bold tracking-wide select-none">
          <span className="flex items-center gap-1.5 text-amber-800">
            <Lock className="w-3 h-3" />
            <span>PRIVATE NOTE · ลูกค้าไม่เห็น</span>
          </span>
          <span className="font-mono tabular-nums text-amber-700">
            {msg.time} · {msg.authorName}
          </span>
        </div>
        <p className="text-[13.5px] text-[#5C3900] mt-1.5 font-medium leading-[1.65] whitespace-pre-wrap">
          {msg.text}
        </p>
      </div>
    );
  }

  // 3. Regular Chat Bubble
  const isCustomer = msg.sender === 'customer';
  const isFailed = msg.deliveryStatus === 'failed';
  const isSending = msg.deliveryStatus === 'sending';

  return (
    <div className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}>
      <div
        className={`max-w-[75%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-[14px] leading-[1.65] shadow-card whitespace-pre-wrap ${
          isCustomer
            ? 'bg-white border border-border text-text-primary rounded-tl-sm'
            : isFailed
            ? 'bg-rose-50 border border-rose-300 text-rose-900 rounded-tr-sm'
            : 'bg-brand text-white rounded-tr-sm'
        }`}
      >
        <p>{msg.text}</p>
        {msg.trackingNumber && (
          <div className="mt-2 pt-2 border-t border-white/20 font-mono text-xs bg-black/15 px-2.5 py-1 rounded-md">
            📦 Track: {msg.trackingNumber}
          </div>
        )}
      </div>

      {!isCustomer && isFailed && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium select-none">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>ส่งเข้า LINE ไม่สำเร็จ {msg.failureReason ? `(${msg.failureReason})` : ''}</span>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(msg.id, msg.text)}
              className="ml-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-2.5 h-2.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {!isCustomer && isSending && (
        <div className="text-[11px] text-text-secondary mt-1 font-mono animate-pulse select-none">
          กำลังส่ง...
        </div>
      )}

      <span className="text-[11px] text-text-secondary mt-1 px-1 font-mono tabular-nums flex items-center gap-1 select-none">
        <span>{msg.time}</span>
        {msg.authorName && (
          <span
            className={`font-sans ${
              msg.botSource === 'bot_gemini' ||
              msg.authorName.includes('AI') ||
              msg.authorName.includes('Gemini')
                ? 'text-purple-600 font-semibold'
                : msg.authorName.includes('Bot')
                ? 'text-brand font-semibold'
                : ''
            }`}
          >
            · {msg.authorName}
          </span>
        )}
      </span>
    </div>
  );
};
