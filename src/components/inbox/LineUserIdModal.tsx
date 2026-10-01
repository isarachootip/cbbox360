import React, { useState } from 'react';
import { X, MessageSquare, AlertCircle, Check } from 'lucide-react';

interface LineUserIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  customerName: string;
  currentLineUserId?: string;
  onSave: (lineUserId: string) => Promise<boolean>;
}

export const LineUserIdModal: React.FC<LineUserIdModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  customerName,
  currentLineUserId = '',
  onSave,
}) => {
  const [lineUserId, setLineUserId] = useState(currentLineUserId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineUserId.trim()) {
      setErrorMsg('กรุณากรอก LINE User ID');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    const success = await onSave(lineUserId.trim());
    setIsSubmitting(false);

    if (success) {
      onClose();
    } else {
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึก LINE User ID');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-text-primary">ตั้งค่า LINE User ID</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <div className="text-text-secondary mb-1">ห้องแชท: <span className="font-semibold text-text-primary">#{conversationId}</span> · ลูกค้า: <span className="font-semibold text-text-primary">{customerName}</span></div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              ระบุ LINE User ID ของผู้ใช้ (เช่น <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">U1234567890abcdef1234567890abcdef</code>) เพื่อให้ระบบสามารถส่งข้อความ Push กลับไปยังแอป LINE ได้จริง
            </p>
          </div>

          <div>
            <label className="block font-semibold text-text-primary mb-1.5">
              LINE User ID
            </label>
            <input
              type="text"
              value={lineUserId}
              onChange={(e) => {
                setLineUserId(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              autoFocus
            />
            {errorMsg && (
              <div className="flex items-center gap-1 text-rose-600 mt-1.5 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 leading-relaxed">
            💡 <strong>วิธีดู LINE User ID:</strong> เมื่อลูกค้าทัก LINE เข้ามา ID จะถูกบันทึกอัตโนมัติ หรือดูได้จาก LINE Developers Console &gt; Webhook logs ของ Channel
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-divider">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-border text-text-primary hover:bg-slate-100 transition-colors font-medium cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกและผูก ID'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
