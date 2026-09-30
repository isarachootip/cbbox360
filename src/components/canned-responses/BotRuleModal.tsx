import React from 'react';
import { Modal } from '../common/Modal';
import { CannedResponse } from '../../types';

export interface BotRuleFormData {
  name: string;
  triggerType: 'keyword';
  keywordsStr: string;
  matchType: 'contains' | 'exact';
  cannedResponseId: string;
  customReplyText: string;
  isActive: boolean;
  priority: number;
}

interface BotRuleModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: BotRuleFormData;
  setFormData: React.Dispatch<React.SetStateAction<BotRuleFormData>>;
  cannedResponses: CannedResponse[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const BotRuleModal: React.FC<BotRuleModalProps> = ({
  isOpen,
  mode,
  formData,
  setFormData,
  cannedResponses,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'สร้างกฎ Auto-Reply ใหม่' : 'แก้ไขกฎ Auto-Reply'}
      maxWidth="xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">
            ชื่อกฎ / หัวข้อ <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="เช่น แจ้งเลขที่บัญชีธนาคาร"
            className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">
            คำสำคัญที่ตรวจจับ (Keywords คั่นด้วยจุลภาค ,) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.keywordsStr}
            onChange={(e) => setFormData({ ...formData, keywordsStr: e.target.value })}
            placeholder="เช่น เลขบัญชี, โอนเงิน, ชำระเงิน, จ่ายเงิน"
            className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
          />
          <span className="text-[10px] text-text-secondary mt-1 block">
            หากลูกค้าพิมพ์คำใดคำหนึ่งในนี้ บอทจะเลือกข้อความนี้ไปตอบทันที
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              รูปแบบการจับคู่คำ
            </label>
            <select
              value={formData.matchType}
              onChange={(e) =>
                setFormData({ ...formData, matchType: e.target.value as 'contains' | 'exact' })
              }
              className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand"
            >
              <option value="contains">มีคำนี้อยู่ในประโยค (Contains)</option>
              <option value="exact">ตรงกันทุกตัวอักษรเป๊ะๆ (Exact)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              ลำดับความสำคัญ (Priority)
            </label>
            <input
              type="number"
              min={1}
              max={99}
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: parseInt(e.target.value) || 10 })
              }
              className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">
            เลือกข้อความสำเร็จรูปจากคลัง (Canned Response)
          </label>
          <select
            value={formData.cannedResponseId}
            onChange={(e) =>
              setFormData({ ...formData, cannedResponseId: e.target.value })
            }
            className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand font-medium"
          >
            <option value="">-- กำหนดข้อความเฉพาะเอง (Custom Text) --</option>
            {cannedResponses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortcut} - {c.title}
              </option>
            ))}
          </select>
        </div>

        {!formData.cannedResponseId && (
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              ข้อความตอบกลับเฉพาะ (Custom Reply Text)
            </label>
            <textarea
              rows={3}
              value={formData.customReplyText}
              onChange={(e) =>
                setFormData({ ...formData, customReplyText: e.target.value })
              }
              placeholder="ระบุข้อความที่ต้องการให้บอทตอบ..."
              className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand leading-relaxed"
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="botRuleActiveCheck"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-border text-brand focus:ring-brand"
          />
          <label htmlFor="botRuleActiveCheck" className="text-xs font-semibold text-text-primary cursor-pointer">
            เปิดใช้งานกฎนี้ทันที
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-divider">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border text-text-secondary hover:bg-bg-app rounded-lg text-xs font-semibold"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-bold shadow-xs"
          >
            บันทึกกฎ
          </button>
        </div>
      </form>
    </Modal>
  );
};
