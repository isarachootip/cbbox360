import React from 'react';
import { Eye } from 'lucide-react';
import { Modal } from '../common/Modal';
import { CATEGORIES_CONFIG } from '../../context/CannedResponseContext';
import { CannedResponseCategory } from '../../types';

export interface CannedResponseFormData {
  title: string;
  shortcut: string;
  category: CannedResponseCategory;
  content: string;
  tagsString: string;
  isActive: boolean;
}

interface CannedResponseModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: CannedResponseFormData;
  setFormData: React.Dispatch<React.SetStateAction<CannedResponseFormData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  replaceVariables: (text: string) => string;
}

export const CannedResponseModal: React.FC<CannedResponseModalProps> = ({
  isOpen,
  mode,
  formData,
  setFormData,
  onClose,
  onSubmit,
  replaceVariables,
}) => {
  const insertVariableIntoContent = (varName: string) => {
    const placeholder = `{${varName}}`;
    setFormData((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content} ${placeholder}` : placeholder,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'สร้างข้อความตอบกลับด่วน (Quick Reply)' : 'แก้ไขข้อความตอบกลับด่วน'}
      maxWidth="xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Category Picker */}
        <div>
          <label className="block text-xs font-bold text-text-primary mb-1.5">
            หมวดหมู่ (Category) <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES_CONFIG.map((cat) => (
              <button
                type="button"
                key={cat.key}
                onClick={() => setFormData({ ...formData, category: cat.key as CannedResponseCategory })}
                className={`p-2.5 rounded-lg border text-left transition-all flex items-center gap-2 ${
                  formData.category === cat.key
                    ? 'border-brand bg-brand-tint text-brand font-bold shadow-2xs'
                    : 'border-border bg-bg-app hover:bg-white text-text-secondary'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="text-xs truncate">{cat.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Shortcut and Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              คีย์ลัด (Shortcut) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="/ส่งเลขพัสดุ หรือ /greeting"
              value={formData.shortcut}
              onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all"
            />
            <span className="text-[10px] text-text-secondary mt-0.5 block">
              ขึ้นต้นด้วยเครื่องหมาย <code className="bg-slate-100 px-1 rounded">/</code> เพื่อเรียกใช้ง่าย
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              ชื่อหัวข้อ (Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น แจ้งหมายเลขพัสดุและลิงก์ติดตาม"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Content Message Area + Smart Variable Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-text-primary">
              เนื้อหาข้อความ (Message Template) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-brand font-medium">
              💡 คลิกแท็กตัวแปรด้านล่างเพื่อแทรกอัตโนมัติ
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-2 p-2 bg-brand-tint/40 border border-brand/20 rounded-lg">
            <span className="text-[11px] font-bold text-brand flex-shrink-0">ตัวแปรระบบ:</span>
            <button
              type="button"
              onClick={() => insertVariableIntoContent('customer_name')}
              className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-brand hover:text-white border border-brand/30 text-brand font-medium transition-all shadow-2xs"
            >
              + {'{customer_name}'} (ชื่อลูกค้า)
            </button>
            <button
              type="button"
              onClick={() => insertVariableIntoContent('order_code')}
              className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-brand hover:text-white border border-brand/30 text-brand font-medium transition-all shadow-2xs"
            >
              + {'{order_code}'} (เลขคำสั่งซื้อ)
            </button>
            <button
              type="button"
              onClick={() => insertVariableIntoContent('tracking_no')}
              className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-brand hover:text-white border border-brand/30 text-brand font-medium transition-all shadow-2xs"
            >
              + {'{tracking_no}'} (เลขพัสดุ)
            </button>
            <button
              type="button"
              onClick={() => insertVariableIntoContent('agent_name')}
              className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-brand hover:text-white border border-brand/30 text-brand font-medium transition-all shadow-2xs"
            >
              + {'{agent_name}'} (ชื่อแอดมิน)
            </button>
          </div>

          <textarea
            required
            rows={4}
            placeholder="พิมพ์ข้อความที่ต้องการใช้ตอบลูกค้า..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-3 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all font-sans leading-relaxed resize-y"
          />
        </div>

        {/* Live Preview Simulation Box */}
        <div>
          <label className="text-[11px] font-bold text-text-secondary mb-1 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-brand" />
            <span>ตัวอย่างข้อความจริงเมื่อส่งถึงลูกค้า (Live Preview):</span>
          </label>
          <div className="p-3 bg-[#EAF2FC]/60 rounded-xl border border-border/80 flex flex-col items-end">
            <div className="bg-brand text-white p-3 rounded-2xl rounded-tr-sm text-xs leading-relaxed max-w-[85%] shadow-xs">
              {formData.content
                ? replaceVariables(formData.content)
                : 'ตัวอย่างข้อความจะแสดงที่นี่พร้อมแทนที่ชื่อลูกค้าและข้อมูลอัตโนมัติ...'}
            </div>
            <span className="text-[10px] text-text-secondary mt-1 font-mono">10:42 · วิภา ส.</span>
          </div>
        </div>

        {/* Tags & Active Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-divider">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              แท็กกำกับ (คั่นด้วยเครื่องหมายจุลภาค ,)
            </label>
            <input
              type="text"
              placeholder="เช่น ทักทาย, ด่วน, ธนาคาร"
              value={formData.tagsString}
              onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
            <label className="text-xs font-bold text-text-primary cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand"
              />
              <span>เปิดใช้งานข้อความนี้ทันที</span>
            </label>
          </div>
        </div>

        {/* Footer Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-divider">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border hover:bg-bg-subtle text-text-secondary rounded-lg text-xs font-semibold transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            {mode === 'create' ? 'บันทึกข้อความ' : 'บันทึกการแก้ไข'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
