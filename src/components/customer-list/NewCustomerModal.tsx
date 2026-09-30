import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { TierType, CreditGrade, Customer } from '../../types';

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
  }) => Customer;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tier: 'MEMBER' as TierType,
    creditGrade: 'B' as CreditGrade,
    creditLimit: '50000',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      return;
    }
    onSubmit({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      tier: formData.tier,
      creditGrade: formData.creditGrade,
      creditLimit: Number(formData.creditLimit) || 50000,
    });
    // Reset form
    setFormData({
      name: '',
      phone: '',
      email: '',
      tier: 'MEMBER',
      creditGrade: 'B',
      creditLimit: '50000',
    });
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
            className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            บันทึกข้อมูล
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block text-text-secondary font-medium mb-1">
            ชื่อ-นามสกุล / ชื่อองค์กร <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="เช่น บจก. นวัตกรรมสยาม หรือ คุณประสิทธิ์ วัฒนา"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-bg-app focus:bg-white text-text-primary transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-text-secondary font-medium mb-1">
              เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="081-xxx-xxxx"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-bg-app focus:bg-white text-text-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">อีเมล</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-bg-app focus:bg-white text-text-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-text-secondary font-medium mb-1">ระดับสมาชิก (Tier)</label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value as TierType })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-bg-app focus:bg-white text-text-primary transition-colors cursor-pointer"
            >
              <option value="MEMBER">MEMBER</option>
              <option value="SILVER">SILVER</option>
              <option value="GOLD">GOLD</option>
              <option value="PLATINUM">PLATINUM</option>
            </select>
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">เกรดสินเชื่อ</label>
            <select
              value={formData.creditGrade}
              onChange={(e) => setFormData({ ...formData, creditGrade: e.target.value as CreditGrade })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-bg-app focus:bg-white text-text-primary transition-colors cursor-pointer"
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
              placeholder="50000"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-bg-app focus:bg-white text-text-primary transition-colors"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
