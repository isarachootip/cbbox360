import React from 'react';
import { Modal } from '../common/Modal';
import { KnowledgeCategory } from '../../types';

export interface KnowledgeItemFormData {
  title: string;
  category: KnowledgeCategory;
  content: string;
  tagsStr: string;
  isActive: boolean;
}

interface KnowledgeItemModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: KnowledgeItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<KnowledgeItemFormData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  company_info: 'ข้อมูลบริษัท & สาขา (Company Info)',
  services_products: 'สินค้า & บริการหลัก (Products & Services)',
  policies_sla: 'นโยบายการรับประกัน & SLA (Policies & SLA)',
  payment_credit: 'การชำระเงิน, ประกัน & สินเชื่อ (Payment & Credit)',
  faq: 'คำถามที่พบบ่อยทั่วไป (General FAQ)',
};

export const KnowledgeItemModal: React.FC<KnowledgeItemModalProps> = ({
  isOpen,
  mode,
  formData,
  setFormData,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'create'
          ? 'เพิ่มหัวข้อความรู้ใหม่สำหรับ AI (Add Knowledge Item)'
          : 'แก้ไขหัวข้อความรู้สำหรับ AI (Edit Knowledge Item)'
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">
            หัวข้อความรู้ / คำถามที่ลูกค้ามักถาม *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="เช่น เงื่อนไขการรับประกันสินค้า / สิทธิ์ประกันสุขภาพที่รองรับ"
            className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              หมวดหมู่ความรู้ (Category)
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value as KnowledgeCategory,
                }))
              }
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white focus:outline-none focus:border-brand text-text-primary"
            >
              {(Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {KNOWLEDGE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              คำค้นหา / Tags (คั่นด้วยเครื่องหมายจุลภาค ,)
            </label>
            <input
              type="text"
              value={formData.tagsStr}
              onChange={(e) => setFormData((prev) => ({ ...prev, tagsStr: e.target.value }))}
              placeholder="เช่น ประกัน, เคลม, เช็คสิทธิ์, ราคา"
              className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">
            เนื้อหาความรู้สำหรับให้ AI ใช้อ้างอิงตอบลูกค้า *
          </label>
          <textarea
            rows={4}
            required
            value={formData.content}
            onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="ระบุข้อเท็จจริง เงื่อนไข ราคา หรือขั้นตอนบริการอย่างชัดเจน เพื่อให้ AI นำไปสรุปและตอบลูกค้าได้อย่างแม่นยำ..."
            className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary leading-relaxed"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
            className="rounded text-brand focus:ring-brand"
          />
          <span className="text-xs font-semibold text-text-primary">
            เปิดใช้งานหัวข้อนี้ใน AI System Prompt ทันที
          </span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs"
          >
            {mode === 'create' ? 'เพิ่มหัวข้อความรู้' : 'บันทึกการแก้ไข'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
