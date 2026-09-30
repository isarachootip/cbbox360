import React, { useState } from 'react';
import { Plus, User, Phone, Mail, MessageSquare, Edit2, Trash2, Star, Building2 } from 'lucide-react';
import { Customer, ContactPerson } from '../../types';
import { ContactModal } from './ContactModal';
import { useCustomer } from '../../context/CustomerContext';
import { useToast } from '../../context/ToastContext';

interface ContactsTabProps {
  customer: Customer;
}

export const ContactsTab: React.FC<ContactsTabProps> = ({ customer }) => {
  const { addContact, updateContact, deleteContact } = useCustomer();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);

  const contacts = customer.contacts || [];

  const handleOpenAdd = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: ContactPerson) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleDelete = (contactId: string, name: string) => {
    if (confirm(`คุณต้องการลบข้อมูลผู้ติดต่อ "${name}" หรือไม่?`)) {
      deleteContact(customer.id, contactId);
      showToast(`ลบผู้ติดต่อ "${name}" เรียบร้อยแล้ว`, 'info');
    }
  };

  const handleSetPrimary = (contact: ContactPerson) => {
    updateContact(customer.id, { ...contact, isPrimary: true });
    showToast(`ตั้ง "${contact.name}" เป็นผู้ติดต่อหลักเรียบร้อยแล้ว`, 'success');
  };

  const handleSaveContact = (data: Omit<ContactPerson, 'id'>) => {
    if (editingContact) {
      updateContact(customer.id, { ...data, id: editingContact.id });
      showToast(`อัปเดตข้อมูลผู้ติดต่อ "${data.name}" แล้ว`, 'success');
    } else {
      addContact(customer.id, data);
      showToast(`เพิ่มผู้ติดต่อ "${data.name}" เรียบร้อยแล้ว`, 'success');
    }
  };

  return (
    <div className="space-y-4">
      {/* Corporate Metadata Card */}
      {customer.customerType === 'CORPORATE' && (
        <div className="bg-bg-subtle p-3.5 rounded-lg border border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-tint text-brand flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-text-primary text-[13px]">
                {customer.companyName || customer.name}
              </div>
              <div className="text-text-secondary flex items-center gap-2 mt-0.5 font-mono text-[11px]">
                <span>เลขผู้เสียภาษี: {customer.taxId || '-'}</span>
                <span>•</span>
                <span>สาขา: {customer.branchCode === '00000' ? 'สำนักงานใหญ่ (00000)' : customer.branchCode || '-'}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 text-blue-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>ลูกค้าองค์กร (B2B)</span>
            </span>
          </div>
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-secondary">
          รายชื่อผู้มีอำนาจติดต่อและประสานงาน ({contacts.length} ท่าน)
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ เพิ่มผู้ติดต่อ</span>
        </button>
      </div>

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-lg bg-bg-app">
          <User className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
          <div className="text-xs font-semibold text-text-primary">ยังไม่มีรายชื่อผู้ติดต่อ</div>
          <p className="text-[11px] text-text-secondary mt-1">
            กดปุ่ม "+ เพิ่มผู้ติดต่อ" เพื่อบันทึกรายชื่อผู้ประสานงาน ฝ่ายจัดซื้อ หรือฝ่ายบัญชี
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-3.5 rounded-lg border transition-all bg-white flex flex-col justify-between ${
                contact.isPrimary ? 'border-brand/40 shadow-xs ring-1 ring-brand/10' : 'border-border hover:border-border/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-text-primary">{contact.name}</span>
                    {contact.isPrimary && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>ผู้ติดต่อหลัก</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!contact.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(contact)}
                        title="ตั้งเป็นผู้ติดต่อหลัก"
                        className="p-1 text-text-secondary hover:text-amber-600 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(contact)}
                      title="แก้ไข"
                      className="p-1 text-text-secondary hover:text-brand transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id, contact.name)}
                      title="ลบ"
                      className="p-1 text-text-secondary hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 text-blue-600 font-medium text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{contact.roleOrTitle}</span>
                  </span>
                </div>

                <div className="mt-2.5 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-text-primary">
                    <Phone className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                    <span className="font-mono font-medium">{contact.phone}</span>
                  </div>
                  {contact.email && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Mail className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.lineId && (
                    <div className="flex items-center gap-2 text-[#0B6B34]">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono text-[11px]">LINE: {contact.lineId}</span>
                    </div>
                  )}
                  {contact.notes && (
                    <p className="mt-2 text-[11px] text-text-secondary bg-bg-app p-2 rounded border border-border/60">
                      {contact.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveContact}
        initialData={editingContact}
      />
    </div>
  );
};
