import React from 'react';
import { Phone, Mail, MessageSquare, Edit2, Trash2, Star } from 'lucide-react';
import type { ContactPerson } from '../../types';
import { ClickToCallButton } from '../common/ClickToCallButton';

interface ContactCardProps {
  contact: ContactPerson;
  customerId?: string;
  customerName?: string;
  onSetPrimary: (contact: ContactPerson) => void;
  onEdit: (contact: ContactPerson) => void;
  onDelete: (contactId: string, name: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  customerId,
  customerName,
  onSetPrimary,
  onEdit,
  onDelete,
}) => (
  <div
    className={`p-3.5 rounded-lg border transition-all bg-white flex flex-col justify-between ${
      contact.isPrimary
        ? 'border-brand/40 shadow-xs ring-1 ring-brand/10'
        : 'border-border hover:border-border/80'
    }`}
  >
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-[13px] text-text-primary">
            {contact.name}
            {contact.nickname && (
              <span className="ml-1 font-normal text-xs text-text-secondary">
                ({contact.nickname})
              </span>
            )}
          </span>
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
              type="button"
              onClick={() => onSetPrimary(contact)}
              title="ตั้งเป็นผู้ติดต่อหลัก"
              className="p-1 text-text-secondary hover:text-amber-600 transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(contact)}
            title="แก้ไข"
            className="p-1 text-text-secondary hover:text-brand transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(contact.id, contact.name)}
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
          <ClickToCallButton
            phone={contact.phone}
            customerId={customerId}
            customerName={customerName}
            matchedContactName={contact.name}
          />
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
);
