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
      <div className="w-full bg-white border border-border rounded-xl p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>{task.title}</span>
          </div>
          <span className="font-mono text-[10px] text-text-secondary">#{task.id}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-bg-app text-[11px]">
          <div>
            <span className="text-text-secondary block text-[10px]">ผู้รับมอบหมาย</span>
            <span className="font-semibold text-text-primary flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-text-secondary" />
              <span>{task.assignee}</span>
            </span>
          </div>
          <div>
            <span className="text-text-secondary block text-[10px]">กำหนดเสร็จ (Due Date)</span>
            <span className="font-mono text-text-primary flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-text-secondary" />
              <span>{task.dueDate}</span>
            </span>
          </div>
          <div>
            <span className="text-text-secondary block text-[10px]">ระดับความสำคัญ</span>
            <span className={`inline-flex items-center gap-1 font-semibold mt-0.5 ${prConfig.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${prConfig.dot}`} />
              <span>● {task.priority}</span>
            </span>
          </div>
        </div>

        {onUpdateTaskStatus && (
          <div className="flex items-center justify-between pt-1 border-t border-divider">
            <span className="text-[10px] text-text-secondary font-mono">อัปเดตสถานะงานได้ทันที</span>
            <div className="flex items-center gap-2">
              {task.status !== 'Completed' ? (
                <>
                  {task.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => onUpdateTaskStatus(msg.id, 'In Progress')}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-border hover:bg-bg-subtle text-blue-600 font-semibold transition-colors"
                    >
                      เริ่มทำ (In Progress)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onUpdateTaskStatus(msg.id, 'Completed')}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Check className="w-3 h-3" />
                    <span>ทำเสร็จแล้ว (Done)</span>
                  </button>
                </>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
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
      <div className="w-full bg-warn-bg border border-dashed border-warn-border rounded-lg p-3 text-warn-text shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-bold tracking-wide">
          <span className="flex items-center gap-1 text-amber-800">
            <Lock className="w-3 h-3" />
            <span>PRIVATE NOTE · ลูกค้าไม่เห็น</span>
          </span>
          <span className="font-mono text-amber-700">
            {msg.time} · {msg.authorName}
          </span>
        </div>
        <p className="text-xs text-[#633E00] mt-1 font-medium leading-relaxed">{msg.text}</p>
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
        className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
          isCustomer
            ? 'bg-white border border-border text-text-primary rounded-tl-sm'
            : isFailed
            ? 'bg-rose-50 border border-rose-300 text-rose-900 rounded-tr-sm'
            : 'bg-brand text-white rounded-tr-sm'
        }`}
      >
        <p>{msg.text}</p>
        {msg.trackingNumber && (
          <div className="mt-2 pt-2 border-t border-white/20 font-mono text-[11px] bg-black/10 px-2 py-1 rounded">
            📦 Track: {msg.trackingNumber}
          </div>
        )}
      </div>

      {/* Delivery status indicator */}
      {!isCustomer && isFailed && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-600 mt-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>ส่งเข้า LINE ไม่สำเร็จ {msg.failureReason ? `(${msg.failureReason})` : ''}</span>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(msg.id, msg.text)}
              className="ml-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-2.5 h-2.5" />
              <span>ลองส่งใหม่ (Retry)</span>
            </button>
          )}
        </div>
      )}

      {!isCustomer && isSending && (
        <div className="text-[10px] text-text-secondary mt-1 font-mono animate-pulse">
          กำลังส่ง...
        </div>
      )}

      <span className="text-[10px] text-text-secondary mt-1 px-1 font-mono flex items-center gap-1">
        <span>{msg.time}</span>
        {msg.authorName && (
          <span
            className={
              msg.authorName.includes('Bot') ? 'text-brand font-semibold flex items-center gap-0.5' : ''
            }
          >
            · {msg.authorName}
          </span>
        )}
      </span>
    </div>
  );
};
