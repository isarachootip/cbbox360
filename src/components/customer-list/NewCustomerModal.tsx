import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { TierType, CreditGrade, Customer, CustomerType } from '../../types';
import { User, Building2 } from 'lucide-react';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerData: {
    name: string;
    phone: string;
    email: string;
    tier: TierType;
    creditGrade: CreditGrade;
    creditLimit?: number;
    customerType?: CustomerType;
    companyName?: string;
    taxId?: string;
    branchCode?: string;
    contacts?: any[];
  }) => Customer;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [customerType, setCustomerType] = useState<CustomerType>('INDIVIDUAL');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tier: 'MEMBER' as TierType,
    creditGrade: 'B' as CreditGrade,
    creditLimit: '50000',
    taxId: '',
    branchCode: '00000',
    contactName: '',
    contactRole: 'ผู้จัดการฝ่ายจัดซื้อ',
    contactPhone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    const contacts = customerType === 'CORPORATE' && formData.contactName.trim() ? [
      {
        id: `cnt-${Date.now()}`,
        name: formData.contactName.trim(),
        roleOrTitle: formData.contactRole.trim() || 'ผู้ติดต่อหลัก',
        phone: formData.contactPhone.trim() || formData.phone.trim(),
        email: formData.email.trim() || undefined,
        isPrimary: true,
      }
    ] : [
      {
        id: `cnt-${Date.now()}`,
        name: formData.name.trim(),
        roleOrTitle: 'ผู้สั่งซื้อ',
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        isPrimary: true,
      }
    ];

    onSubmit({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      tier: formData.tier,
      creditGrade: formData.creditGrade,
      creditLimit: Number(formData.creditLimit) || 50000,
      customerType,
      companyName: customerType === 'CORPORATE' ? formData.name.trim() : undefined,
      taxId: customerType === 'CORPORATE' ? formData.taxId.trim() : undefined,
      branchCode: customerType === 'CORPORATE' ? formData.branchCode.trim() : undefined,
      contacts,
    });

    setFormData({
      name: '',
      phone: '',
      email: '',
      tier: 'MEMBER',
      creditGrade: 'B',
      creditLimit: '50000',
      taxId: '',
      branchCode: '00000',
      contactName: '',
      contactRole: 'ผู้จัดการฝ่ายจัดซื้อ',
      contactPhone: '',
    });
    setCustomerType('INDIVIDUAL');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="เพิ่มข้อมูลลูกค้าใหม่ใน CDP"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-text-secondary hover:bg-bg-subtle transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            บันทึกข้อมูล
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-bg-subtle rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setCustomerType('INDIVIDUAL')}
            className={`py-1.5 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
              customerType === 'INDIVIDUAL' ? 'bg-white shadow-xs text-brand' : 'text-text-secondary'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>บุคคลธรรมดา (B2C)</span>
          </button>
          <button
            type="button"
            onClick={() => setCustomerType('CORPORATE')}
            className={`py-1.5 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
              customerType === 'CORPORATE' ? 'bg-white shadow-xs text-brand' : 'text-text-secondary'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>นิติบุคคล / องค์กร (B2B)</span>
          </button>
        </div>

        <div>
          <label className="block text-text-secondary font-medium mb-1">
            {customerType === 'CORPORATE' ? 'ชื่อบริษัท / องค์กร' : 'ชื่อ-นามสกุล ลูกค้า'} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={customerType === 'CORPORATE' ? 'เช่น บริษัท นำชัยการพิมพ์ จำกัด' : 'เช่น คุณสมชาย ใจดี'}
            className="w-full px-3 py-2 border border-border rounded-lg focus:border-brand bg-white text-text-primary"
          />
        </div>

        {customerType === 'CORPORATE' && (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-text-secondary font-medium mb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="0105558xxxxxx"
                className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">รหัสสาขา</label>
              <input
                type="text"
                value={formData.branchCode}
                onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                placeholder="00000 (สำนักงานใหญ่)"
                className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-text-secondary font-medium mb-1">
              เบอร์โทรหลัก <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="08x-xxx-xxxx"
              className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">อีเมลติดต่อ</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@company.com"
              className="w-full px-3 py-2 border border-border rounded-lg text-xs"
            />
          </div>
        </div>

        {customerType === 'CORPORATE' && (
          <div className="p-2.5 rounded-lg border border-border bg-bg-subtle/50 space-y-2">
            <span className="text-[11px] font-semibold text-text-primary block">ผู้ติดต่อหลัก (Primary Contact)</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="ชื่อผู้ติดต่อ เช่น คุณสมเกียรติ"
                className="px-2.5 py-1.5 border border-border rounded text-xs bg-white"
              />
              <input
                type="text"
                value={formData.contactRole}
                onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                placeholder="ตำแหน่ง เช่น ฝ่ายจัดซื้อ"
                className="px-2.5 py-1.5 border border-border rounded text-xs bg-white"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-text-secondary font-medium mb-1">ระดับ (Tier)</label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value as TierType })}
              className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs"
            >
              <option value="MEMBER">MEMBER</option>
              <option value="SILVER">SILVER</option>
              <option value="GOLD">GOLD</option>
              <option value="PLATINUM">PLATINUM</option>
            </select>
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">เกรดเครดิต</label>
            <select
              value={formData.creditGrade}
              onChange={(e) => setFormData({ ...formData, creditGrade: e.target.value as CreditGrade })}
              className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs"
            >
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="D">Grade D</option>
            </select>
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">วงเงินเริ่มต้น (฿)</label>
            <input
              type="number"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-mono"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
