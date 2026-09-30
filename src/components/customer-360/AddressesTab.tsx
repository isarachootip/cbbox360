import React, { useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { Customer, CustomerAddress } from '../../types';
import { AddressModal } from './AddressModal';
import { AddressCard } from './AddressCard';
import { useCustomer } from '../../context/CustomerContext';
import { useToast } from '../../context/ToastContext';

interface AddressesTabProps {
  customer: Customer;
}

export const AddressesTab: React.FC<AddressesTabProps> = ({ customer }) => {
  const { addAddress, updateAddress, deleteAddress, setDefaultAddress } = useCustomer();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  const addresses = customer.addresses || [];

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleDelete = (addrId: string, title: string) => {
    if (confirm(`คุณต้องการลบที่อยู่ "${title}" หรือไม่?`)) {
      deleteAddress(customer.id, addrId);
      showToast(`ลบที่อยู่ "${title}" เรียบร้อยแล้ว`, 'info');
    }
  };

  const handleSaveAddress = (data: Omit<CustomerAddress, 'id'>) => {
    if (editingAddress) {
      updateAddress(customer.id, { ...data, id: editingAddress.id });
      showToast(`อัปเดตที่อยู่ "${data.title}" แล้ว`, 'success');
    } else {
      addAddress(customer.id, data);
      showToast(`เพิ่มที่อยู่ "${data.title}" เรียบร้อยแล้ว`, 'success');
    }
  };

  const handleSetDefaultShipping = (addrId: string, title: string) => {
    setDefaultAddress(customer.id, addrId, 'shipping');
    showToast(`ตั้ง "${title}" เป็นที่อยู่จัดส่งหลักแล้ว`, 'success');
  };

  const handleSetDefaultBilling = (addrId: string, title: string) => {
    setDefaultAddress(customer.id, addrId, 'billing');
    showToast(`ตั้ง "${title}" เป็นใบกำกับภาษีหลักแล้ว`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-secondary">
          สมุดที่อยู่และพิกัดแผนที่จัดส่ง ({addresses.length} สถานที่)
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ เพิ่มที่อยู่ & พิกัด</span>
        </button>
      </div>

      {/* Address Cards List */}
      {addresses.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-lg bg-bg-app">
          <MapPin className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
          <div className="text-xs font-semibold text-text-primary">ยังไม่มีข้อมูลที่อยู่และพิกัด</div>
          <p className="text-[11px] text-text-secondary mt-1">
            บันทึกที่อยู่ออกใบกำกับภาษี หรือปักหมุดโกดังจัดส่งสินค้าด้วย Google Maps
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onSetDefaultShipping={handleSetDefaultShipping}
              onSetDefaultBilling={handleSetDefaultBilling}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveAddress}
        initialData={editingAddress}
      />
    </div>
  );
};
